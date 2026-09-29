<?php
// routes/admin/email-templates.php

use App\Http\Controllers\Backend\EmailTemplateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| EMAIL TEMPLATE MANAGER
|--------------------------------------------------------------------------
| Read / write access to the Blade email templates in
| resources/views/emails/. Every action re-checks permissions in the
| controller, so the middleware here is only about authentication.
|
*/
Route::prefix('backend/email-templates')
    ->name('backend.email-templates.')
    ->middleware(['auth', 'verified'])
    ->where(['slug' => '[a-z0-9-]+', 'file' => '[A-Za-z0-9._-]+'])
    ->group(function () {
        Route::get('/', [EmailTemplateController::class, 'index'])->name('index');
        Route::get('{slug}/edit', [EmailTemplateController::class, 'edit'])->name('edit');
        Route::put('{slug}', [EmailTemplateController::class, 'update'])->name('update');
        Route::get('{slug}/download', [EmailTemplateController::class, 'download'])->name('download');
        Route::post('{slug}/preview', [EmailTemplateController::class, 'preview'])->name('preview');
        Route::post('{slug}/test-send', [EmailTemplateController::class, 'sendTest'])->name('test-send');
        Route::post('{slug}/revisions/{file}/restore', [EmailTemplateController::class, 'revert'])->name('revert');
    });
