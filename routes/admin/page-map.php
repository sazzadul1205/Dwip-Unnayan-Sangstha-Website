<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Backend\PageMapController;

Route::middleware(['auth', 'verified', 'profile.complete'])
  ->prefix('backend/page-map')
  ->name('page-map.')
  ->group(function () {
    Route::get('/', [PageMapController::class, 'index'])->name('index');
    Route::get('/export', [PageMapController::class, 'exportJson'])->name('export');
    Route::get('/admin-menu', [PageMapController::class, 'adminMenu'])->name('admin-menu');
    Route::get('/navigation-tree', [PageMapController::class, 'navigationTree'])->name('navigation-tree');
    Route::get('/sitemap-urls', [PageMapController::class, 'sitemapUrls'])->name('sitemap-urls');
    Route::post('/clear-cache', [PageMapController::class, 'clearCache'])->name('clear-cache');
  });
