<?php
// app/Http/Controllers/Cms/SharedDataController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\SharedData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SharedDataController extends Controller
{
  /**
   * Display shared data management page
   */
  public function index(): Response
  {
    $sharedData = SharedData::whereIn('type', [
      'topbar',
      'navbar',
      'footer',
      'faq',
      'upcoming-events'
    ])->get();

    return Inertia::render('Backend/CMS/Shared/Index', [
      'sharedData' => $sharedData,
    ]);
  }

  /**
   * Update shared data
   */
  public function update(Request $request, int $id)
  {
    $shared = SharedData::findOrFail($id);

    $validator = Validator::make($request->all(), [
      'data' => 'required|array',
      'is_active' => 'boolean',
    ]);

    if ($validator->fails()) {
      return back()->withErrors($validator)->withInput();
    }

    // Process data - handle image uploads
    $processedData = $this->processImages($request->data, $shared->data, $shared->type);

    $shared->update([
      'data' => $processedData,
      'is_active' => $request->is_active ?? true,
    ]);

    return redirect()->back()->with('success', 'Shared data updated successfully.');
  }

  /**
   * Process and upload images in the data array
   */
  protected function processImages(array $newData, array $oldData, string $type): array
  {
    // Special handling for navbar and footer logos
    if ($type === 'navbar') {
      return $this->processNavbarData($newData, $oldData);
    }

    if ($type === 'footer') {
      return $this->processFooterData($newData, $oldData);
    }

    // For other types, process normally
    return $this->processArrayRecursive($newData, $oldData);
  }

  /**
   * Process navbar data with special logo handling
   */
  protected function processNavbarData(array $newData, array $oldData): array
  {
    // Check if logo.src is a base64 image
    if (isset($newData['logo']['src']) && $this->isBase64Image($newData['logo']['src'])) {
      $newData['logo']['src'] = $this->uploadNavbarLogo($newData['logo']['src']);
    }

    // Process any other arrays in the data
    foreach ($newData as $key => $value) {
      if (is_array($value) && $key !== 'logo') {
        $oldValue = $oldData[$key] ?? [];
        $newData[$key] = $this->processArrayRecursive($value, $oldValue);
      }
    }

    return $newData;
  }

  /**
   * Process footer data with special logo handling
   */
  protected function processFooterData(array $newData, array $oldData): array
  {
    // Check if logo.src is a base64 image
    if (isset($newData['logo']['src']) && $this->isBase64Image($newData['logo']['src'])) {
      $newData['logo']['src'] = $this->uploadFooterLogo($newData['logo']['src']);
    }

    // Process any other arrays in the data
    foreach ($newData as $key => $value) {
      if (is_array($value) && $key !== 'logo') {
        $oldValue = $oldData[$key] ?? [];
        $newData[$key] = $this->processArrayRecursive($value, $oldValue);
      }
    }

    return $newData;
  }

  /**
   * Upload navbar logo with specific naming convention
   */
  protected function uploadNavbarLogo(string $base64String): string
  {
    try {
      $imageData = explode(',', $base64String);
      $imageData = $imageData[1] ?? $base64String;
      $imageContent = base64_decode($imageData);
      $extension = $this->getImageExtension($base64String);

      $filename = 'icon.' . $extension;
      $path = 'images/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      return $base64String;
    }
  }

  /**
   * Upload footer logo with specific naming convention
   */
  protected function uploadFooterLogo(string $base64String): string
  {
    try {
      $imageData = explode(',', $base64String);
      $imageData = $imageData[1] ?? $base64String;
      $imageContent = base64_decode($imageData);
      $extension = $this->getImageExtension($base64String);

      $filename = 'Icon-bottom.' . $extension;
      $path = 'images/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      return $base64String;
    }
  }

  /**
   * Recursively process array for image uploads (for other types)
   */
  protected function processArrayRecursive(array $data, array $oldData): array
  {
    foreach ($data as $key => $value) {
      if (is_array($value)) {
        $oldValue = $oldData[$key] ?? [];
        $data[$key] = $this->processArrayRecursive($value, $oldValue);
      } elseif (is_string($value) && $this->isBase64Image($value)) {
        $data[$key] = $this->uploadGenericImage($value);
      }
    }

    return $data;
  }

  /**
   * Upload generic image with UUID filename
   */
  protected function uploadGenericImage(string $base64String): string
  {
    try {
      $imageData = explode(',', $base64String);
      $imageData = $imageData[1] ?? $base64String;
      $imageContent = base64_decode($imageData);
      $extension = $this->getImageExtension($base64String);
      $filename = Str::uuid() . '.' . $extension;
      $path = 'uploads/shared/' . date('Y/m/d') . '/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      return $base64String;
    }
  }

  /**
   * Check if string is a base64 image
   */
  protected function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
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
