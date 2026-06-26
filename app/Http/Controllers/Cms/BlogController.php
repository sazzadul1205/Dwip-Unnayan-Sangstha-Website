<?php
// app/Http/Controllers/Cms/BlogController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Blog;
use Illuminate\Http\Request;
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
    $items = Blog::withTrashed()->get();

    return Inertia::render('Backend/CMS/Blogs/Index', [
      'items' => $items,
    ]);
  }

  /**
   * Store a new blog
   */
  public function store(Request $request)
  {
    $validator = Validator::make($request->all(), [
      'title' => 'required|string|max:255',
      'slug' => 'nullable|string|unique:blogs,slug',
      'excerpt' => 'nullable|string',
      'full_content' => 'nullable|string',
      'image' => 'nullable|string', // Changed from max:255 to allow base64 images
      'date' => 'nullable|string|max:255',
      'author' => 'nullable|string|max:255',
      'read_time' => 'nullable|integer|min:1',
      'tags' => 'nullable|array',
      'is_featured' => 'boolean',
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

    // Auto-generate slug from title if not provided
    if (empty($data['slug'])) {
      $data['slug'] = $this->generateSlug($data['title']);
    }

    // Set default date if not provided
    if (empty($data['date'])) {
      $data['date'] = now()->format('F j, Y');
    }

    // Set default author if not provided
    if (empty($data['author'])) {
      $data['author'] = 'Admin';
    }

    Blog::create($data);

    return redirect()->back()->with('success', 'Blog created successfully.');
  }

  /**
   * Update a blog
   */
  public function update(Request $request, int $id)
  {
    $blog = Blog::withTrashed()->findOrFail($id);

    $validator = Validator::make($request->all(), [
      'title' => 'required|string|max:255',
      'slug' => 'nullable|string|unique:blogs,slug,' . $id,
      'excerpt' => 'nullable|string',
      'full_content' => 'nullable|string',
      'image' => 'nullable|string', // Changed from max:255 to allow base64 images
      'date' => 'nullable|string|max:255',
      'author' => 'nullable|string|max:255',
      'read_time' => 'nullable|integer|min:1',
      'tags' => 'nullable|array',
      'is_featured' => 'boolean',
      'is_active' => 'boolean',
    ]);

    if ($validator->fails()) {
      return back()->withErrors($validator)->withInput();
    }

    $data = $request->all();

    // Process image if it's a base64 string
    if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
      // Delete old image if exists
      if ($blog->image && !filter_var($blog->image, FILTER_VALIDATE_URL)) {
        $oldPath = str_replace('/storage/', '', $blog->image);
        if (Storage::disk('public')->exists($oldPath)) {
          Storage::disk('public')->delete($oldPath);
        }
      }
      $data['image'] = $this->uploadImage($data['image']);
    }

    // Auto-generate slug from title if slug is empty or if title changed and slug matches old title
    if (empty($data['slug']) || ($data['title'] !== $blog->title && $data['slug'] === $blog->slug)) {
      $data['slug'] = $this->generateSlug($data['title']);
    }

    $blog->update($data);

    return redirect()->back()->with('success', 'Blog updated successfully.');
  }

  /**
   * Toggle blog status
   */
  public function toggleStatus(int $id)
  {
    $blog = Blog::findOrFail($id);
    $blog->is_active = !$blog->is_active;
    $blog->save();

    return redirect()->back()->with('success', 'Blog status updated successfully.');
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    $blog = Blog::findOrFail($id);
    $blog->is_featured = !$blog->is_featured;
    $blog->save();

    return redirect()->back()->with('success', 'Blog featured status updated successfully.');
  }

  /**
   * Soft delete a blog
   */
  public function destroy(int $id)
  {
    $blog = Blog::findOrFail($id);
    $blog->delete();

    return redirect()->back()->with('success', 'Blog deleted successfully.');
  }

  /**
   * Restore a soft-deleted blog
   */
  public function restore(int $id)
  {
    $blog = Blog::withTrashed()->findOrFail($id);
    $blog->restore();

    return redirect()->back()->with('success', 'Blog restored successfully.');
  }

  /**
   * Force delete a blog
   */
  public function forceDelete(int $id)
  {
    $blog = Blog::withTrashed()->findOrFail($id);

    // Delete associated image
    if ($blog->image && !filter_var($blog->image, FILTER_VALIDATE_URL)) {
      $oldPath = str_replace('/storage/', '', $blog->image);
      if (Storage::disk('public')->exists($oldPath)) {
        Storage::disk('public')->delete($oldPath);
      }
    }

    $blog->forceDelete();

    return redirect()->back()->with('success', 'Blog permanently deleted.');
  }

  /**
   * Generate a unique slug from title
   */
  protected function generateSlug(string $title): string
  {
    $slug = Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (Blog::withTrashed()->where('slug', $slug)->exists()) {
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
  protected function uploadImage(string $base64String): string
  {
    try {
      // Extract image data and extension
      $imageData = explode(',', $base64String);
      $imageData = $imageData[1] ?? $base64String;
      $imageContent = base64_decode($imageData);
      $extension = $this->getImageExtension($base64String);

      // Generate unique filename
      $filename = Str::uuid() . '.' . $extension;
      $path = 'Blogs/' . date('Y/m/d') . '/' . $filename;

      // Store the image
      Storage::disk('public')->put($path, $imageContent);

      // Return the public URL
      return '/storage/' . $path;
    } catch (\Exception $e) {
      // If upload fails, return empty string
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
}
