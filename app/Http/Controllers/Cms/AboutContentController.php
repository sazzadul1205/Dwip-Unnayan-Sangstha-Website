<?php
// app/Http/Controllers/Cms/AboutContentController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\AboutContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AboutContentController extends Controller
{
  /**
   * Display about content items
   */
  public function index(): Response
  {
    $items = AboutContent::withTrashed()->orderBy('display_order')->get();

    return Inertia::render('Backend/CMS/About/Index', [
      'items' => $items,
    ]);
  }

  /**
   * Store new about content
   */
  public function store(Request $request)
  {
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
      $data['image'] = $this->uploadImage($data['image']);
    }

    // Process icon if it's a base64 string (if icon is an image)
    if (!empty($data['icon']) && $this->isBase64Image($data['icon'])) {
      $data['icon'] = $this->uploadImage($data['icon'], 'About/icons');
    }

    // Set default display order if not provided
    if (!isset($data['display_order']) || $data['display_order'] === '') {
      $data['display_order'] = AboutContent::withTrashed()->max('display_order') + 1;
    }

    // Set default slug if not provided
    if (empty($data['slug'])) {
      $data['slug'] = $this->generateSlug($data['title']);
    }

    AboutContent::create($data);

    return redirect()->back()->with('success', 'About content created successfully.');
  }

  /**
   * Update about content
   */
  public function update(Request $request, int $id)
  {
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
        $oldPath = str_replace('/storage/', '', $about->image);
        if (Storage::disk('public')->exists($oldPath)) {
          Storage::disk('public')->delete($oldPath);
        }
      }
      $data['image'] = $this->uploadImage($data['image']);
    }

    // Process icon if it's a base64 string
    if (!empty($data['icon']) && $this->isBase64Image($data['icon'])) {
      // Delete old icon if exists
      if ($about->icon && !filter_var($about->icon, FILTER_VALIDATE_URL)) {
        $oldPath = str_replace('/storage/', '', $about->icon);
        if (Storage::disk('public')->exists($oldPath)) {
          Storage::disk('public')->delete($oldPath);
        }
      }
      $data['icon'] = $this->uploadImage($data['icon'], 'About/icons');
    }

    $about->update($data);

    return redirect()->back()->with('success', 'About content updated successfully.');
  }

  /**
   * Toggle status
   */
  public function toggleStatus(int $id)
  {
    $about = AboutContent::findOrFail($id);
    $about->is_active = !$about->is_active;
    $about->save();

    return redirect()->back()->with('success', 'About content status updated successfully.');
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    $about = AboutContent::findOrFail($id);
    $about->is_featured = !$about->is_featured;
    $about->save();

    return redirect()->back()->with('success', 'About content featured status updated successfully.');
  }

  /**
   * Update display order (for drag & drop reordering)
   */
  public function updateOrder(Request $request)
  {
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

    return response()->json(['success' => true]);
  }

  /**
   * Soft delete
   */
  public function destroy(int $id)
  {
    $about = AboutContent::findOrFail($id);
    $about->delete();

    return redirect()->back()->with('success', 'About content deleted successfully.');
  }

  /**
   * Restore soft-deleted
   */
  public function restore(int $id)
  {
    $about = AboutContent::withTrashed()->findOrFail($id);
    $about->restore();

    return redirect()->back()->with('success', 'About content restored successfully.');
  }

  /**
   * Force delete – also deletes embedded images from content
   */
  public function forceDelete(int $id)
  {
    $about = AboutContent::withTrashed()->findOrFail($id);

    // Delete main image
    if ($about->image && !filter_var($about->image, FILTER_VALIDATE_URL)) {
      $oldPath = str_replace('/storage/', '', $about->image);
      if (Storage::disk('public')->exists($oldPath)) {
        Storage::disk('public')->delete($oldPath);
      }
    }

    // Delete icon
    if ($about->icon && !filter_var($about->icon, FILTER_VALIDATE_URL)) {
      $oldPath = str_replace('/storage/', '', $about->icon);
      if (Storage::disk('public')->exists($oldPath)) {
        Storage::disk('public')->delete($oldPath);
      }
    }

    // 👇 NEW: Delete images embedded in the content
    $this->deleteImagesFromContent($about->full_content);

    $about->forceDelete();

    return redirect()->back()->with('success', 'About content permanently deleted.');
  }

  /**
   * Generate a unique slug
   */
  protected function generateSlug(string $title): string
  {
    $slug = Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (AboutContent::withTrashed()->where('slug', $slug)->exists()) {
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
  /**
   * Upload image and return the path
   */
  protected function uploadImage(string $base64String, string $subPath = 'About'): string
  {
    try {
      $imageData = explode(',', $base64String);
      $imageData = $imageData[1] ?? $base64String;
      $imageContent = base64_decode($imageData);
      $extension = $this->getImageExtension($base64String);

      // Generate filename with date prefix: YYYYMMDD_UUID.extension
      $datePrefix = date('Ymd');
      $uuid = Str::uuid();
      $filename = $datePrefix . '_' . $uuid . '.' . $extension;

      // Single directory structure: About/filename
      $path = $subPath . '/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      return '';
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
   * Delete images embedded in HTML content (only from editor-images folder)
   */
  protected function deleteImagesFromContent(?string $content): void
  {
    if (empty($content)) return;

    // Find all img src attributes
    preg_match_all('/<img[^>]+src="([^"]+)"/i', $content, $matches);
    if (empty($matches[1])) return;

    foreach ($matches[1] as $src) {
      // Only delete if it's from our editor-images folder
      if (str_starts_with($src, '/storage/editor-images/')) {
        $relativePath = str_replace('/storage/', '', $src);
        if (Storage::disk('public')->exists($relativePath)) {
          Storage::disk('public')->delete($relativePath);
        }
      }
    }
  }
}
