<?php
// app/Http/Controllers/Cms/ProgramController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
  /**
   * Display programs
   */
  public function index(): Response
  {
    $items = Program::withTrashed()->orderBy('display_order')->get();

    return Inertia::render('Backend/CMS/Programs/Index', [
      'items' => $items,
    ]);
  }

  /**
   * Store a new program
   */
  public function store(Request $request)
  {
    try {
      $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:programs,slug',
        'breadcrumb' => 'nullable|string|max:255',
        'full_content_html' => 'nullable|string',
        'image' => 'nullable|string',
        'bg_color' => 'nullable|string|max:255',
        'link' => 'nullable|string|max:255',
        'display_order' => 'nullable|integer|min:0',
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
          Log::warning('Image upload failed for program: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image data
      $this->cleanSessionOldInput();

      // Auto-generate slug from title if not provided
      if (empty($data['slug'])) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // Set default display order if not provided
      if (!isset($data['display_order']) || $data['display_order'] === '') {
        $data['display_order'] = Program::withTrashed()->max('display_order') + 1;
      }

      // Set default breadcrumb if not provided
      if (empty($data['breadcrumb'])) {
        $data['breadcrumb'] = $data['title'];
      }

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      Program::create($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Program created successfully.');
    } catch (\Exception $e) {
      Log::error('Program creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->except(['image', 'full_content_html'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create program: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update a program
   */
  public function update(Request $request, int $id)
  {
    try {
      $program = Program::withTrashed()->findOrFail($id);

      $validator = Validator::make($request->all(), [
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:programs,slug,' . $id,
        'breadcrumb' => 'nullable|string|max:255',
        'full_content_html' => 'nullable|string',
        'image' => 'nullable|string',
        'bg_color' => 'nullable|string|max:255',
        'link' => 'nullable|string|max:255',
        'display_order' => 'nullable|integer|min:0',
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
        if ($program->image && !filter_var($program->image, FILTER_VALIDATE_URL)) {
          $this->deleteImageFile($program->image);
        }

        $uploadedPath = $this->uploadImage($data['image']);
        if ($uploadedPath) {
          $data['image'] = $uploadedPath;
        } else {
          // If upload fails, keep the old image
          unset($data['image']);
          Log::warning('Image upload failed for program update: ' . ($data['title'] ?? 'unknown'));
        }
      }

      // Clear any session flash data that might contain large image data
      $this->cleanSessionOldInput();

      // Auto-generate slug from title if slug is empty or if title changed and slug matches old title
      if (empty($data['slug']) || ($data['title'] !== $program->title && $data['slug'] === $program->slug)) {
        $data['slug'] = $this->generateUniqueSlug($data['title'], $id);
      }

      // Ensure boolean values are cast correctly
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      $program->update($data);

      // Clear any large data from session before redirect
      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Program updated successfully.');
    } catch (\Exception $e) {
      Log::error('Program update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'program_id' => $id,
        'input' => $request->except(['image', 'full_content_html'])
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update program: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle program status
   */
  public function toggleStatus(int $id)
  {
    try {
      $program = Program::findOrFail($id);
      $program->is_active = !$program->is_active;
      $program->save();

      $status = $program->is_active ? 'activated' : 'deactivated';
      return redirect()->back()->with('success', "✅ Program {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Program status toggle failed: ' . $e->getMessage(), ['program_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle program status.');
    }
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    try {
      $program = Program::findOrFail($id);

      // If making this program featured, remove featured status from others
      if (!$program->is_featured) {
        Program::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
      }

      $program->is_featured = !$program->is_featured;
      $program->save();

      $status = $program->is_featured ? 'featured' : 'unfeatured';
      return redirect()->back()->with('success', "✅ Program {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Program featured toggle failed: ' . $e->getMessage(), ['program_id' => $id]);
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
        'orders.*.id' => 'required|integer|exists:programs,id',
        'orders.*.display_order' => 'required|integer|min:0',
      ]);

      if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
      }

      foreach ($request->orders as $order) {
        Program::where('id', $order['id'])->update([
          'display_order' => $order['display_order']
        ]);
      }

      return response()->json(['success' => true, 'message' => 'Order updated successfully.']);
    } catch (\Exception $e) {
      Log::error('Program order update failed: ' . $e->getMessage());
      return response()->json(['error' => 'Failed to update order.'], 500);
    }
  }

  /**
   * Soft delete a program
   */
  public function destroy(int $id)
  {
    try {
      $program = Program::findOrFail($id);
      $program->delete();

      return redirect()->back()->with('success', '🗑️ Program moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('Program deletion failed: ' . $e->getMessage(), ['program_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete program.');
    }
  }

  /**
   * Restore a soft-deleted program
   */
  public function restore(int $id)
  {
    try {
      $program = Program::withTrashed()->findOrFail($id);
      $program->restore();

      return redirect()->back()->with('success', '🔄 Program restored successfully.');
    } catch (\Exception $e) {
      Log::error('Program restoration failed: ' . $e->getMessage(), ['program_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore program.');
    }
  }

  /**
   * Force delete a program – also deletes embedded images from content
   */
  public function forceDelete(int $id)
  {
    try {
      $program = Program::withTrashed()->findOrFail($id);

      // Delete associated image
      if ($program->image && !filter_var($program->image, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($program->image);
      }

      // Delete images embedded in the content
      $this->deleteImagesFromContent($program->full_content_html);

      $program->forceDelete();

      return redirect()->back()->with('success', '🗑️ Program permanently deleted.');
    } catch (\Exception $e) {
      Log::error('Program force deletion failed: ' . $e->getMessage(), ['program_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete program.');
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

    while (Program::withTrashed()
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

      // Create filename with date and UUID
      $datePrefix = date('Ymd');
      $uuid = Str::uuid();
      $filename = $datePrefix . '_' . $uuid . '.' . $extension;
      $path = 'Programs/' . $filename;

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
