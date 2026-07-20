<?php

// ============================================
// ADMIN/BACKEND DASHBOARD ROUTES
// URL: /dashboard, /backend/*
// ============================================

// Facades
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Backend\DashboardController;
use App\Http\Controllers\Admin\CacheController;

// Inertia
use Inertia\Inertia;

Route::middleware(['auth', 'verified', 'profile.complete'])->group(function () {
  // Dashboard
  Route::get('/dashboard', [DashboardController::class, 'index'])->name('backend.dashboard');

  // ============================================
  // BACKEND ROUTES
  // URL: /backend/*
  // ============================================
  Route::prefix('backend')->name('backend.')->group(function () {
    // CMS Routes – now in the same directory
    require __DIR__ . '/cms.php';

    // Job Listing Management
    require __DIR__ . '/job-listings.php';

    // Application Management
    require __DIR__ . '/applications.php';

    // User Management
    require __DIR__ . '/users.php';

    // Role Management
    require __DIR__ . '/roles.php';

    // Profile/Settings Routes
    require __DIR__ . '/settings.php';

    // Backup Routes
    require __DIR__ . '/backup.php';

    // ===== NEW ROUTES (in parent directory) =====
    require __DIR__ . '/../locations.php';
    require __DIR__ . '/../categories.php';
    require __DIR__ . '/../notifications.php';
    require __DIR__ . '/../applicant-profiles.php';
    require __DIR__ . '/../apply.php';

    // Cache Management (Admin only)
    Route::prefix('cache')->name('cache.')->group(function () {
      Route::post('/clear', [CacheController::class, 'clearAll'])->name('clear');
      Route::post('/clear/{pageSlug}', [CacheController::class, 'clearPage'])->name('clear-page');
      Route::get('/status', [CacheController::class, 'status'])->name('status');
    });
  });
});
