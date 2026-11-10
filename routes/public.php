<?php

// ============================================
// PUBLIC FRONTEND ROUTES
// URL: /* (catch-all for public pages)
// ============================================

// Controllers
use App\Http\Controllers\Frontend\PageController;

// Inertia
use Inertia\Inertia;

// Facades
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Excluded paths for dynamic routes
$excludedPaths = ['admin', 'backend', 'login', 'register', 'dashboard', 'api', 'storage', 'image-preview', 'playground', '_warmup', 'auth', 'complete-profile', 'seeker', 'test-write'];
$exclusionPattern = '^(?!' . implode('|', $excludedPaths) . ').*$';

// Progressive image preview serving
Route::get('/image-preview/{path}', function ($path) {
  if (str_contains($path, '..')) abort(404);
  $disk = Storage::disk('public');
  if (!$disk->exists($path)) abort(404);

  $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
  if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp', 'bmp'], true)
    && extension_loaded('gd')
    && function_exists('imagewebp')) {
    $sourcePath = $disk->path($path);
    $imageSize = @getimagesize($sourcePath);

    if ($imageSize && $imageSize[0] > 96) {
      $previewPath = 'image-previews/' . hash(
        'sha256',
        $path . '|' . filemtime($sourcePath) . '|96'
      ) . '.webp';

      if (!$disk->exists($previewPath)) {
        $source = @imagecreatefromstring($disk->get($path));

        if ($source !== false) {
          $preview = imagescale($source, 96);
          unset($source);

          if ($preview !== false) {
            imagealphablending($preview, false);
            imagesavealpha($preview, true);
            ob_start();
            $encoded = imagewebp($preview, null, 35);
            $previewContent = ob_get_clean();
            unset($preview);

            if ($encoded && is_string($previewContent) && $previewContent !== '') {
              $disk->put($previewPath, $previewContent);
            }
          }
        }
      }

      if ($disk->exists($previewPath)) {
        return response()->file($disk->path($previewPath), [
          'Content-Type' => 'image/webp',
          'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
      }
    }
  }

  return response()->file($disk->path($path));
})->where('path', '.*')->name('image.preview');

// Unauthorized access page
Route::get('/unauthorized', function () {
  return Inertia::render('UnauthorizedAccess', [
    'status' => 403,
    'message' => session('error', 'You do not have permission to access this page.')
  ]);
})->name('unauthorized.access');

// Home page
Route::get('/', [PageController::class, 'show'])->name('home');

// Sitemap page
Route::get('/sitemap', [PageController::class, 'sitemap'])->name('sitemap');

// Dynamic detail pages (more specific pattern)
Route::get('/{pageSlug}/{detailSlug}', [PageController::class, 'show'])
  ->where('pageSlug', $exclusionPattern)
  ->where('detailSlug', '.*');

// Dynamic listing pages (catch-all)
Route::get('/{pageSlug}', [PageController::class, 'show'])
  ->where('pageSlug', $exclusionPattern);
