<?php

// ============================================
// JOB LISTING MANAGEMENT ROUTES
// URL: /backend/listing/*
// ============================================

// Facades
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\JobListing\JobListingController;

Route::prefix('listing')->name('listing.')->group(function () {
  Route::get('/', [JobListingController::class, 'adminIndex'])->name('index');
  Route::get('/create', [JobListingController::class, 'adminCreate'])->name('create');
  Route::post('/', [JobListingController::class, 'adminStore'])->name('store');
  Route::post('/bulk-activate', [JobListingController::class, 'bulkActivate'])->name('bulk-activate');
  Route::post('/bulk-deactivate', [JobListingController::class, 'bulkDeactivate'])->name('bulk-deactivate');
  Route::delete('/bulk-delete', [JobListingController::class, 'bulkDelete'])->name('bulk-delete');
  Route::get('/{jobListing}', [JobListingController::class, 'adminShow'])->name('show');
  Route::get('/{jobListing}/edit', [JobListingController::class, 'adminEdit'])->name('edit');
  Route::put('/{jobListing}', [JobListingController::class, 'adminUpdate'])->name('update');
  Route::delete('/{jobListing}', [JobListingController::class, 'adminDestroy'])->name('destroy');
  Route::patch('/{jobListing}/toggle-active', [JobListingController::class, 'toggleActive'])->name('toggle-active');
  Route::patch('/{jobListing}/restore', [JobListingController::class, 'restore'])->name('restore');
  Route::delete('/{jobListing}/force-delete', [JobListingController::class, 'forceDelete'])->name('force-delete');
  Route::get('/{jobListing}/applications', [JobListingController::class, 'applications'])->name('applications');
});

// Statistics
Route::prefix('statistics')->name('statistics.')->group(function () {
  Route::get('/', [JobListingController::class, 'statistics'])->name('index');
});
