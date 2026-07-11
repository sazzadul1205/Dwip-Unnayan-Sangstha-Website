<?php
// app/Http/Controllers/Cms/BlogController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Blog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
  /**
   * Display blogs
   */
  public function index(): Response
  {
    try {
      $items = Blog::withTrashed()->orderBy('created_at', 'desc')->get();

      return Inertia::render('Backend/CMS/Blogs/Index', [
        'items' => $items,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch blogs: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/Blogs/Index', [
        'items' => [],
        'flash' => ['error' => 'Failed to load blogs. Please try again.']
      ]);
    }
  }

  /**
   * Store a new blog
   */
  public function store(Request $request)
  {
    try {
      $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:blogs,slug',
        'excerpt' => 'nullable|string|max:500',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'date' => 'nullable|string|max:255',
        'author' => 'nullable|string|max:255',
        'read_time' => 'nullable|integer|min:1|max:60',
        'tags' => 'nullable|array',
        'tags.*' => 'string|max:50',
        'is_featured' => 'boolean',
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
          // If upload fails, remove the image data
          unset($data['image']);
          Log::warning('Image upload failed for blog: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image data
      $this->cleanSessionOldInput();

      // Auto-generate slug from title if not provided
      if (empty($data['slug'])) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      // Set default values if not provided
      $data['date'] = $data['date'] ?? now()->format('F j, Y');
      $data['author'] = $data['author'] ?? 'Admin';
      $data['read_time'] = (int)($data['read_time'] ?? 5);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      Blog::create($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Blog created successfully!');
    } catch (\Exception $e) {
      Log::error('Blog creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->except(['image', 'full_content'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create blog: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update a blog
   */
  public function update(Request $request, int $id)
  {
    try {
      $blog = Blog::withTrashed()->findOrFail($id);

      $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:blogs,slug,' . $id,
        'excerpt' => 'nullable|string|max:500',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'date' => 'nullable|string|max:255',
        'author' => 'nullable|string|max:255',
        'read_time' => 'nullable|integer|min:1|max:60',
        'tags' => 'nullable|array',
        'tags.*' => 'string|max:50',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
      ]);

      if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
      }

      $data = $request->all();

      // Process image if it's a base64 string
      if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
        // Delete old image if exists and is not a URL
        if ($blog->image && !filter_var($blog->image, FILTER_VALIDATE_URL)) {
          $this->deleteImageFile($blog->image);
        }

        $uploadedPath = $this->uploadImage($data['image']);
        if ($uploadedPath) {
          $data['image'] = $uploadedPath;
        } else {
          // If upload fails, keep the old image
          unset($data['image']);
          Log::warning('Image upload failed for blog update: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image data
      $this->cleanSessionOldInput();

      // Auto-generate slug from title if needed
      if (empty($data['slug']) || ($data['title'] !== $blog->title && $data['slug'] === $blog->slug)) {
        $data['slug'] = $this->generateUniqueSlug($data['title'], $id);
      }

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);
      $data['read_time'] = (int)($data['read_time'] ?? 5);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      $blog->update($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Blog updated successfully!');
    } catch (\Exception $e) {
      Log::error('Blog update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'blog_id' => $id,
        'input' => $request->except(['image', 'full_content'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update blog: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle blog status
   */
  public function toggleStatus(int $id)
  {
    try {
      $blog = Blog::findOrFail($id);
      $blog->is_active = !$blog->is_active;
      $blog->save();

      $status = $blog->is_active ? 'activated' : 'deactivated';
      return redirect()->back()->with('success', "✅ Blog {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Blog status toggle failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle blog status.');
    }
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    try {
      $blog = Blog::findOrFail($id);

      // If making this blog featured, remove featured status from others
      if (!$blog->is_featured) {
        Blog::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
      }

      $blog->is_featured = !$blog->is_featured;
      $blog->save();

      $status = $blog->is_featured ? 'featured' : 'unfeatured';
      return redirect()->back()->with('success', "✅ Blog {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Blog featured toggle failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle featured status.');
    }
  }

  /**
   * Soft delete a blog
   */
  public function destroy(int $id)
  {
    try {
      $blog = Blog::findOrFail($id);
      $blog->delete();

      return redirect()->back()->with('success', '🗑️ Blog moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('Blog deletion failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete blog.');
    }
  }

  /**
   * Restore a soft-deleted blog
   */
  public function restore(int $id)
  {
    try {
      $blog = Blog::withTrashed()->findOrFail($id);
      $blog->restore();

      return redirect()->back()->with('success', '🔄 Blog restored successfully.');
    } catch (\Exception $e) {
      Log::error('Blog restoration failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore blog.');
    }
  }

  /**
   * Force delete a blog – also deletes embedded images from content
   */
  public function forceDelete(int $id)
  {
    try {
      $blog = Blog::withTrashed()->findOrFail($id);

      // Delete main image
      if ($blog->image && !filter_var($blog->image, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($blog->image);
      }

      // Delete images embedded in the content
      $this->deleteImagesFromContent($blog->full_content);

      $blog->forceDelete();

      return redirect()->back()->with('success', '🗑️ Blog permanently deleted.');
    } catch (\Exception $e) {
      Log::error('Blog force deletion failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete blog.');
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

    while (Blog::withTrashed()
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
  protected function uploadImage(string $base64String): ?string
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

      // Check file size (max 5MB)
      if (strlen($imageContent) > 5 * 1024 * 1024) {
        Log::warning('Image too large: ' . strlen($imageContent) . ' bytes');
        return null;
      }

      $extension = $this->getImageExtension($base64String);

      // Simple timestamp-based filename
      $filename = date('Ymd_His') . '_' . uniqid() . '.' . $extension;
      $path = 'Blogs/' . $filename;

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
      'jpeg' => 'jpg',
      'jpg' => 'jpg',
      'png' => 'png',
      'gif' => 'gif',
      'webp' => 'webp',
      'svg+xml' => 'svg',
      'bmp' => 'bmp',
      'tiff' => 'tiff',
      'x-icon' => 'ico',
      'vnd.microsoft.icon' => 'ico',
    ];

    if (preg_match('/^data:image\/([^;]+);base64,/', $base64String, $matches)) {
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
      // Remove storage prefix if present
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
      // Only delete images from the editor-images folder
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
