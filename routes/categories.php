<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Backend\JobCategoryController;

Route::prefix('categories')->name('categories.')->group(function () {
  Route::get('/', [JobCategoryController::class, 'index'])->name('index');
  Route::post('/', [JobCategoryController::class, 'store'])->name('store');
  Route::put('/{category}', [JobCategoryController::class, 'update'])->name('update');
  Route::patch('/{category}/toggle-active', [JobCategoryController::class, 'toggleActive'])->name('toggle-active');
  Route::delete('/{category}', [JobCategoryController::class, 'destroy'])->name('destroy');
  Route::post('/{id}/restore', [JobCategoryController::class, 'restore'])->name('restore');
  Route::delete('/{id}/force-delete', [JobCategoryController::class, 'forceDelete'])->name('force-delete');
  Route::post('/bulk-delete', [JobCategoryController::class, 'bulkDelete'])->name('bulk-delete');
  Route::post('/bulk-restore', [JobCategoryController::class, 'bulkRestore'])->name('bulk-restore');
  Route::post('/bulk-activate', [JobCategoryController::class, 'bulkActivate'])->name('bulk-activate');
  Route::post('/bulk-deactivate', [JobCategoryController::class, 'bulkDeactivate'])->name('bulk-deactivate');
  Route::get('/active', [JobCategoryController::class, 'getActiveCategories'])->name('active');
});
