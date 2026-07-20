<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Backend\LocationController;

Route::prefix('locations')->name('locations.')->group(function () {
  Route::get('/', [LocationController::class, 'index'])->name('index');
  Route::post('/', [LocationController::class, 'store'])->name('store');
  Route::put('/{location}', [LocationController::class, 'update'])->name('update');
  Route::patch('/{location}/toggle-active', [LocationController::class, 'toggleActive'])->name('toggle-active');
  Route::delete('/{location}', [LocationController::class, 'destroy'])->name('destroy');
  Route::post('/{id}/restore', [LocationController::class, 'restore'])->name('restore');
  Route::delete('/{id}/force-delete', [LocationController::class, 'forceDelete'])->name('force-delete');
  Route::post('/bulk-delete', [LocationController::class, 'bulkDelete'])->name('bulk-delete');
  Route::post('/bulk-restore', [LocationController::class, 'bulkRestore'])->name('bulk-restore');
  Route::post('/bulk-activate', [LocationController::class, 'bulkActivate'])->name('bulk-activate');
  Route::post('/bulk-deactivate', [LocationController::class, 'bulkDeactivate'])->name('bulk-deactivate');
  Route::get('/active', [LocationController::class, 'getActiveLocations'])->name('active');
});
