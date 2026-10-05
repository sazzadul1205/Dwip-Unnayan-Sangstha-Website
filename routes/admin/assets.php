<?php
// routes/admin/assets.php

use App\Http\Controllers\Backend\AssetManagerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ASSET / IMAGE MANAGEMENT
|--------------------------------------------------------------------------
| File-browser view of storage/app/public and public/images, with
| per-file reference detection so unused assets can be spotted.
|
| Driven entirely by the filesystem — no database required.
|
*/
Route::prefix('backend/assets')
    ->name('backend.assets.')
    ->middleware(['auth', 'verified'])
    ->group(function () {
        Route::get('/', [AssetManagerController::class, 'index'])->name('index');
        Route::post('/refresh', [AssetManagerController::class, 'refresh'])->name('refresh');
        Route::post('/destroy', [AssetManagerController::class, 'destroy'])->name('destroy');
        Route::get('/{asset}', [AssetManagerController::class, 'show'])
            ->name('show')
            // Ids look like "Uploads/banner/x.jpg", so slashes are part of the id.
            ->where('asset', '.*');
    });