<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Page;
use App\Models\pages\SectionConfig;
use App\Models\pages\CustomSectionData;
use App\Models\pages\SharedData;
use App\Models\pages\Blog;
use App\Models\pages\Program;
use App\Models\pages\AboutContent;
use App\Models\pages\Publication;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
  /**
   * Max image size in bytes (5MB).
   */
  protected int $maxImageSize = 5 * 1024 * 1024;

  /**
   * Display a listing of sections for a specific page – with caching.
   */
  public function index(int $pageId): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view sections.');
    }

    try {
      $cacheKey = "sections_page_{$pageId}";
      $sectionsData = Cache::remember($cacheKey, 300, function () use ($pageId) {
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
            $section['data'] = $this->loadSectionData($config, $customSectionData, $sharedData);
          } catch (\Exception $e) {
            Log::error('Failed to load data for section: ' . $config->section_key, [
              'error' => $e->getMessage(),
              'data_table' => $config->data_table,
            ]);
            $section['data'] = null;
            $section['data_error'] = 'Failed to load data: ' . $e->getMessage();
          }

          $sections[] = $section;
        }

        return [
          'page' => $page,
          'sections' => $sections,
        ];
      });

      return Inertia::render('Backend/CMS/Section/Index', $sectionsData);
    } catch (\Exception $e) {
      Log::error('Failed to load sections page: ' . $e->getMessage(), [
        'page_id' => $pageId,
        'trace' => $e->getTraceAsString(),
      ]);

      return Inertia::render('Backend/CMS/Section/Index', [
        'page' => null,
        'sections' => [],
        'flash' => ['error' => 'Failed to load sections: ' . $e->getMessage()],
      ]);
    }
  }

  /**
   * Update display order for multiple sections (drag & drop) – with rate limiting.
   */
  public function updateOrder(Request $request, int $pageId): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.update')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('sections_update_order', $user->id);

    try {
      $page = Page::findOrFail($pageId);

      $validated = $request->validate([
        'orders' => 'required|array',
        'orders.*.id' => 'required|integer|exists:section_configs,id',
        'orders.*.display_order' => 'required|integer|min:0',
      ]);

      DB::beginTransaction();

      $updatedCount = 0;
      foreach ($validated['orders'] as $orderData) {
        $section = SectionConfig::where('id', $orderData['id'])
          ->where('page_slug', $page->slug)
          ->first();

        if ($section && !$section->is_fixed_section) {
          $section->update(['display_order' => $orderData['display_order']]);
          $updatedCount++;
        } elseif ($section && $section->is_fixed_section) {
          Log::warning('Attempted to reorder fixed section: ' . $section->section_key);
        }
      }

      DB::commit();

      $this->clearCache($pageId);

      RateLimiter::clear($this->getThrottleKey('sections_update_order', $user->id));

      SimpleLogger::cms(
        "Section order updated",
        [
          'page_id' => $pageId,
          'page_slug' => $page->slug,
          'updated_count' => $updatedCount,
          'updated_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return response()->json(['success' => true]);
    } catch (ValidationException $e) {
      return response()->json(['success' => false, 'errors' => $e->errors()], 422);
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to update section order: ' . $e->getMessage(), [
        'page_id' => $pageId,
        'trace' => $e->getTraceAsString(),
      ]);

      return response()->json([
        'success' => false,
        'message' => 'Failed to update section order: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Store a newly created section – with rate limiting.
   */
  public function store(Request $request): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.create')) {
      return redirect()->back()->with('error', 'You do not have permission to create sections.');
    }

    $this->checkRateLimit('sections_create', $user->id);

    try {
      $page = Page::findOrFail($request->input('page_id'));

      $validated = $request->validate([
        'page_id' => 'required|exists:pages,id',
        'component' => 'required|string|max:255',
        'section_key' => [
          'required',
          'string',
          'max:255',
          Rule::unique('section_configs', 'section_key')
            ->where(fn($query) => $query->where('page_slug', $page->slug)),
        ],
        'data_table' => 'required|string|max:255',
        'is_enabled' => 'nullable|boolean',
        'custom_props' => 'nullable|array',
      ]);

      DB::beginTransaction();

      $maxOrder = SectionConfig::where('page_slug', $page->slug)->max('display_order') ?? 0;

      $dataKey = $this->generateDataKey($validated['component'], $validated['section_key']);

      $sectionConfig = SectionConfig::create([
        'page_slug' => $page->slug,
        'section_key' => $validated['section_key'],
        'component' => $validated['component'],
        'data_table' => $validated['data_table'],
        'data_key' => $dataKey,
        'prop_name' => $this->getPropName($validated['component']),
        'display_order' => $maxOrder + 1,
        'is_enabled' => $request->boolean('is_enabled', true),
        'is_fixed_section' => false,
        'is_special_component' => $this->isSpecialComponent($validated['component']),
        'custom_props' => $request->input('custom_props', []),
      ]);

      $this->handleSectionDataCreation($sectionConfig);

      DB::commit();

      $this->clearCache($page->id);

      RateLimiter::clear($this->getThrottleKey('sections_create', $user->id));

      SimpleLogger::cms(
        "Section created: {$sectionConfig->section_key}",
        [
          'section_id' => $sectionConfig->id,
          'page_slug' => $page->slug,
          'component' => $sectionConfig->component,
          'data_table' => $sectionConfig->data_table,
          'created_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return back()->with('success', '✅ Section created successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to create section: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->all(),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create section: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update the specified section – with rate limiting.
   */
  public function update(Request $request, int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.update')) {
      return redirect()->back()->with('error', 'You do not have permission to update sections.');
    }

    $this->checkRateLimit('sections_update', $user->id);

    try {
      $sectionConfig = SectionConfig::withTrashed()->findOrFail($id);

      $validated = $request->validate([
        'section_key' => [
          'required',
          'string',
          'max:255',
          Rule::unique('section_configs', 'section_key')
            ->where(fn($query) => $query->where('page_slug', $sectionConfig->page_slug))
            ->ignore($sectionConfig->id),
        ],
        'component' => 'sometimes|string|max:255',
        'data_table' => 'sometimes|string|max:255',
        'data_key' => 'sometimes|string|max:255',
        'is_enabled' => 'nullable|boolean',
        'custom_props' => 'nullable|array',
        'data' => 'nullable|array',
      ]);

      DB::beginTransaction();

      $updateData = [];

      if (isset($validated['section_key'])) {
        $updateData['section_key'] = $validated['section_key'];
      }

      if (isset($validated['is_enabled'])) {
        $updateData['is_enabled'] = (bool) $validated['is_enabled'];
      }

      if (isset($validated['custom_props'])) {
        $existingProps = $sectionConfig->custom_props ?? [];
        $newProps = $validated['custom_props'];

        // Normalize bgColor
        if (isset($newProps['bgColor']) && is_string($newProps['bgColor'])) {
          if (preg_match('/^#[0-9a-fA-F]{6}$/', $newProps['bgColor'])) {
            $newProps['bgColor'] = 'bg-[' . $newProps['bgColor'] . ']';
          }
        }

        $updateData['custom_props'] = array_merge($existingProps, $newProps);
      }

      $sectionConfig->update($updateData);

      // Handle custom data update
      if (isset($validated['data']) && is_array($validated['data'])) {
        $data = $validated['data'];
        if (isset($data['custom_props'])) {
          unset($data['custom_props']);
        }

        if ($sectionConfig->data_table === 'custom_section_data') {
          $this->updateCustomSectionData($sectionConfig, $data);
        }
      }

      DB::commit();

      $this->clearCacheForSection($sectionConfig);

      RateLimiter::clear($this->getThrottleKey('sections_update', $user->id));

      SimpleLogger::cms(
        "Section updated: {$sectionConfig->section_key}",
        [
          'section_id' => $id,
          'page_slug' => $sectionConfig->page_slug,
          'updated_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return back()->with('success', '✅ Section updated successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to update section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString(),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update section: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Soft delete a section – with rate limiting.
   */
  public function destroy(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to delete sections.');
    }

    $this->checkRateLimit('sections_delete', $user->id);

    try {
      DB::beginTransaction();

      $sectionConfig = SectionConfig::findOrFail($id);

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

      $this->clearCacheForSection($sectionConfig);

      RateLimiter::clear($this->getThrottleKey('sections_delete', $user->id));

      SimpleLogger::cms(
        "Section deleted: {$sectionConfig->section_key}",
        [
          'section_id' => $id,
          'page_slug' => $sectionConfig->page_slug,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return back()->with('success', '🗑️ Section moved to trash successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to delete section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString(),
      ]);

      return back()->with('error', 'Failed to delete section: ' . $e->getMessage());
    }
  }

  /**
   * Restore a soft-deleted section – with rate limiting.
   */
  public function restore(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.restore')) {
      return redirect()->back()->with('error', 'You do not have permission to restore sections.');
    }

    $this->checkRateLimit('sections_restore', $user->id);

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

      $this->clearCacheForSection($sectionConfig);

      RateLimiter::clear($this->getThrottleKey('sections_restore', $user->id));

      SimpleLogger::cms(
        "Section restored: {$sectionConfig->section_key}",
        [
          'section_id' => $id,
          'page_slug' => $sectionConfig->page_slug,
          'restored_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return back()->with('success', '🔄 Section restored successfully.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to restore section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString(),
      ]);

      return back()->with('error', 'Failed to restore section: ' . $e->getMessage());
    }
  }

  /**
   * Force delete a section – with rate limiting.
   */
  public function forceDelete(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to permanently delete sections.');
    }

    $this->checkRateLimit('sections_force_delete', $user->id);

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

      $this->clearCacheForSection($sectionConfig);

      RateLimiter::clear($this->getThrottleKey('sections_force_delete', $user->id));

      SimpleLogger::cms(
        "Section permanently deleted: {$sectionConfig->section_key}",
        [
          'section_id' => $id,
          'page_slug' => $sectionConfig->page_slug,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return back()->with('success', '🗑️ Section permanently deleted.');
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Failed to force delete section: ' . $e->getMessage(), [
        'section_id' => $id,
        'trace' => $e->getTraceAsString(),
      ]);

      return back()->with('error', 'Failed to permanently delete section: ' . $e->getMessage());
    }
  }

  /**
   * Get trashed sections for a page.
   */
  public function trashed(int $pageId): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view trashed sections.');
    }

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
        'trace' => $e->getTraceAsString(),
      ]);

      return Inertia::render('Backend/CMS/Section/Trashed', [
        'page' => null,
        'sections' => [],
        'flash' => ['error' => 'Failed to load trashed sections: ' . $e->getMessage()],
      ]);
    }
  }

  /**
   * Get the count of trashed sections for a page.
   */
  public function trashedCount(int $pageId): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.view')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
      $page = Page::findOrFail($pageId);
      $count = SectionConfig::onlyTrashed()
        ->where('page_slug', $page->slug)
        ->count();

      return response()->json(['count' => $count]);
    } catch (\Exception $e) {
      Log::error('Failed to get trashed count: ' . $e->getMessage(), ['page_id' => $pageId]);
      return response()->json(['count' => 0, 'error' => $e->getMessage()], 500);
    }
  }

  /**
   * Get About Content options for dropdown – with caching.
   */
  public function getAboutContentOptions(): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('sections.view')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
      $items = Cache::remember('about_content_options', 300, function () {
        return AboutContent::where('is_active', true)
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
      });

      return response()->json($items);
    } catch (\Exception $e) {
      Log::error('Error fetching about content options: ' . $e->getMessage());
      return response()->json([
        'error' => 'Failed to fetch about content options',
        'message' => $e->getMessage(),
      ], 500);
    }
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

  /**
   * Get the authenticated user.
   */
  private function getAuthUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

  /**
   * Check rate limit for admin actions.
   */
  private function checkRateLimit(string $action, int $userId, int $maxAttempts = 10, int $decaySeconds = 3600): void
  {
    $key = $this->getThrottleKey($action, $userId);
    if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
      Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
      throw ValidationException::withMessages([
        'rate_limit' => 'Too many attempts. Please wait a moment.',
      ]);
    }
    RateLimiter::hit($key, $decaySeconds);
  }

  /**
   * Get throttle key.
   */
  private function getThrottleKey(string $action, int $userId): string
  {
    return "sections_{$action}|{$userId}";
  }

  /**
   * Clear section cache for a specific page.
   */
  private function clearCache(int $pageId): void
  {
    Cache::forget("sections_page_{$pageId}");
    Cache::forget('about_content_options');
  }

  /**
   * Clear section cache for a specific section.
   */
  private function clearCacheForSection(SectionConfig $sectionConfig): void
  {
    $page = Page::where('slug', $sectionConfig->page_slug)->first();
    if ($page) {
      $this->clearCache($page->id);
    }
  }
  /**
   * Load section data based on data_table.
   *
   * @param SectionConfig $config
   * @param Collection<string, CustomSectionData> $customSectionData
   * @param Collection<string, SharedData> $sharedData
   * @return mixed
   */
  private function loadSectionData(
    SectionConfig $config,
    Collection $customSectionData,
    Collection $sharedData
  ): mixed {
    return match ($config->data_table) {
      'custom_section_data' => $this->extractCustomSectionData(
        $customSectionData->get($config->section_key)
      ),
      'shared_data' => $this->extractSharedData(
        $sharedData->get($config->section_key)
      ),
      'blogs' => Blog::active()->latest()->get(),
      'programs' => Program::active()->ordered()->get(),
      'about_content' => $this->loadAboutContent($config->section_key),
      'publications' => Publication::active()->latest()->get(),
      default => null,
    };
  }

  /**
   * Load about content for a specific key.
   */
  private function loadAboutContent(string $sectionKey): mixed
  {
    $aboutContent = AboutContent::where('slug', $sectionKey)
      ->active()
      ->first();

    return $aboutContent ? $aboutContent->data : null;
  }

  /**
   * Extract clean data from CustomSectionData model.
   */
  private function extractCustomSectionData(?CustomSectionData $customData): mixed
  {
    if (!$customData) {
      return null;
    }

    try {
      $rawData = $customData->data;

      if (is_string($rawData)) {
        $decodedData = json_decode($rawData, true);
        return ($decodedData !== null) ? ($decodedData['data'] ?? $decodedData) : $rawData;
      }

      return $rawData;
    } catch (\Exception $e) {
      Log::error('Failed to extract custom section data: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Extract clean data from SharedData model.
   */
  private function extractSharedData(?SharedData $shared): mixed
  {
    if (!$shared) {
      return null;
    }

    try {
      $rawData = $shared->data ?? $shared;

      if (is_string($rawData)) {
        $decodedData = json_decode($rawData, true);
        return ($decodedData !== null) ? ($decodedData['data'] ?? $decodedData) : $rawData;
      }

      return $rawData;
    } catch (\Exception $e) {
      Log::error('Failed to extract shared data: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Update custom section data with image processing.
   */
  private function updateCustomSectionData(SectionConfig $sectionConfig, array $newData): void
  {
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
  }

  /**
   * Normalize color values in the data array.
   */
  private function normalizeColorValues(array $data): array
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
  private function processDataImages(array $newData, array $oldData, string $sectionKey): array
  {
    return $this->processArray($newData, $oldData, $sectionKey);
  }

  /**
   * Recursively process array for image handling.
   */
  private function processArray(array $newArray, ?array $oldArray, string $sectionKey): array
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

    // Check for removed keys
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
   * Check if string is a base64 image.
   */
  private function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
  }

  /**
   * Check if string is an image path (not base64).
   */
  private function isImagePath(string $string): bool
  {
    return str_starts_with($string, '/storage/') && !$this->isBase64Image($string);
  }

  /**
   * Upload a base64 image and return the storage path.
   */
  private function uploadImage(string $base64String, string $subPath = 'sections'): string
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

      if (strlen($imageContent) > $this->maxImageSize) {
        Log::warning('Image too large: ' . strlen($imageContent) . ' bytes');
        return '';
      }

      $extension = $this->getImageExtension($base64String);
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = $subPath . '/' . $filename;

      if (!Storage::disk('public')->put($path, $imageContent)) {
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
  private function getImageExtension(string $base64String): string
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
      return $mimeMap[$matches[1]] ?? 'png';
    }

    return 'png';
  }

  /**
   * Delete an image from storage if it exists.
   */
  private function deleteImage(string $path): void
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
   * Delete images from data recursively.
   */
  private function deleteImagesFromData(mixed $data): void
  {
    if (is_array($data)) {
      foreach ($data as $value) {
        if (is_array($value)) {
          $this->deleteImagesFromData($value);
        } elseif (is_string($value) && $this->isImagePath($value)) {
          $this->deleteImage($value);
        }
      }
    }
  }

  /**
   * Generate a unique data key for the section.
   */
  private function generateDataKey(string $component, string $sectionKey): string
  {
    return Str::snake($component) . '_' . Str::snake($sectionKey);
  }

  /**
   * Get the frontend prop name for a section component.
   */
  private function getPropName(string $component): string
  {
    return Str::camel($component);
  }

  /**
   * Determine whether the component is a special layout component.
   */
  private function isSpecialComponent(string $component): bool
  {
    return in_array($component, [
      'page-banner',
      'page-tag-banner',
      'stories',
      'upcoming-events',
      'program-impact',
      'where-we-work',
      'video-gallery',
    ], true);
  }

  /**
   * Create default section data after the config is stored.
   */
  private function handleSectionDataCreation(SectionConfig $sectionConfig): void
  {
    if ($sectionConfig->data_table !== 'custom_section_data') {
      return;
    }

    $template = $this->getDefaultDataForComponent($sectionConfig->component);
    if ($template === null) {
      return;
    }

    CustomSectionData::updateOrCreate(
      [
        'page_slug' => $sectionConfig->page_slug,
        'section_key' => $sectionConfig->section_key,
      ],
      [
        'data' => $template,
        'is_active' => true,
      ]
    );
  }

  /**
   * Get default data template for a section component.
   */
  protected function getDefaultDataForComponent(string $component): ?array
  {
    return match ($component) {
      // ============================================
      // BANNER SECTIONS
      // ============================================
      'HomeBanner' => [
        'background' => ['src' => '', 'alt' => ''],
        'overlay' => ['darkOverlay' => '', 'gradient' => ''],
        'content' => [
          'tagline' => ['text' => '', 'className' => 'uppercase tracking-[4px] font-semibold'],
          'title' => ['text' => '', 'className' => 'font-bold leading-tight'],
          'description' => ['text' => '', 'className' => 'font-normal leading-tight'],
        ],
        'buttons' => [],
      ],
      'PageBannerSection' => [
        'background' => ['src' => '', 'alt' => ''],
        'overlay' => ['darkOverlay' => '', 'gradient' => ''],
        'content' => [
          'title' => ['text' => '', 'className' => 'font-bold leading-tight'],
          'description' => ['text' => '', 'className' => 'font-normal leading-tight'],
        ],
      ],
      'PageTagBannerSection' => [
        'background' => ['src' => '', 'alt' => ''],
        'overlay' => ['darkOverlay' => '', 'gradient' => ''],
        'tagTitle' => 'Photo Gallery',
        'activeTag' => '',
        'tags' => [],
      ],

      // ============================================
      // CONTENT SECTIONS
      // ============================================
      'AboutUsSection' => [
        'section' => [
          'title' => 'About Us',
          'description' => 'We are dedicated to making a positive impact in our communities through sustainable development and social welfare programs.',
          'button' => ['text' => 'Learn More About Us', 'link' => '/about'],
        ],
        'mission' => [
          'title' => 'Our Mission',
          'items' => [
            [
              'id' => 1,
              'icon' => '',
              'title' => 'Empower Communities',
              'description' => 'Strengthening communities through education, healthcare, and sustainable development initiatives.',
              'alt' => 'Empower Communities Icon',
            ],
            [
              'id' => 2,
              'icon' => '',
              'title' => 'Promote Equality',
              'description' => 'Advocating for social justice, gender equality, and inclusive development for all.',
              'alt' => 'Promote Equality Icon',
            ],
            [
              'id' => 3,
              'icon' => '',
              'title' => 'Sustainable Growth',
              'description' => 'Creating lasting change through environmentally conscious and sustainable practices.',
              'alt' => 'Sustainable Growth Icon',
            ],
          ],
        ],
        'impact' => [
          'title' => 'Our Impact in Numbers',
          'stats' => [
            ['id' => 1, 'value' => '10+', 'suffix' => '', 'label' => 'Years of Service'],
            ['id' => 2, 'value' => '50K', 'suffix' => '+', 'label' => 'Lives Impacted'],
            ['id' => 3, 'value' => '100', 'suffix' => '+', 'label' => 'Projects Completed'],
          ],
        ],
        'image' => ['src' => '', 'alt' => 'About Us Image', 'className' => ''],
      ],

      'OurActionSection' => [
        'section' => [
          'title' => 'Our Actions for Social Change',
          'description' => 'We work tirelessly to create positive change through various programs and initiatives that address critical social issues.',
        ],
        'actions' => [
          [
            'id' => 1,
            'icon' => '',
            'title' => 'Education for All',
            'description' => 'Providing access to quality education for underprivileged children and youth in rural communities.',
            'alt' => 'Education Icon',
          ],
          [
            'id' => 2,
            'icon' => '',
            'title' => 'Healthcare Access',
            'description' => 'Ensuring healthcare access for marginalized communities through mobile clinics and health awareness programs.',
            'alt' => 'Healthcare Icon',
          ],
          [
            'id' => 3,
            'icon' => '',
            'title' => 'Women Empowerment',
            'description' => 'Empowering women through skill development, entrepreneurship training, and leadership programs.',
            'alt' => 'Women Empowerment Icon',
          ],
        ],
      ],

      'WhereWeWorkSection' => [
        'section' => ['title' => 'Where We Work'],
        'stats' => [
          ['id' => 1, 'icon' => '', 'value' => '450K', 'label' => 'Total Member Reach', 'alt' => 'Member Reach Icon'],
          ['id' => 2, 'icon' => '', 'value' => '50K', 'label' => 'Total Beneficiaries', 'alt' => 'Beneficiaries Icon'],
          ['id' => 3, 'icon' => '', 'value' => '200+', 'label' => 'Villages Covered', 'alt' => 'Villages Icon'],
          ['id' => 4, 'icon' => '', 'value' => '50+', 'label' => 'Total Partners', 'alt' => 'Partners Icon'],
        ],
        'image' => ['src' => '', 'alt' => 'Map Placeholder Text', 'className' => ''],
      ],

      'HeroFigureSection' => [
        'section' => ['title' => 'Background, Roles and Functions'],
        'content' => ['html' => '<p>We are committed to serving our communities with dedication and integrity. Our work spans across multiple sectors including education, healthcare, and sustainable development.</p><p>Through our programs, we aim to create lasting positive change in the lives of those we serve.</p>'],
        'btn' => ['text' => 'Learn More About Functions', 'link' => '/about/functions'],
        'image' => [
          'src' => '',
          'alt' => 'Background Image',
          'className' => 'w-full h-auto lg:h-full object-cover rounded-2xl sm:rounded-3xl lg:rounded-4xl',
        ],
      ],

      'CardsSection' => [
        'section' => ['title' => 'Our Key Initiatives'],
        'cards' => [
          [
            'id' => 1,
            'title' => 'Operational Areas',
            'buttonText' => 'Explore Our Areas of Operation',
            'buttonLink' => '/about/operational-areas',
            'image' => ['src' => '', 'alt' => 'Operational Areas', 'className' => 'mx-auto object-contain'],
            'bgColor' => 'bg-[#F5F5F5]',
            'cardBgColor' => 'bg-white',
          ],
          [
            'id' => 2,
            'title' => 'Core Programs',
            'buttonText' => 'Discover Our Core Programs',
            'buttonLink' => '/programs',
            'image' => ['src' => '', 'alt' => 'Core Programs', 'className' => 'mx-auto object-contain'],
            'bgColor' => 'bg-[#F5F5F5]',
            'cardBgColor' => 'bg-white',
          ],
        ],
      ],

      'ContactOfficeSection' => [
        'offices' => [
          [
            'title' => 'Head Office',
            'address' => '24/5 Mollika, Prominent Housing, 3 Pisciculture Road, Mohammadpur, Dhaka -1207.',
            'phones' => ['+880 1761-493412'],
            'emails' => ['dusdhaka@gmail.com'],
            'map_url' => 'https://www.google.com/maps?q=23.7570,90.3620&output=embed',
            'coordinates' => ['lat' => 23.757, 'lng' => 90.362],
            'is_active' => true,
          ],
          [
            'title' => 'Project Office',
            'address' => 'Project Area, Coastal Region, Bangladesh.',
            'phones' => ['+880 1761-493412'],
            'emails' => ['dusdhaka@gmail.com'],
            'map_url' => 'https://www.google.com/maps?q=23.7570,90.3620&output=embed',
            'coordinates' => ['lat' => 23.757, 'lng' => 90.362],
            'is_active' => true,
          ],
          [
            'title' => 'Field Office',
            'address' => 'Field Location, Rural Area, Bangladesh.',
            'phones' => ['+880 1761-493412'],
            'emails' => ['dusdhaka@gmail.com'],
            'map_url' => 'https://www.google.com/maps?q=23.7570,90.3620&output=embed',
            'coordinates' => ['lat' => 23.757, 'lng' => 90.362],
            'is_active' => true,
          ],
        ],
      ],

      'AddressSection' => [
        'addresses' => [
          [
            'id' => 1,
            'label' => 'Head Office',
            'address' => '24/5 Mollika, Prominent Housing, 3 Pisciculture Road, Mohammadpur, Dhaka -1207.',
            'mapUrl' => 'https://www.google.com/maps?q=23.7570,90.3620&output=embed',
            'coordinates' => ['lat' => 23.757, 'lng' => 90.362],
            'phones' => ['+880 1761-493412'],
            'emails' => ['dusdhaka@gmail.com'],
          ],
          [
            'id' => 2,
            'label' => 'Project Office',
            'address' => 'Project Area, Coastal Region, Bangladesh.',
            'mapUrl' => 'https://www.google.com/maps?q=23.7570,90.3620&output=embed',
            'coordinates' => ['lat' => 23.757, 'lng' => 90.362],
            'phones' => ['+880 1761-493412'],
            'emails' => ['dusdhaka@gmail.com'],
          ],
        ],
      ],

      'ContactReachSection' => [
        'title' => 'Reach out to us today!',
        'buttonText' => 'Submit Message',
        'image' => '',
      ],

      'FollowUSSection' => [
        'links' => [
          ['icon' => 'facebook', 'label' => 'Facebook', 'url' => 'https://facebook.com/your-page'],
          ['icon' => 'instagram', 'label' => 'Instagram', 'url' => 'https://instagram.com/your-page'],
          ['icon' => 'linkedin', 'label' => 'LinkedIn', 'url' => 'https://linkedin.com/company/your-page'],
          ['icon' => 'youtube', 'label' => 'YouTube', 'url' => 'https://youtube.com/your-channel'],
          ['icon' => 'twitter', 'label' => 'Twitter', 'url' => 'https://twitter.com/your-page'],
        ],
      ],

      'LegalSection' => [
        'background' => ['src' => '', 'alt' => 'Legal Background'],
        'overlay' => ['darkOverlay' => 'bg-black/50'],
        'textBox' => [
          'title' => 'Legal Status and Org.',
          'titleLine2' => 'Affiliations',
          'buttonText' => 'Learn More Affiliations',
          'buttonLink' => '/about/legal-affiliations',
        ],
      ],

      'ProgramImpactSection' => [
        'section' => ['title' => 'Program Impact and SDGs'],
        'mainImage' => ['images' => []],
        'sdgImages' => [],
      ],

      'ImageGallerySection' => [
        'sectionTitle' => 'DUS in action',
        'imageCountLabel' => 'Image Count',
        'images' => [],
      ],

      'VideoGallerySection' => [
        'sectionTitle' => 'Video Gallery',
        'videoCountLabel' => 'Video Count',
        'videos' => [],
      ],

      'TextContentSection' => [
        'content' => ['html' => '', 'content' => '', 'text' => ''],
        'bgColor' => 'bg-white',
        'paddingY' => 'py-10 sm:py-15 md:py-25 lg:py-37.5',
        'paddingX' => 'px-5 sm:px-10 md:px-20 lg:px-50',
        'maxWidth' => 'max-w-4xl lg:max-w-6xl',
        'sectionId' => 'text-content',
        'sectionClassName' => '',
      ],

      // ============================================
      // JOBS SECTION (has display settings in data)
      // ============================================
      'JobsSection' => [
        'section' => [
          'title' => 'Join our big family',
          'description' => "Join us on this journey of kindness, and let's make a difference, one act of charity at a time.",
          'limit' => null,
        ],
        'filter' => ['placeholder' => 'Browse By'],
        'jobs' => [],
      ],

      // ============================================
      // OUR PROGRAMS SECTION (has display settings in custom_props)
      // ============================================
      'OurProgramsSection' => [
        // This section gets data from programs table
        // Display settings are in custom_props
        'section' => [
          'title' => 'Our Programs',
          'description' => 'Explore our impactful programs that are transforming lives in coastal communities',
          'button' => ['text' => 'View All Programs', 'link' => '/projects-programs'],
        ],
        'programs' => [],
      ],

      // ============================================
      // BLOG SECTION (data from blogs table)
      // ============================================
      'BlogSection' => [
        // Data comes from blogs table
        // Display settings in custom_props
        'sectionTitle' => 'Latest Stories',
      ],

      // ============================================
      // PUBLICATIONS SECTION (data from publications table)
      // ============================================
      'PublicationsSection' => [
        // Data comes from publications table
        // Display settings in custom_props
        'sectionTitle' => 'Our Publications',
      ],

      // ============================================
      // SHARED DATA SECTIONS (read-only, data from shared_data)
      // ============================================
      'StoriesSection' => [
        // Data comes from shared_data table
        'section' => ['title' => 'Stories', 'description' => ''],
        'stories' => [],
      ],

      'FAQSection' => [
        // Data comes from shared_data table
        'section' => ['title' => 'Frequently Asked Questions', 'subtitle' => ''],
        'faqs' => [],
      ],

      'UpcomingEventsSection' => [
        // Data comes from shared_data table
        'section' => [
          'title' => 'Upcoming Events',
          'description' => '',
          'button' => ['text' => 'View All Events', 'link' => '/events'],
        ],
        'image' => ['src' => '', 'alt' => 'Upcoming Events', 'className' => ''],
        'events' => [],
      ],

      // ============================================
      // DEFAULT / FALLBACK
      // ============================================
      default => null,
    };
  }
}
