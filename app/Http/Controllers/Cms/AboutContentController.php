<?php
// app/Http/Controllers/Cms/AboutContentController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\AboutContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AboutContentController extends Controller
{
  /**
   * Display about content items
   */
  public function index(): Response
  {
    try {
      $items = AboutContent::withTrashed()->orderBy('display_order')->get();

      return Inertia::render('Backend/CMS/About/Index', [
        'items' => $items,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch about content: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/About/Index', [
        'items' => [],
        'flash' => ['error' => 'Failed to load about content. Please try again.']
      ]);
    }
  }

  /**
   * Store new about content
   */
  public function store(Request $request)
  {
    try {
      $validator = Validator::make($request->all(), [
        'slug' => 'required|string|unique:about_content,slug',
        'title' => 'required|string|max:255',
        'type' => 'required|string|in:main,detail',
        'content' => 'nullable|string',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'icon' => 'nullable|string',
        'bg_color' => 'nullable|string|max:255',
        'btn_text' => 'nullable|string|max:255',
        'btn_link' => 'nullable|string|max:255',
        'display_order' => 'nullable|integer|min:0',
        'is_featured' => 'boolean',
        'tags' => 'nullable|array',
        'is_active' => 'boolean',
      ]);

      if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
      }

      $data = $request->all();

      // Process image if it's a base64 string
      if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
        $uploadedPath = $this->uploadImage($data['image']);
        if ($uploadedPath) {
          $data['image'] = $uploadedPath;
        } else {
          unset($data['image']);
          Log::warning('Image upload failed for about content: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Process icon if it's a base64 string
      if (!empty($data['icon']) && $this->isBase64Image($data['icon'])) {
        $uploadedPath = $this->uploadImage($data['icon'], 'About/icons');
        if ($uploadedPath) {
          $data['icon'] = $uploadedPath;
        } else {
          unset($data['icon']);
          Log::warning('Icon upload failed for about content: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image data
      $this->cleanSessionOldInput();

      // Set default display order if not provided
      if (!isset($data['display_order']) || $data['display_order'] === '') {
        $data['display_order'] = AboutContent::withTrashed()->max('display_order') + 1;
      }

      // Set default slug if not provided
      if (empty($data['slug'])) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      AboutContent::create($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ About content created successfully.');
    } catch (\Exception $e) {
      Log::error('About content creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->except(['image', 'icon', 'full_content'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create about content: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update about content
   */
  public function update(Request $request, int $id)
  {
    try {
      $about = AboutContent::withTrashed()->findOrFail($id);

      $validator = Validator::make($request->all(), [
        'slug' => 'required|string|unique:about_content,slug,' . $id,
        'title' => 'required|string|max:255',
        'type' => 'required|string|in:main,detail',
        'content' => 'nullable|string',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'icon' => 'nullable|string',
        'bg_color' => 'nullable|string|max:255',
        'btn_text' => 'nullable|string|max:255',
        'btn_link' => 'nullable|string|max:255',
        'display_order' => 'nullable|integer|min:0',
        'is_featured' => 'boolean',
        'tags' => 'nullable|array',
        'is_active' => 'boolean',
      ]);

      if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
      }

      $data = $request->all();

      // Process image if it's a base64 string
      if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
        // Delete old image if exists
        if ($about->image && !filter_var($about->image, FILTER_VALIDATE_URL)) {
          $this->deleteImageFile($about->image);
        }

        $uploadedPath = $this->uploadImage($data['image']);
        if ($uploadedPath) {
          $data['image'] = $uploadedPath;
        } else {
          unset($data['image']);
          Log::warning('Image upload failed for about content update: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Process icon if it's a base64 string
      if (!empty($data['icon']) && $this->isBase64Image($data['icon'])) {
        // Delete old icon if exists
        if ($about->icon && !filter_var($about->icon, FILTER_VALIDATE_URL)) {
          $this->deleteImageFile($about->icon);
        }

        $uploadedPath = $this->uploadImage($data['icon'], 'About/icons');
        if ($uploadedPath) {
          $data['icon'] = $uploadedPath;
        } else {
          unset($data['icon']);
          Log::warning('Icon upload failed for about content update: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image data
      $this->cleanSessionOldInput();

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      $about->update($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ About content updated successfully.');
    } catch (\Exception $e) {
      Log::error('About content update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'about_id' => $id,
        'input' => $request->except(['image', 'icon', 'full_content'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update about content: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle status
   */
  public function toggleStatus(int $id)
  {
    try {
      $about = AboutContent::findOrFail($id);
      $about->is_active = !$about->is_active;
      $about->save();

      $status = $about->is_active ? 'activated' : 'deactivated';
      return redirect()->back()->with('success', "✅ About content {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('About content status toggle failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle about content status.');
    }
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    try {
      $about = AboutContent::findOrFail($id);

      // If making this item featured, remove featured status from others
      if (!$about->is_featured) {
        AboutContent::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
      }

      $about->is_featured = !$about->is_featured;
      $about->save();

      $status = $about->is_featured ? 'featured' : 'unfeatured';
      return redirect()->back()->with('success', "✅ About content {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('About content featured toggle failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle featured status.');
    }
  }

  /**
   * Update display order (for drag & drop reordering)
   */
  public function updateOrder(Request $request)
  {
    try {
      $validator = Validator::make($request->all(), [
        'orders' => 'required|array',
        'orders.*.id' => 'required|integer|exists:about_content,id',
        'orders.*.display_order' => 'required|integer|min:0',
      ]);

      if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
      }

      foreach ($request->orders as $order) {
        AboutContent::where('id', $order['id'])->update([
          'display_order' => $order['display_order']
        ]);
      }

      return response()->json(['success' => true, 'message' => 'Order updated successfully.']);
    } catch (\Exception $e) {
      Log::error('About content order update failed: ' . $e->getMessage());
      return response()->json(['error' => 'Failed to update order.'], 500);
    }
  }

  /**
   * Soft delete
   */
  public function destroy(int $id)
  {
    try {
      $about = AboutContent::findOrFail($id);
      $about->delete();

      return redirect()->back()->with('success', '🗑️ About content moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('About content deletion failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete about content.');
    }
  }

  /**
   * Restore soft-deleted
   */
  public function restore(int $id)
  {
    try {
      $about = AboutContent::withTrashed()->findOrFail($id);
      $about->restore();

      return redirect()->back()->with('success', '🔄 About content restored successfully.');
    } catch (\Exception $e) {
      Log::error('About content restoration failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore about content.');
    }
  }

  /**
   * Force delete – also deletes embedded images from content
   */
  public function forceDelete(int $id)
  {
    try {
      $about = AboutContent::withTrashed()->findOrFail($id);

      // Delete main image
      if ($about->image && !filter_var($about->image, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($about->image);
      }

      // Delete icon
      if ($about->icon && !filter_var($about->icon, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($about->icon);
      }

      // Delete images embedded in the content
      $this->deleteImagesFromContent($about->full_content);

      $about->forceDelete();

      return redirect()->back()->with('success', '🗑️ About content permanently deleted.');
    } catch (\Exception $e) {
      Log::error('About content force deletion failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete about content.');
    }
  }

  /**
   * Clean session old input to prevent max_allowed_packet errors
   */
  protected function cleanSessionOldInput(): void
  {
    if (session()->has('_old_input')) {
      $oldInput = session()->get('_old_input');
      if (isset($oldInput['image']) && $this->isBase64Image($oldInput['image'])) {
        unset($oldInput['image']);
        session()->put('_old_input', $oldInput);
      }
      if (isset($oldInput['icon']) && $this->isBase64Image($oldInput['icon'])) {
        unset($oldInput['icon']);
        session()->put('_old_input', $oldInput);
      }
    }
  }

  /**
   * Generate a unique slug
   */
  protected function generateUniqueSlug(string $title, ?int $excludeId = null): string
  {
    $slug = Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (AboutContent::withTrashed()
      ->where('slug', $slug)
      ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
      ->exists()
    ) {
      $slug = $originalSlug . '-' . $counter;
      $counter++;
    }

    return $slug;
  }

  /**
   * Check if string is a base64 image
   */
  protected function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
  }

  /**
   * Upload image and return the path
   */
  protected function uploadImage(string $base64String, string $subPath = 'About'): ?string
  {
    try {
      // Validate base64 format
      if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches)) {
        Log::warning('Invalid base64 image format');
        return null;
      }

      $imageData = explode(',', $base64String);
      if (count($imageData) < 2) {
        Log::warning('Invalid base64 image data');
        return null;
      }

      $imageContent = base64_decode($imageData[1]);
      if ($imageContent === false) {
        Log::warning('Failed to decode base64 image');
        return null;
      }

      // Check file size (max 5MB for images, 2MB for icons)
      $maxSize = str_contains($subPath, 'icons') ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
      if (strlen($imageContent) > $maxSize) {
        Log::warning('Image too large: ' . strlen($imageContent) . ' bytes');
        return null;
      }

      $extension = $this->getImageExtension($base64String);

      // Generate filename with date prefix: YYYYMMDD_UUID.extension
      $datePrefix = date('Ymd');
      $uuid = Str::uuid();
      $filename = $datePrefix . '_' . $uuid . '.' . $extension;
      $path = $subPath . '/' . $filename;

      // Store the image
      $stored = Storage::disk('public')->put($path, $imageContent);

      if (!$stored) {
        Log::error('Failed to store image: ' . $path);
        return null;
      }

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Image upload failed: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Get image extension from base64 string
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
   * Delete image file from storage
   */
  protected function deleteImageFile(string $imagePath): void
  {
    try {
      $relativePath = str_replace('/storage/', '', $imagePath);
      if (Storage::disk('public')->exists($relativePath)) {
        Storage::disk('public')->delete($relativePath);
        Log::info('Image deleted: ' . $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to delete image: ' . $e->getMessage());
    }
  }

  /**
   * Delete images embedded in HTML content (only from editor-images folder)
   */
  protected function deleteImagesFromContent(?string $content): void
  {
    if (empty($content)) return;

    preg_match_all('/<img[^>]+src="([^"]+)"/i', $content, $matches);
    if (empty($matches[1])) return;

    foreach ($matches[1] as $src) {
      if (str_starts_with($src, '/storage/editor-images/')) {
        $relativePath = str_replace('/storage/', '', $src);
        try {
          if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
            Log::info('Embedded image deleted: ' . $relativePath);
          }
        } catch (\Exception $e) {
          Log::warning('Failed to delete embedded image: ' . $e->getMessage());
        }
      }
    }
  }
}
