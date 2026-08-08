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
use App\Http\Controllers\Backend\PageMapController;


Route::middleware(['auth', 'verified', 'profile.complete'])->group(function () {
  // Dashboard
  Route::get('/dashboard', [DashboardController::class, 'index'])->name('backend.dashboard');

  // ============================================
  // BACKEND ROUTES
  // URL: /backend/*
  // ============================================
  Route::prefix('backend')->name('backend.')->group(function () {
    // CMS Routes
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

    // ===== LOCATION & CATEGORY ROUTES =====
    require __DIR__ . '/../locations.php';
    require __DIR__ . '/../categories.php';

    // ===== NOTIFICATION ROUTES =====
    require __DIR__ . '/../notifications.php';

    // ===== LOG ROUTES =====
    require __DIR__ . '/logs.php';

    // ===== APPLICANT PROFILE ROUTES =====
    // Admin routes for managing applicant profiles
    require __DIR__ . '/../applicant-profiles.php';

    // Owner routes for applicant profiles
    require __DIR__ . '/applicant.php';

    // Job Seeker routes
    require __DIR__ . '/../apply.php';


    // Cache Management (Admin only)
    Route::prefix('cache')->name('cache.')->group(function () {
      Route::post('/clear', [CacheController::class, 'clearAll'])->name('clear');
      Route::post('/clear/{pageSlug}', [CacheController::class, 'clearPage'])->name('clear-page');
      Route::get('/status', [CacheController::class, 'status'])->name('status');
    });
  });
});
