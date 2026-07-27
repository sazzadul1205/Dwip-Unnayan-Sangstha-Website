<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EditorImageUploadController extends Controller
{
  /**
   * Max image size in bytes (5MB).
   */
  protected int $maxImageSize = 5 * 1024 * 1024;

  /**
   * Allowed MIME types.
   */
  protected array $allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/svg',
    'image/bmp',
    'image/tiff',
  ];

  /**
   * Upload an image from base64 – with rate limiting.
   */
  public function upload(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('cms.dashboard')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('editor_upload', $user->id, 10, 60);

    try {
      $request->validate([
        'image' => 'required|string',
      ]);

      $base64 = $request->input('image');

      // Validate base64 format
      if (!str_starts_with($base64, 'data:image/')) {
        return response()->json(['error' => 'Invalid image format'], 422);
      }

      // Extract MIME type and data
      if (!preg_match('/^data:([^;]+);base64,/', $base64, $mimeMatches)) {
        return response()->json(['error' => 'Invalid base64 format'], 422);
      }

      $mimeType = $mimeMatches[1];

      if (!in_array($mimeType, $this->allowedMimeTypes, true)) {
        return response()->json(['error' => 'Unsupported image type: ' . $mimeType], 422);
      }

      $imageData = explode(',', $base64);
      if (count($imageData) < 2) {
        return response()->json(['error' => 'Invalid image data'], 422);
      }

      $imageContent = base64_decode($imageData[1], true);
      if ($imageContent === false) {
        return response()->json(['error' => 'Failed to decode base64 data'], 422);
      }

      // Check file size
      if (strlen($imageContent) > $this->maxImageSize) {
        return response()->json([
          'error' => 'Image too large. Maximum size is ' . ($this->maxImageSize / 1024 / 1024) . 'MB.',
        ], 422);
      }

      $extension = $this->getExtensionFromMime($mimeType);

      if (!$extension) {
        return response()->json(['error' => 'Unsupported image type'], 422);
      }

      // Generate filename: YYYYMMDD_UUID.extension
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = 'editor-images/' . $filename;

      // Store the image
      if (!Storage::disk('public')->put($path, $imageContent)) {
        Log::error('Failed to store editor image: ' . $path);
        return response()->json(['error' => 'Failed to save image'], 500);
      }

      // Clear rate limiter on success
      RateLimiter::clear($this->getThrottleKey('editor_upload', $user->id));

      $url = asset('storage/' . $path);

      SimpleLogger::cms(
        "Editor image uploaded: {$filename}",
        [
          'path' => $path,
          'size' => strlen($imageContent),
          'mime_type' => $mimeType,
          'uploaded_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return response()->json(['url' => $url]);
    } catch (ValidationException $e) {
      return response()->json(['error' => $e->errors()], 422);
    } catch (\Exception $e) {
      Log::error('Editor image upload failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'user_id' => $user->id,
      ]);

      return response()->json(['error' => 'Upload failed: ' . $e->getMessage()], 500);
    }
  }

  /**
   * Delete images from the editor – with rate limiting.
   */
  public function deleteImages(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('cms.dashboard')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('editor_delete', $user->id, 20, 60);

    try {
      $request->validate([
        'urls' => 'required|array',
        'urls.*' => 'string',
      ]);

      $deleted = [];
      $errors = [];

      foreach ($request->urls as $url) {
        // Extract relative path from URL (e.g., /storage/editor-images/...)
        $relativePath = str_replace('/storage/', '', $url);

        // Security: only allow deletion from editor-images folder – prevent path traversal
        if (!str_starts_with($relativePath, 'editor-images/') || str_contains($relativePath, '..')) {
          $errors[] = "Invalid path: {$relativePath}";
          continue;
        }

        if (Storage::disk('public')->exists($relativePath)) {
          Storage::disk('public')->delete($relativePath);
          $deleted[] = $relativePath;
        } else {
          $errors[] = "File not found: {$relativePath}";
        }
      }

      RateLimiter::clear($this->getThrottleKey('editor_delete', $user->id));

      if (!empty($deleted)) {
        SimpleLogger::cms(
          "Editor images deleted",
          [
            'deleted_count' => count($deleted),
            'deleted_paths' => $deleted,
            'deleted_by' => $user->email,
            'ip' => $request->ip(),
          ]
        );
      }

      return response()->json([
        'deleted' => $deleted,
        'errors' => $errors,
        'success' => empty($errors),
      ]);
    } catch (ValidationException $e) {
      return response()->json(['error' => $e->errors()], 422);
    } catch (\Exception $e) {
      Log::error('Editor image deletion failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'user_id' => $user->id,
      ]);

      return response()->json(['error' => 'Deletion failed: ' . $e->getMessage()], 500);
    }
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

  /**
   * Get the authenticated user.
   */
  private function getAuthUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

  /**
   * Check rate limit for editor actions.
   */
  private function checkRateLimit(string $action, int $userId, int $maxAttempts = 10, int $decaySeconds = 60): void
  {
    $key = $this->getThrottleKey($action, $userId);
    if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
      Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
      throw ValidationException::withMessages([
        'rate_limit' => 'Too many upload attempts. Please wait a moment.',
      ]);
    }
    RateLimiter::hit($key, $decaySeconds);
  }

  /**
   * Get throttle key.
   */
  private function getThrottleKey(string $action, int $userId): string
  {
    return "editor_{$action}|{$userId}";
  }

  /**
   * Get file extension from MIME type.
   */
  private function getExtensionFromMime(string $mimeType): ?string
  {
    $map = [
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

    return $map[$mimeType] ?? null;
  }
}
