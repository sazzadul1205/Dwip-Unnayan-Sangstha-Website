<?php
// app/Http/Controllers/Cms/PublicationController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Publication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicationController extends Controller
{
  /**
   * Display publications
   */
  public function index(): Response
  {
    try {
      $items = Publication::withTrashed()->orderBy('created_at', 'desc')->get();

      return Inertia::render('Backend/CMS/Publications/Index', [
        'items' => $items,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch publications: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/Publications/Index', [
        'items' => [],
        'flash' => ['error' => 'Failed to load publications. Please try again.']
      ]);
    }
  }

  /**
   * Store a new publication
   */
  public function store(Request $request)
  {
    try {
      $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:publications,slug',
        'excerpt' => 'nullable|string',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'pdf_url' => 'nullable|string',
        'date' => 'nullable|string|max:255',
        'author' => 'nullable|string|max:255',
        'read_time' => 'nullable|string|max:255',
        'tags' => 'nullable|array',
        'category' => 'nullable|string|max:255',
        'views' => 'nullable|integer|min:0',
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
          unset($data['image']);
          Log::warning('Image upload failed for publication: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Process PDF if it's a base64 string
      if (!empty($data['pdf_url']) && $this->isBase64Pdf($data['pdf_url'])) {
        $uploadedPath = $this->uploadPdf($data['pdf_url']);
        if ($uploadedPath) {
          $data['pdf_url'] = $uploadedPath;
        } else {
          unset($data['pdf_url']);
          Log::warning('PDF upload failed for publication: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image/PDF data
      $this->cleanSessionOldInput();

      // Auto-generate slug from title if not provided
      if (empty($data['slug'])) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      // Set default values if not provided
      $data['date'] = $data['date'] ?? now()->format('Y-m-d');
      $data['author'] = $data['author'] ?? 'Admin';
      $data['read_time'] = $data['read_time'] ?? '3 minutes';
      $data['views'] = (int)($data['views'] ?? 0);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      Publication::create($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Publication created successfully.');
    } catch (\Exception $e) {
      Log::error('Publication creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->except(['image', 'pdf_url', 'full_content'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create publication: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update a publication
   */
  public function update(Request $request, int $id)
  {
    try {
      $publication = Publication::withTrashed()->findOrFail($id);

      $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:publications,slug,' . $id,
        'excerpt' => 'nullable|string',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'pdf_url' => 'nullable|string',
        'date' => 'nullable|string|max:255',
        'author' => 'nullable|string|max:255',
        'read_time' => 'nullable|string|max:255',
        'tags' => 'nullable|array',
        'category' => 'nullable|string|max:255',
        'views' => 'nullable|integer|min:0',
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
        if ($publication->image && !filter_var($publication->image, FILTER_VALIDATE_URL)) {
          $this->deleteImageFile($publication->image);
        }

        $uploadedPath = $this->uploadImage($data['image']);
        if ($uploadedPath) {
          $data['image'] = $uploadedPath;
        } else {
          unset($data['image']);
          Log::warning('Image upload failed for publication update: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Process PDF if it's a base64 string
      if (!empty($data['pdf_url']) && $this->isBase64Pdf($data['pdf_url'])) {
        // Delete old PDF if exists
        if ($publication->pdf_url && !filter_var($publication->pdf_url, FILTER_VALIDATE_URL)) {
          $this->deletePdfFile($publication->pdf_url);
        }

        $uploadedPath = $this->uploadPdf($data['pdf_url']);
        if ($uploadedPath) {
          $data['pdf_url'] = $uploadedPath;
        } else {
          unset($data['pdf_url']);
          Log::warning('PDF upload failed for publication update: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image/PDF data
      $this->cleanSessionOldInput();

      // Auto-generate slug from title if needed
      if (empty($data['slug']) || ($data['title'] !== $publication->title && $data['slug'] === $publication->slug)) {
        $data['slug'] = $this->generateUniqueSlug($data['title'], $id);
      }

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      // Ensure views is set
      $data['views'] = (int)($data['views'] ?? $publication->views ?? 0);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      $publication->update($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Publication updated successfully.');
    } catch (\Exception $e) {
      Log::error('Publication update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'publication_id' => $id,
        'input' => $request->except(['image', 'pdf_url', 'full_content'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update publication: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle publication status
   */
  public function toggleStatus(int $id)
  {
    try {
      $publication = Publication::findOrFail($id);
      $publication->is_active = !$publication->is_active;
      $publication->save();

      $status = $publication->is_active ? 'activated' : 'deactivated';
      return redirect()->back()->with('success', "✅ Publication {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Publication status toggle failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle publication status.');
    }
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    try {
      $publication = Publication::findOrFail($id);

      // If making this publication featured, remove featured status from others
      if (!$publication->is_featured) {
        Publication::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
      }

      $publication->is_featured = !$publication->is_featured;
      $publication->save();

      $status = $publication->is_featured ? 'featured' : 'unfeatured';
      return redirect()->back()->with('success', "✅ Publication {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Publication featured toggle failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle featured status.');
    }
  }

  /**
   * Soft delete a publication
   */
  public function destroy(int $id)
  {
    try {
      $publication = Publication::findOrFail($id);
      $publication->delete();

      return redirect()->back()->with('success', '🗑️ Publication moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('Publication deletion failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete publication.');
    }
  }

  /**
   * Restore a soft-deleted publication
   */
  public function restore(int $id)
  {
    try {
      $publication = Publication::withTrashed()->findOrFail($id);
      $publication->restore();

      return redirect()->back()->with('success', '🔄 Publication restored successfully.');
    } catch (\Exception $e) {
      Log::error('Publication restoration failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore publication.');
    }
  }

  /**
   * Force delete a publication – also deletes embedded images and PDF
   */
  public function forceDelete(int $id)
  {
    try {
      $publication = Publication::withTrashed()->findOrFail($id);

      // Delete associated image
      if ($publication->image && !filter_var($publication->image, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($publication->image);
      }

      // Delete PDF file if exists
      if ($publication->pdf_url && !filter_var($publication->pdf_url, FILTER_VALIDATE_URL)) {
        $this->deletePdfFile($publication->pdf_url);
      }

      // Delete images embedded in the content
      $this->deleteImagesFromContent($publication->full_content);

      $publication->forceDelete();

      return redirect()->back()->with('success', '🗑️ Publication permanently deleted.');
    } catch (\Exception $e) {
      Log::error('Publication force deletion failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete publication.');
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
      if (isset($oldInput['pdf_url']) && $this->isBase64Pdf($oldInput['pdf_url'])) {
        unset($oldInput['pdf_url']);
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

    while (Publication::withTrashed()
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
   * Check if string is a base64 PDF
   */
  protected function isBase64Pdf(string $string): bool
  {
    return str_starts_with($string, 'data:application/pdf;base64,');
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

      // Generate filename with date prefix
      $datePrefix = date('Ymd');
      $uuid = Str::uuid();
      $filename = $datePrefix . '_' . $uuid . '.' . $extension;
      $path = 'Publications/' . $filename;

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
   * Upload PDF and return the path
   */
  protected function uploadPdf(string $base64String): ?string
  {
    try {
      // Validate base64 PDF format
      if (!str_starts_with($base64String, 'data:application/pdf;base64,')) {
        Log::warning('Invalid base64 PDF format');
        return null;
      }

      $pdfData = explode(',', $base64String);
      if (count($pdfData) < 2) {
        Log::warning('Invalid base64 PDF data');
        return null;
      }

      $pdfContent = base64_decode($pdfData[1]);
      if ($pdfContent === false) {
        Log::warning('Failed to decode base64 PDF');
        return null;
      }

      // Check file size (max 20MB)
      if (strlen($pdfContent) > 20 * 1024 * 1024) {
        Log::warning('PDF too large: ' . strlen($pdfContent) . ' bytes');
        return null;
      }

      // Generate filename
      $filename = Str::uuid() . '.pdf';
      $path = 'Publications/pdfs/' . date('Y/m/d') . '/' . $filename;

      // Create directory if it doesn't exist
      $directory = dirname($path);
      if (!Storage::disk('public')->exists($directory)) {
        Storage::disk('public')->makeDirectory($directory);
      }

      // Store the PDF
      $stored = Storage::disk('public')->put($path, $pdfContent);

      if (!$stored) {
        Log::error('Failed to store PDF: ' . $path);
        return null;
      }

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('PDF upload failed: ' . $e->getMessage());
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
   * Delete PDF file from storage
   */
  protected function deletePdfFile(string $pdfPath): void
  {
    try {
      $relativePath = str_replace('/storage/', '', $pdfPath);
      if (Storage::disk('public')->exists($relativePath)) {
        Storage::disk('public')->delete($relativePath);
        Log::info('PDF deleted: ' . $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to delete PDF: ' . $e->getMessage());
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
