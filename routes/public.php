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
$excludedPaths = ['admin', 'backend', 'login', 'register', 'dashboard', 'api', 'storage', 'playground', '_warmup', 'auth', 'complete-profile', 'seeker', 'test-write'];
$exclusionPattern = '^(?!' . implode('|', $excludedPaths) . ').*$';

// Storage file serving
Route::get('/storage/{path}', function ($path) {
  if (str_contains($path, '..')) abort(404);
  $disk = Storage::disk('public');
  if (!$disk->exists($path)) abort(404);
  return response()->file($disk->path($path));
})->where('path', '.*')->name('storage.file');

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

// Playground
Route::get('/playground', function () {
  return Inertia::render('Playground');
})->name('playground');

// Dynamic detail pages (more specific pattern)
Route::get('/{pageSlug}/{detailSlug}', [PageController::class, 'show'])
  ->where('pageSlug', $exclusionPattern)
  ->where('detailSlug', '.*');

// Dynamic listing pages (catch-all)
Route::get('/{pageSlug}', [PageController::class, 'show'])
  ->where('pageSlug', $exclusionPattern);
