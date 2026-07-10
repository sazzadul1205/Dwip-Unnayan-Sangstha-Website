<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EditorImageUploadController extends Controller
{

  // Upload image
  public function upload(Request $request)
  {
    $request->validate([
      'image' => 'required|string',
    ]);

    $base64 = $request->input('image');

    // Validate base64 image
    if (!str_starts_with($base64, 'data:image/')) {
      return response()->json(['error' => 'Invalid image format'], 422);
    }

    // Extract data
    $imageData = explode(',', $base64);
    if (count($imageData) < 2) {
      return response()->json(['error' => 'Invalid image data'], 422);
    }

    $imageContent = base64_decode($imageData[1]);
    $extension = $this->getExtension($base64);

    if (!$extension) {
      return response()->json(['error' => 'Unsupported image type'], 422);
    }

    // Simplified filename: YYYYMMDD_UUID.extension
    $datePrefix = date('Ymd');
    $uuid = Str::uuid();
    $filename = $datePrefix . '_' . $uuid . '.' . $extension;

    // Single directory structure: editor-images/filename
    $path = 'editor-images/' . $filename;

    // Store
    Storage::disk('public')->put($path, $imageContent);

    // ✅ Use asset() instead of Storage::url()
    $url = asset('storage/' . $path);

    return response()->json(['url' => $url]);
  }

  public function deleteImages(Request $request)
  {
    $request->validate([
      'urls' => 'required|array',
      'urls.*' => 'string',
    ]);

    $deleted = [];
    $errors = [];

    foreach ($request->urls as $url) {
      // Extract relative path from URL (e.g., /storage/editor-images/...)
      $path = str_replace('/storage/', '', $url);
      // Security: only allow deletion from editor-images folder
      if (!str_starts_with($path, 'editor-images/')) {
        $errors[] = "Invalid path: {$path}";
        continue;
      }

      if (Storage::disk('public')->exists($path)) {
        Storage::disk('public')->delete($path);
        $deleted[] = $path;
      } else {
        $errors[] = "File not found: {$path}";
      }
    }

    return response()->json([
      'deleted' => $deleted,
      'errors' => $errors,
    ]);
  }

  private function getExtension(string $base64): ?string
  {
    $mimeMap = [
      'image/jpeg' => 'jpg',
      'image/jpg'  => 'jpg',
      'image/png'  => 'png',
      'image/gif'  => 'gif',
      'image/webp' => 'webp',
      'image/svg+xml' => 'svg',
      'image/svg'  => 'svg',
      'image/bmp'  => 'bmp',
      'image/tiff' => 'tiff',
    ];

    if (preg_match('/^data:([^;]+);base64,/', $base64, $matches)) {
      $mime = $matches[1];
      return $mimeMap[$mime] ?? null;
    }

    return null;
  }
}
