<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Backend\ApplyController;

Route::prefix('apply')->name('apply.')->group(function () {
  Route::get('/', [ApplyController::class, 'index'])->name('index');
  Route::get('/create/{slug}', [ApplyController::class, 'create'])->name('create');
  Route::post('/store/{slug}', [ApplyController::class, 'store'])->name('store');
  Route::get('/{id}', [ApplyController::class, 'show'])->name('show');
  Route::get('/{id}/edit', [ApplyController::class, 'edit'])->name('edit');
  Route::put('/{id}', [ApplyController::class, 'update'])->name('update');
  Route::delete('/{id}', [ApplyController::class, 'destroy'])->name('destroy');
  Route::post('/{id}/restore', [ApplyController::class, 'restore'])->name('restore');
  Route::delete('/{id}/force-delete', [ApplyController::class, 'forceDelete'])->name('force-delete');
  Route::get('/trashed', [ApplyController::class, 'trashed'])->name('trashed');
  Route::post('/{id}/recalculate-ats', [ApplyController::class, 'recalculateAts'])->name('recalculate-ats');
  Route::get('/{id}/ats-status', [ApplyController::class, 'getAtsStatus'])->name('ats-status');
});
