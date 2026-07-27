<?php

// ============================================
// PUBLIC DATA API ROUTES
// URL: /data/*, /api/*
// ============================================

// Facades
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\Api\JobListingApiController;

// Models
use App\Models\pages\Page;
use App\Models\pages\Program;

Route::prefix('data')->group(function () {
  Route::get('jobs.json', [ContentApiController::class, 'jobs']);
  Route::get('blogs.json', [ContentApiController::class, 'blogs']);
  Route::get('pages.json', [ContentApiController::class, 'pages']);
  Route::get('programs.json', [ContentApiController::class, 'programs']);
  Route::get('shared_data.json', [ContentApiController::class, 'sharedData']);
  Route::get('about_content.json', [ContentApiController::class, 'aboutContent']);
  Route::get('section_configs.json', [ContentApiController::class, 'sectionConfigs']);
  Route::get('custom_section_data.json', [ContentApiController::class, 'customSectionData']);
});

// Navigation endpoints
Route::get('/data/navigation.json', function () {
  $pages = Page::where('is_active', true)
    ->where('slug', 'not like', '%-details')
    ->select('id', 'slug', 'name')
    ->orderBy('name')
    ->get()
    ->map(fn($page) => [
      'id' => $page->id,
      'slug' => $page->slug,
      'name' => $page->name,
      'type' => 'page',
      'url' => '/' . $page->slug
    ]);

  $programs = Program::where('is_active', true)
    ->select('id', 'slug', 'title as name')
    ->orderBy('display_order')
    ->get()
    ->map(fn($program) => [
      'id' => $program->id,
      'slug' => $program->slug,
      'name' => $program->name,
      'type' => 'program',
      'url' => '/projects-programs/' . $program->slug
    ]);

  return response()->json([
    'success' => true,
    'items' => $pages->concat($programs)->sortBy('name')->values(),
    'pages' => $pages,
    'programs' => $programs
  ]);
})->name('data.navigation');

// Legacy API endpoints (maintained for backward compatibility)
Route::get('/api/pages', function () {
  return response()->json([
    'success' => true,
    'pages' => Page::where('is_active', true)
      ->where('slug', 'not like', '%-details')
      ->select('id', 'slug', 'name')
      ->orderBy('name')
      ->get()
  ]);
})->name('api.pages');

// Legacy API endpoints (maintained for backward compatibility)
Route::get('/api/programs', function () {
  return response()->json([
    'success' => true,
    'programs' => Program::where('is_active', true)
      ->select('id', 'slug', 'title as name')
      ->orderBy('display_order')
      ->get()
  ]);
})->name('api.programs');

// ============================================
// ✅ JOB LISTING API ROUTES (Infinite Scroll)
// ============================================
Route::prefix('api/jobs')->group(function () {
  // Main endpoint with pagination support
  Route::get('/', [JobListingApiController::class, 'index'])->name('api.jobs.index');

  // ✅ Filter options endpoint
  Route::get('/filter-options', [JobListingApiController::class, 'filterOptions'])->name('api.jobs.filters');

  // Popular jobs
  Route::get('/popular', [JobListingApiController::class, 'popular'])->name('api.jobs.popular');

  // Trending jobs
  Route::get('/trending', [JobListingApiController::class, 'trending'])->name('api.jobs.trending');

  // Single job by ID or slug
  Route::get('/{identifier}', [JobListingApiController::class, 'show'])->name('api.jobs.show');

  // Related jobs
  Route::get('/{slug}/related', [JobListingApiController::class, 'related'])->name('api.jobs.related');
});
