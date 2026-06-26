<?php
// app/Http/Controllers/Cms/ProgramController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
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
      $data['image'] = $this->uploadImage($data['image']);
    }

    // Auto-generate slug from title if not provided
    if (empty($data['slug'])) {
      $data['slug'] = $this->generateSlug($data['title']);
    }

    // Set default display order if not provided
    if (!isset($data['display_order']) || $data['display_order'] === '') {
      $data['display_order'] = Program::withTrashed()->max('display_order') + 1;
    }

    // Set default breadcrumb if not provided
    if (empty($data['breadcrumb'])) {
      $data['breadcrumb'] = $data['title'];
    }

    Program::create($data);

    return redirect()->back()->with('success', 'Program created successfully.');
  }

  /**
   * Update a program
   */
  public function update(Request $request, int $id)
  {
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
      // Delete old image if exists
      if ($program->image && !filter_var($program->image, FILTER_VALIDATE_URL)) {
        $oldPath = str_replace('/storage/', '', $program->image);
        if (Storage::disk('public')->exists($oldPath)) {
          Storage::disk('public')->delete($oldPath);
        }
      }
      $data['image'] = $this->uploadImage($data['image']);
    }

    // Auto-generate slug from title if slug is empty or if title changed and slug matches old title
    if (empty($data['slug']) || ($data['title'] !== $program->title && $data['slug'] === $program->slug)) {
      $data['slug'] = $this->generateSlug($data['title']);
    }

    $program->update($data);

    return redirect()->back()->with('success', 'Program updated successfully.');
  }

  /**
   * Toggle program status
   */
  public function toggleStatus(int $id)
  {
    $program = Program::findOrFail($id);
    $program->is_active = !$program->is_active;
    $program->save();

    return redirect()->back()->with('success', 'Program status updated successfully.');
  }

  /**
   * Toggle featured status
   */
  public function toggleFeatured(int $id)
  {
    $program = Program::findOrFail($id);
    $program->is_featured = !$program->is_featured;
    $program->save();

    return redirect()->back()->with('success', 'Program featured status updated successfully.');
  }

  /**
   * Update display order (for drag & drop reordering)
   */
  public function updateOrder(Request $request)
  {
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

    return response()->json(['success' => true]);
  }

  /**
   * Soft delete a program
   */
  public function destroy(int $id)
  {
    $program = Program::findOrFail($id);
    $program->delete();

    return redirect()->back()->with('success', 'Program deleted successfully.');
  }

  /**
   * Restore a soft-deleted program
   */
  public function restore(int $id)
  {
    $program = Program::withTrashed()->findOrFail($id);
    $program->restore();

    return redirect()->back()->with('success', 'Program restored successfully.');
  }

  /**
   * Force delete a program
   */
  public function forceDelete(int $id)
  {
    $program = Program::withTrashed()->findOrFail($id);

    // Delete associated image
    if ($program->image && !filter_var($program->image, FILTER_VALIDATE_URL)) {
      $oldPath = str_replace('/storage/', '', $program->image);
      if (Storage::disk('public')->exists($oldPath)) {
        Storage::disk('public')->delete($oldPath);
      }
    }

    $program->forceDelete();

    return redirect()->back()->with('success', 'Program permanently deleted.');
  }

  /**
   * Generate a unique slug from title
   */
  protected function generateSlug(string $title): string
  {
    $slug = Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (Program::withTrashed()->where('slug', $slug)->exists()) {
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
      $path = 'Programs/' . date('Y/m/d') . '/' . $filename;

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
