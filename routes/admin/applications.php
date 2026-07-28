<?php

// ============================================
// APPLICATION MANAGEMENT ROUTES
// URL: /backend/applications/*
// ============================================

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Backend\ApplicationsController;

Route::prefix('applications')->name('applications.')->group(function () {
  Route::get('/', [ApplicationsController::class, 'index'])->name('index');
  Route::get('/job/{jobId}', [ApplicationsController::class, 'jobApplications'])->name('job');
  Route::get('/{id}', [ApplicationsController::class, 'show'])->name('show');
  Route::put('/{id}/status', [ApplicationsController::class, 'updateStatus'])->name('update-status');
  Route::post('/bulk-status', [ApplicationsController::class, 'bulkUpdateStatus'])->name('bulk-status');
  Route::delete('/{id}', [ApplicationsController::class, 'destroy'])->name('destroy');
  Route::post('/bulk-delete', [ApplicationsController::class, 'bulkDelete'])->name('bulk-delete');

  // ✅ FIX: Change route name to match what frontend expects
  Route::get('/{id}/download-resume', [ApplicationsController::class, 'downloadResume'])->name('download_resume');
  // Keep the old one for backward compatibility (or remove it)
  Route::get('/{id}/download', [ApplicationsController::class, 'downloadResume'])->name('download');

  Route::post('/bulk-download', [ApplicationsController::class, 'bulkDownloadResumes'])->name('bulk-download');
  Route::post('/{id}/send-email', [ApplicationsController::class, 'sendEmail'])->name('send-email');
  Route::post('/bulk-send-email', [ApplicationsController::class, 'sendBulkEmail'])->name('bulk-send-email');
  Route::post('/{id}/recalculate-ats', [ApplicationsController::class, 'recalculateAts'])->name('recalculate-ats');
  Route::post('/export/{jobId}', [ApplicationsController::class, 'exportApplications'])->name('export');
  Route::post('/export-single/{id}', [ApplicationsController::class, 'exportSingleApplication'])->name('export-single');
});
