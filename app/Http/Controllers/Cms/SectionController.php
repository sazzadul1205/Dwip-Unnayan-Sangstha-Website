<?php
// app/Http/Controllers/Cms/SectionController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use App\Models\pages\Page;
use App\Models\pages\SectionConfig;
use App\Models\pages\CustomSectionData;
use App\Models\pages\SharedData;
use App\Models\pages\Blog;
use App\Models\pages\Program;
use App\Models\pages\AboutContent;
use App\Models\pages\Publication;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SectionController extends Controller
{
  /**
   * Extract clean data from CustomSectionData model
   */
  protected function extractCustomSectionData(?CustomSectionData $customData): mixed
  {
    if (!$customData) {
      return null;
    }

    try {
      $rawData = $customData->data;

      if (is_string($rawData)) {
        $decodedData = json_decode($rawData, true);
        if ($decodedData !== null) {
          return $decodedData['data'] ?? $decodedData;
        }
        return $rawData;
      }

      return $rawData;
    } catch (\Exception $e) {
      Log::error('Failed to extract custom section data: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Extract clean data from SharedData model
   */
  protected function extractSharedData(?SharedData $shared): mixed
  {
    if (!$shared) {
      return null;
    }

    try {
      $rawData = $shared->data ?? $shared;

      if (is_string($rawData)) {
        $decodedData = json_decode($rawData, true);
        if ($decodedData !== null) {
          return $decodedData['data'] ?? $decodedData;
        }
        return $rawData;
      }

      return $rawData;
    } catch (\Exception $e) {
      Log::error('Failed to extract shared data: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Display a listing of sections for a specific page.
   */
  public function index(int $pageId)
  {
    try {
      $page = Page::withTrashed()->findOrFail($pageId);

      $sectionConfigs = SectionConfig::where('page_slug', $page->slug)
        ->orderBy('display_order')
        ->get();

      $customSectionData = CustomSectionData::where('page_slug', $page->slug)
        ->get()
        ->keyBy('section_key');

      $sharedData = SharedData::whereIn('type', $sectionConfigs->pluck('section_key'))
        ->get()
        ->keyBy('type');

      $sections = [];

      foreach ($sectionConfigs as $config) {
        $section = $config->toArray();

        try {
          switch ($config->data_table) {
            case 'custom_section_data':
              $section['data'] = $this->extractCustomSectionData(
                $customSectionData->get($config->section_key)
              );
              break;

            case 'shared_data':
              $section['data'] = $this->extractSharedData(
                $sharedData->get($config->section_key)
              );
              break;

            case 'blogs':
              $section['data'] = Blog::active()->latest()->get();
              break;

            case 'programs':
              $section['data'] = Program::active()->ordered()->get();
              break;

            case 'about_content':
              $aboutContent = AboutContent::where('slug', $config->section_key)
                ->active()
                ->first();
              $section['data'] = $aboutContent ? $aboutContent->data : null;
              break;

            case 'publications':
              $section['data'] = Publication::active()->latest()->get();
              break;

            default:
              $section['data'] = null;
              break;
          }
        } catch (\Exception $e) {
          Log::error('Failed to load data for section: ' . $config->section_key, [
            'error' => $e->getMessage(),
            'data_table' => $config->data_table
          ]);
          $section['data'] = null;
          $section['data_error'] = 'Failed to load data: ' . $e->getMessage();
        }

        $sections[] = $section;
      }

      return Inertia::render('Backend/CMS/Section/Index', [
        'page' => $page,
        'sections' => $sections,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to load sections page: ' . $e->getMessage(), [
        'page_id' => $pageId,
        'trace' => $e->getTraceAsString()
      ]);

      return Inertia::render('Backend/CMS/Section/Index', [
        'page' => null,
        'sections' => [],
        'flash' => ['error' => 'Failed to load sections: ' . $e->getMessage()]
      ]);
    }
  }

  /**
   * Update display order for multiple sections (drag & drop)
   */
  public function updateOrder(Request $request, int $pageId)
  {
    try {
      $page = Page::findOrFail($pageId);

      $validator = Validator::make($request->all(), [
        'orders' => 'required|array',
        'orders.*.id' => 'required|integer|exists:section_configs,id',
        'orders.*.display_order' => 'required|integer|min:0',
      ]);

      if ($validator->fails()) {
        return response()->json([
          'success' => false,
          'errors' => $validator->errors()
        ], 422);
      }

      DB::beginTransaction();

      foreach ($request->orders as $orderData) {
        $section = SectionConfig::where('id', $orderData['id'])
          ->where('page_slug', $page->slug)
          ->first();

        if ($section && !$section->is_fixed_section) {
          $section->update([
            'display_order' => $orderData['display_order']
          ]);
        } elseif ($section && $section->is_fixed_section) {
          Log::warning('Attempted to reorder fixed section: ' . $section->section_key);
        }
      }

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Section order updated successfully.'
      ]);
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to update section order: ' . $e->getMessage(), [
        'page_id' => $pageId,
        'trace' => $e->getTraceAsString()
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to update section order: ' . $e->getMessage()
      ], 500);
    }
  }

  /**
   * Store a newly created section in storage.
   */
  public function store(Request $request)
  {
    try {
      $validator = Validator::make($request->all(), [
        'page_id' => 'required|exists:pages,id',
        'component' => 'required|string|max:255',
        'section_key' => 'required|string|max:255|unique:section_configs,section_key,NULL,id,page_slug,' . $request->page_id,
        'data_table' => 'required|string|max:255',
        'is_enabled' => 'boolean',
        'custom_props' => 'nullable|array',
      ]);

      if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
      }

      $page = Page::findOrFail($request->page_id);

      DB::beginTransaction();

      $maxOrder = SectionConfig::where('page_slug', $page->slug)->max('display_order') ?? 0;

      $dataKey = $this->generateDataKey($request->component, $request->section_key);

      $sectionConfig = SectionConfig::create([
        'page_slug' => $page->slug,
        'section_key' => $request->section_key,
        'component' => $request->component,
        'data_table' => $request->data_table,
        'data_key' => $dataKey,
        'prop_name' => $this->getPropName($request->component),
        'display_order' => $maxOrder + 1,
        'is_enabled' => $request->boolean('is_enabled', true),
        'is_fixed_section' => false,
        'is_special_component' => $this->isSpecialComponent($request->component),
        'custom_props' => $request->custom_props ?? [],
      ]);

      $this->handleSectionDataCreation($sectionConfig);

      DB::commit();

      return back()->with('success', '✅ Section created successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to create section: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->all()
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create section: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update the specified section in storage.
   */
  public function update(Request $request, int $id)
  {
    try {
      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      $validator = Validator::make($request->all(), [
        'section_key' => 'required|string|max:255',
        'component' => 'sometimes|string|max:255',
        'data_table' => 'sometimes|string|max:255',
        'data_key' => 'sometimes|string|max:255',
        'is_enabled' => 'boolean',
        'custom_props' => 'nullable|array',
        'data' => 'nullable|array',
      ]);

      if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
      }

      $updateData = [];

      if ($request->has('section_key')) {
        $updateData['section_key'] = $request->input('section_key');
      }
      if ($request->has('is_enabled')) {
        $updateData['is_enabled'] = $request->boolean('is_enabled');
      }

      if ($request->has('custom_props')) {
        $existingProps = $sectionConfig->custom_props ?? [];
        $newProps = $request->input('custom_props');

        if (isset($newProps['bgColor'])) {
          $bgColor = $newProps['bgColor'];
          if (is_string($bgColor) && preg_match('/^#[0-9a-fA-F]{6}$/', $bgColor)) {
            $newProps['bgColor'] = 'bg-[' . $bgColor . ']';
          }
        }

        $updateData['custom_props'] = array_merge($existingProps, $newProps);
      }

      $sectionConfig->update($updateData);

      if ($request->has('data') && is_array($request->input('data'))) {
        $data = $request->input('data');

        if (isset($data['custom_props'])) {
          unset($data['custom_props']);
        }

        switch ($sectionConfig->data_table) {
          case 'custom_section_data':
            $this->updateCustomSectionData($sectionConfig, $data);
            break;
          default:
            Log::info('Skipping data update for non-custom section: ' . $sectionConfig->data_table);
            break;
        }
      }

      return back()->with('success', '✅ Section updated successfully.');
    } catch (\Exception $e) {
      Log::error('Failed to update section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString()
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update section: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update custom section data with image processing.
   */
  protected function updateCustomSectionData(SectionConfig $sectionConfig, array $newData)
  {
    try {
      $customData = CustomSectionData::where('page_slug', $sectionConfig->page_slug)
        ->where('section_key', $sectionConfig->section_key)
        ->first();

      if (!$customData) {
        $customData = new CustomSectionData();
        $customData->page_slug = $sectionConfig->page_slug;
        $customData->section_key = $sectionConfig->section_key;
      }

      $oldData = $customData->data ?? [];
      $newData = $this->normalizeColorValues($newData);
      $processedData = $this->processDataImages($newData, $oldData, $sectionConfig->section_key);

      $customData->data = $processedData;
      $customData->is_active = true;
      $customData->save();
    } catch (\Exception $e) {
      Log::error('Failed to update custom section data: ' . $e->getMessage(), [
        'section_key' => $sectionConfig->section_key,
        'trace' => $e->getTraceAsString()
      ]);
      throw $e;
    }
  }

  /**
   * Soft delete a section (moves to trash)
   */
  public function destroy(int $id)
  {
    try {
      DB::beginTransaction();

      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      if ($sectionConfig->is_fixed_section) {
        return back()->with('error', '❌ Fixed sections cannot be deleted.');
      }

      if ($sectionConfig->data_table === 'custom_section_data') {
        $customData = CustomSectionData::where('page_slug', $sectionConfig->page_slug)
          ->where('section_key', $sectionConfig->section_key)
          ->first();

        if ($customData) {
          $customData->delete();
        }
      }

      $sectionConfig->delete();

      DB::commit();

      return back()->with('success', '🗑️ Section moved to trash successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to delete section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString()
      ]);

      return back()->with('error', 'Failed to delete section: ' . $e->getMessage());
    }
  }

  /**
   * Restore a soft-deleted section
   */
  public function restore(int $id)
  {
    try {
      DB::beginTransaction();

      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      if (!$sectionConfig->trashed()) {
        return back()->with('error', 'This section is not in the trash.');
      }

      $sectionConfig->restore();

      if ($sectionConfig->data_table === 'custom_section_data') {
        $customData = CustomSectionData::withTrashed()
          ->where('page_slug', $sectionConfig->page_slug)
          ->where('section_key', $sectionConfig->section_key)
          ->first();

        if ($customData && $customData->trashed()) {
          $customData->restore();
        }
      }

      DB::commit();

      return back()->with('success', '🔄 Section restored successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to restore section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString()
      ]);

      return back()->with('error', 'Failed to restore section: ' . $e->getMessage());
    }
  }

  /**
   * Force delete a section (permanently remove)
   */
  public function forceDelete(int $id)
  {
    try {
      DB::beginTransaction();

      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      if ($sectionConfig->is_fixed_section) {
        return back()->with('error', '❌ Fixed sections cannot be permanently deleted.');
      }

      if ($sectionConfig->data_table === 'custom_section_data') {
        $customData = CustomSectionData::withTrashed()
          ->where('page_slug', $sectionConfig->page_slug)
          ->where('section_key', $sectionConfig->section_key)
          ->first();

        if ($customData) {
          $this->deleteImagesFromData($customData->data);
          $customData->forceDelete();
        }
      }

      $sectionConfig->forceDelete();

      DB::commit();

      return back()->with('success', '🗑️ Section permanently deleted.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to force delete section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString()
      ]);

      return back()->with('error', 'Failed to permanently delete section: ' . $e->getMessage());
    }
  }

  /**
   * Get trashed (deleted) sections for a page
   */
  public function trashed(int $pageId)
  {
    try {
      $page = Page::withTrashed()->findOrFail($pageId);

      $trashedSections = SectionConfig::onlyTrashed()
        ->where('page_slug', $page->slug)
        ->orderBy('deleted_at', 'desc')
        ->get();

      return Inertia::render('Backend/CMS/Section/Trashed', [
        'page' => $page,
        'sections' => $trashedSections,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to load trashed sections: ' . $e->getMessage(), [
        'page_id' => $pageId,
        'trace' => $e->getTraceAsString()
      ]);

      return Inertia::render('Backend/CMS/Section/Trashed', [
        'page' => null,
        'sections' => [],
        'flash' => ['error' => 'Failed to load trashed sections: ' . $e->getMessage()]
      ]);
    }
  }

  /**
   * Get the count of trashed sections for a page
   */
  public function trashedCount(int $pageId)
  {
    try {
      $page = Page::findOrFail($pageId);

      $count = SectionConfig::onlyTrashed()
        ->where('page_slug', $page->slug)
        ->count();

      return response()->json(['count' => $count]);
    } catch (\Exception $e) {
      Log::error('Failed to get trashed count: ' . $e->getMessage(), [
        'page_id' => $pageId
      ]);

      return response()->json(['count' => 0, 'error' => $e->getMessage()], 500);
    }
  }

  /**
   * Get About Content options for dropdown
   */
  public function getAboutContentOptions()
  {
    try {
      $items = AboutContent::where('is_active', true)
        ->orderBy('title')
        ->get()
        ->map(function ($item) {
          return [
            'id' => $item->id,
            'slug' => $item->slug,
            'title' => $item->title,
            'type' => $item->type,
            'content' => $item->content,
            'full_content' => $item->full_content,
            'image' => $item->image,
            'icon' => $item->icon,
            'bg_color' => $item->bg_color,
            'btn_text' => $item->btn_text,
            'btn_link' => $item->btn_link,
            'display_order' => $item->display_order,
            'is_featured' => $item->is_featured,
            'tags' => $item->tags,
          ];
        });

      return response()->json($items);
    } catch (\Exception $e) {
      Log::error('Error fetching about content options: ' . $e->getMessage());
      return response()->json([
        'error' => 'Failed to fetch about content options',
        'message' => $e->getMessage()
      ], 500);
    }
  }

  // ... Rest of the helper methods (generateDataKey, getPropName, isSpecialComponent, 
  // handleSectionDataCreation, getSectionDataTemplate, normalizeColorValues, 
  // processDataImages, processArray, isBase64Image, uploadImage, getImageExtension, 
  // deleteImage, isImagePath, deleteImagesFromData)

  /**
   * Normalize color values in the data array
   */
  protected function normalizeColorValues(array $data): array
  {
    foreach ($data as $key => $value) {
      if (is_array($value)) {
        $data[$key] = $this->normalizeColorValues($value);
      } elseif (is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
        $data[$key] = 'bg-[' . $value . ']';
      }
    }
    return $data;
  }

  /**
   * Recursively process data to handle image uploads and deletions.
   */
  protected function processDataImages(
    array $newData,
    array $oldData,
    string $sectionKey
  ): array {
    return $this->processArray($newData, $oldData, $sectionKey);
  }

  protected function processArray(array $newArray, ?array $oldArray, string $sectionKey): array
  {
    if (!is_array($newArray)) {
      return $newArray;
    }

    $result = [];

    foreach ($newArray as $key => $value) {
      if (is_array($value)) {
        $oldValue = is_array($oldArray) && isset($oldArray[$key]) ? $oldArray[$key] : null;
        $result[$key] = $this->processArray($value, $oldValue, $sectionKey);
        continue;
      }

      if (is_string($value) && $this->isBase64Image($value)) {
        $newPath = $this->uploadImage($value, $sectionKey);
        $result[$key] = $newPath;

        if (is_array($oldArray) && isset($oldArray[$key]) && is_string($oldArray[$key])) {
          $oldPath = $oldArray[$key];
          if (!$this->isBase64Image($oldPath) && $oldPath !== $newPath) {
            $this->deleteImage($oldPath);
          }
        }
      } else {
        $result[$key] = $value;

        if (is_array($oldArray) && isset($oldArray[$key]) && is_string($oldArray[$key])) {
          $oldPath = $oldArray[$key];
          if (!$this->isBase64Image($oldPath) && $oldPath !== $value) {
            $this->deleteImage($oldPath);
          }
        }
      }
    }

    if (is_array($oldArray)) {
      foreach ($oldArray as $key => $oldValue) {
        if (!array_key_exists($key, $newArray) && is_string($oldValue) && !$this->isBase64Image($oldValue)) {
          $this->deleteImage($oldValue);
        }
      }
    }

    return $result;
  }

  /**
   * Check if a string is a base64 image.
   */
  protected function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
  }

  /**
   * Upload a base64 image and return the storage path.
   */
  protected function uploadImage(string $base64String, string $subPath = 'sections'): string
  {
    try {
      $imageData = explode(',', $base64String);
      if (count($imageData) < 2) {
        return '';
      }

      $imageContent = base64_decode($imageData[1]);
      if ($imageContent === false) {
        Log::warning('Failed to decode base64 image');
        return '';
      }

      // Check file size (max 5MB)
      if (strlen($imageContent) > 5 * 1024 * 1024) {
        Log::warning('Image too large: ' . strlen($imageContent) . ' bytes');
        return '';
      }

      $extension = $this->getImageExtension($base64String);
      $datePrefix = date('Ymd');
      $uuid = Str::uuid();
      $filename = $datePrefix . '_' . $uuid . '.' . $extension;
      $path = $subPath . '/' . $filename;

      $stored = Storage::disk('public')->put($path, $imageContent);

      if (!$stored) {
        Log::error('Failed to store image: ' . $path);
        return '';
      }

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Image upload failed: ' . $e->getMessage());
      return '';
    }
  }

  /**
   * Get image extension from base64 string.
   */
  protected function getImageExtension(string $base64String): string
  {
    $mimeMap = [
      'image/jpeg' => 'jpg',
      'image/jpg' => 'jpg',
      'image/png' => 'png',
      'image/gif' => 'gif',
      'image/webp' => 'webp',
      'image/svg+xml' => 'svg',
      'image/svg' => 'svg',
      'image/bmp' => 'bmp',
      'image/tiff' => 'tiff',
      'image/x-icon' => 'ico',
      'image/vnd.microsoft.icon' => 'ico',
    ];

    if (preg_match('/^data:([^;]+);base64,/', $base64String, $matches)) {
      $mimeType = $matches[1];
      return $mimeMap[$mimeType] ?? 'png';
    }

    return 'png';
  }

  /**
   * Delete an image from storage if it exists.
   */
  protected function deleteImage(string $path): void
  {
    try {
      $relativePath = str_replace('/storage/', '', $path);
      if (Storage::disk('public')->exists($relativePath)) {
        Storage::disk('public')->delete($relativePath);
        Log::info('Image deleted: ' . $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to delete image: ' . $e->getMessage());
    }
  }

  /**
   * Check if a string is an image path (not base64)
   */
  protected function isImagePath(string $string): bool
  {
    return str_starts_with($string, '/storage/') &&
      !$this->isBase64Image($string);
  }

  /**
   * Delete images from data recursively
   */
  protected function deleteImagesFromData($data): void
  {
    if (is_array($data)) {
      foreach ($data as $key => $value) {
        if (is_array($value)) {
          $this->deleteImagesFromData($value);
        } elseif (is_string($value) && $this->isImagePath($value)) {
          $this->deleteImage($value);
        }
      }
    }
  }

  // ... Continue with other helper methods (generateDataKey, getPropName, isSpecialComponent, etc.)
}
