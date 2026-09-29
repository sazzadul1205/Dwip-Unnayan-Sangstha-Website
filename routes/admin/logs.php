<?php

// ============================================
// SYSTEM LOGS ROUTES
// URL: /backend/logs/*
// ============================================
// Human-readable, file-based operational log viewer.
// Complements the database-backed audit trail at
// /backend/audit-logs/*.

use App\Http\Controllers\Backend\LogController;
use Illuminate\Support\Facades\Route;

Route::prefix('logs')->name('logs.')->group(function () {
    Route::get('/', [LogController::class, 'index'])->name('index');
    Route::get('/export', [LogController::class, 'export'])->name('export');
    Route::post('/clear', [LogController::class, 'clear'])->name('clear');
    Route::get('/stats', [LogController::class, 'stats'])->name('stats');
    Route::get('/{type}/{line}', [LogController::class, 'show'])->name('show')->where('type', '[a-z_]+')->whereNumber('line');
});
