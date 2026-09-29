<?php
// routes/admin/audit-logs.php

use App\Http\Controllers\Backend\AuditLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUDIT TRAIL
|--------------------------------------------------------------------------
| Read-only view of the audit trail written automatically by the
| AuditMutations middleware and the auth event listeners.
|
*/
Route::prefix('backend/audit-logs')
    ->name('backend.audit-logs.')
    ->middleware(['auth', 'verified'])
    ->group(function () {
        Route::get('/', [AuditLogController::class, 'index'])->name('index');
        Route::get('/export', [AuditLogController::class, 'export'])->name('export');
        Route::get('/stats', [AuditLogController::class, 'stats'])->name('stats');
        Route::get('/{id}', [AuditLogController::class, 'show'])->name('show')->whereNumber('id');
    });
