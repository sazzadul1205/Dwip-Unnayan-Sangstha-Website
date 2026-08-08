<?php

// ============================================
// PROFILE/SETTINGS ROUTES
// URL: /backend/*-profile, /admin-profile, /employer-profile
// ============================================

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Profile\AdminProfileController;
use App\Http\Controllers\Profile\EmployerProfileController;

// Admin Profile
// Admin Profile (exists)
Route::prefix('admin-profile')->name('admin-profile.')->group(function () {
  Route::get('/edit', [AdminProfileController::class, 'edit'])->name('edit');
  Route::patch('/', [AdminProfileController::class, 'update'])->name('update');
  Route::put('/password', [AdminProfileController::class, 'updatePassword'])->name('password.update');
  Route::post('/icon/update', [AdminProfileController::class, 'updateIcon'])->name('icon.update');
  Route::delete('/icon/reset', [AdminProfileController::class, 'resetIcon'])->name('icon.reset');
});

// Employer Profile (only existing methods)
Route::prefix('employer')->name('employer.')->group(function () {
  Route::get('/profile/edit', [EmployerProfileController::class, 'edit'])->name('profile.edit');
  Route::patch('/profile', [EmployerProfileController::class, 'update'])->name('profile.update');
  Route::put('/profile/password', [EmployerProfileController::class, 'updatePassword'])->name('profile.password.update');
});
