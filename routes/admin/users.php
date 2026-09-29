<?php

// ============================================
// USER MANAGEMENT ROUTES
// URL: /backend/users/*
// ============================================

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Backend\UserController;

Route::prefix('users')->name('users.')->group(function () {
  Route::get('/', [UserController::class, 'index'])->name('index');
  Route::get('/jobseekers', [UserController::class, 'jobseekers'])->name('jobseekers');
  Route::post('/', [UserController::class, 'store'])->name('store');
  Route::put('/{id}', [UserController::class, 'update'])->name('update');
  Route::delete('/{id}', [UserController::class, 'destroy'])->name('destroy');
  Route::patch('/{id}/restore', [UserController::class, 'restore'])->name('restore');
  Route::post('/{id}/verify', [UserController::class, 'verify'])->name('verify');
  Route::delete('/{id}/force-delete', [UserController::class, 'forceDelete'])->name('force-delete');
  Route::post('/bulk/delete', [UserController::class, 'bulkDelete'])->name('bulk-delete');
  Route::post('/bulk/restore', [UserController::class, 'bulkRestore'])->name('bulk-restore');
});
