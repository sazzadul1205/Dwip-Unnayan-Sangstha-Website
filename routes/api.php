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
use App\Http\Controllers\JobListing\PublicJobListingController;
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

// ============================================
// ✅ ADD THIS: API routes for frontend components
// ============================================
Route::prefix('api')->group(function () {
  // Blogs endpoint
  Route::get('blogs', [ContentApiController::class, 'blogs'])->name('api.blogs');

  // Other API endpoints
  Route::get('pages', [ContentApiController::class, 'pages'])->name('api.pages');
  Route::get('programs', [ContentApiController::class, 'programs'])->name('api.programs');
  Route::get('jobs', [ContentApiController::class, 'jobs'])->name('api.jobs');
  Route::get('shared-data', [ContentApiController::class, 'sharedData'])->name('api.shared-data');
  Route::get('about-content', [ContentApiController::class, 'aboutContent'])->name('api.about-content');
  Route::get('section-configs', [ContentApiController::class, 'sectionConfigs'])->name('api.section-configs');
  Route::get('custom-section-data', [ContentApiController::class, 'customSectionData'])->name('api.custom-section-data');
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
  Route::get('/', [JobListingApiController::class, 'index'])->name('api.jobs.index');
  Route::get('/filter-options', [JobListingApiController::class, 'filterOptions'])->name('api.jobs.filters');
  // ✅ Use PublicJobListingController for these two
  Route::get('/popular', [PublicJobListingController::class, 'popular'])->name('api.jobs.popular');
  Route::get('/trending', [PublicJobListingController::class, 'trending'])->name('api.jobs.trending');
  Route::get('/{identifier}', [JobListingApiController::class, 'show'])->name('api.jobs.show');
  Route::get('/{slug}/related', [JobListingApiController::class, 'related'])->name('api.jobs.related');
});
