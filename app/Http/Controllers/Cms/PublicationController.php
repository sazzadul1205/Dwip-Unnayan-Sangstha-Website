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
    $items = Publication::withTrashed()->orderBy('created_at', 'desc')->get();

    return Inertia::render('Backend/CMS/Publications/Index', [
      'items' => $items,
    ]);
  }

  /**
   * Store a new publication
   */
  public function store(Request $request)
  {
    $validator = Validator::make($request->all(), [
      'title' => 'required|string|max:255',
      'slug' => 'nullable|string|unique:publications,slug',
      'excerpt' => 'nullable|string',
      'full_content' => 'nullable|string',
      'image' => 'nullable|string',
      'pdf_url' => 'nullable|string', // No max:255 constraint
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
      $data['image'] = $this->uploadImage($data['image']);
    }

    // Process PDF if it's a base64 string
    if (!empty($data['pdf_url']) && $this->isBase64Pdf($data['pdf_url'])) {
      $data['pdf_url'] = $this->uploadPdf($data['pdf_url']);
    }

    // Auto-generate slug from title if not provided
    if (empty($data['slug'])) {
      $data['slug'] = $this->generateSlug($data['title']);
    }

    // Set default date if not provided
    if (empty($data['date'])) {
      $data['date'] = now()->format('Y-m-d');
    }

    // Set default author if not provided
    if (empty($data['author'])) {
      $data['author'] = 'Admin';
    }

    // Set default read time if not provided
    if (empty($data['read_time'])) {
      $data['read_time'] = '3 minutes';
    }

    // Set default views if not provided
    if (!isset($data['views'])) {
      $data['views'] = 0;
    }

    Publication::create($data);

    return redirect()->back()->with('success', 'Publication created successfully.');
  }

  /**
   * Update a publication
   */
  public function update(Request $request, int $id)
  {
    $publication = Publication::withTrashed()->findOrFail($id);

    $validator = Validator::make($request->all(), [
      'title' => 'required|string|max:255',
      'slug' => 'nullable|string|unique:publications,slug,' . $id,
      'excerpt' => 'nullable|string',
      'full_content' => 'nullable|string',
      'image' => 'nullable|string',
      'pdf_url' => 'nullable|string', // No max:255 constraint
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
        $oldPath = str_replace('/storage/', '', $publication->image);
        if (Storage::disk('public')->exists($oldPath)) {
          Storage::disk('public')->delete($oldPath);
        }
      }
      $data['image'] = $this->uploadImage($data['image']);
    }

    // Process PDF if it's a base64 string
    if (!empty($data['pdf_url']) && $this->isBase64Pdf($data['pdf_url'])) {
      // Delete old PDF if exists
      if ($publication->pdf_url && !filter_var($publication->pdf_url, FILTER_VALIDATE_URL)) {
        $oldPdfPath = str_replace('/storage/', '', $publication->pdf_url);
        if (Storage::disk('public')->exists($oldPdfPath)) {
          Storage::disk('public')->delete($oldPdfPath);
        }
      }
      $data['pdf_url'] = $this->uploadPdf($data['pdf_url']);
    }

    // Auto-generate slug from title if slug is empty or if title changed and slug matches old title
    if (empty($data['slug']) || ($data['title'] !== $publication->title && $data['slug'] === $publication->slug)) {
      $data['slug'] = $this->generateSlug($data['title']);
    }

    // Ensure views is set
    if (!isset($data['views'])) {
      $data['views'] = $publication->views ?? 0;
    }

    $publication->update($data);

    return redirect()->back()->with('success', 'Publication updated successfully.');
  }

  /**
   * Toggle publication status
   */
  public function toggleStatus(int $id)
  {
    $publication = Publication::findOrFail($id);
    $publication->is_active = !$publication->is_active;
    $publication->save();

    return redirect()->back()->with('success', 'Publication status updated successfully.');
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    $publication = Publication::findOrFail($id);
    $publication->is_featured = !$publication->is_featured;
    $publication->save();

    return redirect()->back()->with('success', 'Publication featured status updated successfully.');
  }

  /**
   * Soft delete a publication
   */
  public function destroy(int $id)
  {
    $publication = Publication::findOrFail($id);
    $publication->delete();

    return redirect()->back()->with('success', 'Publication deleted successfully.');
  }

  /**
   * Restore a soft-deleted publication
   */
  public function restore(int $id)
  {
    $publication = Publication::withTrashed()->findOrFail($id);
    $publication->restore();

    return redirect()->back()->with('success', 'Publication restored successfully.');
  }

  /**
   * Force delete a publication – also deletes embedded images and PDF
   */
  public function forceDelete(int $id)
  {
    $publication = Publication::withTrashed()->findOrFail($id);

    // Delete associated image
    if ($publication->image && !filter_var($publication->image, FILTER_VALIDATE_URL)) {
      $oldPath = str_replace('/storage/', '', $publication->image);
      if (Storage::disk('public')->exists($oldPath)) {
        Storage::disk('public')->delete($oldPath);
      }
    }

    // Delete PDF file if exists
    if ($publication->pdf_url && !filter_var($publication->pdf_url, FILTER_VALIDATE_URL)) {
      $pdfPath = str_replace('/storage/', '', $publication->pdf_url);
      if (Storage::disk('public')->exists($pdfPath)) {
        Storage::disk('public')->delete($pdfPath);
      }
    }

    // Delete images embedded in the content
    $this->deleteImagesFromContent($publication->full_content);

    $publication->forceDelete();

    return redirect()->back()->with('success', 'Publication permanently deleted.');
  }

  /**
   * Generate a unique slug from title
   */
  protected function generateSlug(string $title): string
  {
    $slug = Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (Publication::withTrashed()->where('slug', $slug)->exists()) {
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
  /**
   * Upload image and return the path
   */
  protected function uploadImage(string $base64String): string
  {
    try {
      $imageData = explode(',', $base64String);
      if (count($imageData) < 2) {
        return '';
      }
      $imageContent = base64_decode($imageData[1]);
      $extension = $this->getImageExtension($base64String);

      // Simplified filename: YYYYMMDD_UUID.extension
      $datePrefix = date('Ymd');
      $uuid = Str::uuid();
      $filename = $datePrefix . '_' . $uuid . '.' . $extension;

      // Single directory structure: Publications/filename
      $path = 'Publications/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Image upload failed: ' . $e->getMessage());
      return '';
    }
  }

  /**
   * Upload PDF and return the path
   */
  protected function uploadPdf(string $base64String): string
  {
    try {
      // Extract PDF data
      $pdfData = explode(',', $base64String);
      if (count($pdfData) < 2) {
        return '';
      }
      $pdfContent = base64_decode($pdfData[1]);

      // Generate filename
      $filename = Str::uuid() . '.pdf';
      $path = 'Publications/pdfs/' . date('Y/m/d') . '/' . $filename;

      // Store the PDF
      Storage::disk('public')->put($path, $pdfContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('PDF upload failed: ' . $e->getMessage());
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

    preg_match_all('/<img[^>]+src="([^"]+)"/i', $content, $matches);
    if (empty($matches[1])) return;

    foreach ($matches[1] as $src) {
      if (str_starts_with($src, '/storage/editor-images/')) {
        $relativePath = str_replace('/storage/', '', $src);
        if (Storage::disk('public')->exists($relativePath)) {
          Storage::disk('public')->delete($relativePath);
        }
      }
    }
  }
}
