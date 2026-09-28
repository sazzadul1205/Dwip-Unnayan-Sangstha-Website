<?php
// routes/newsletter.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NewsletterController;
use App\Http\Controllers\Backend\NewsletterCampaignController;

// Public newsletter routes (no auth required)
Route::prefix('newsletter')->name('newsletter.')->group(function () {
  Route::post('subscribe', [NewsletterController::class, 'subscribe'])->name('subscribe');
  Route::get('unsubscribe/{token}', [NewsletterController::class, 'unsubscribe'])->name('unsubscribe');
  Route::get('resubscribe/{token}', [NewsletterController::class, 'resubscribe'])->name('resubscribe');
  Route::post('status', [NewsletterController::class, 'status'])->name('status');
  Route::post('unsubscribe-email', [NewsletterController::class, 'unsubscribeByEmail'])->name('unsubscribe.email');
});

// Admin newsletter management routes (requires auth)
Route::prefix('backend/newsletter')->name('backend.newsletter.')->middleware(['auth', 'verified'])->group(function () {
  // ---- Subscribers -------------------------------------------------------
  Route::get('/', [NewsletterController::class, 'adminIndex'])->name('index');

  // Export subscribers
  Route::post('export', [NewsletterController::class, 'adminExport'])->name('export');

  // Bulk actions
  Route::post('bulk-delete', [NewsletterController::class, 'adminBulkDelete'])->name('bulk-delete');
  Route::post('bulk-unsubscribe', [NewsletterController::class, 'adminBulkUnsubscribe'])->name('bulk-unsubscribe');
  Route::post('send-bulk', [NewsletterController::class, 'sendBulkEmail'])->name('send-bulk');

  // Single subscriber actions
  Route::delete('{id}', [NewsletterController::class, 'adminDestroy'])->name('destroy');
  Route::post('{id}/unsubscribe', [NewsletterController::class, 'adminUnsubscribe'])->name('unsubscribe');
  Route::post('{id}/resubscribe', [NewsletterController::class, 'adminResubscribe'])->name('resubscribe');

  // Send test email
  Route::post('send-test', [NewsletterController::class, 'adminSendTest'])->name('send-test');

  /* ======================================================================
   |  CAMPAIGN MANAGER
   |  Registered before the `{id}` subscriber routes above would otherwise
   |  swallow "campaigns" as a subscriber id.
   |===================================================================== */
  Route::prefix('campaigns')->name('campaigns.')->group(function () {
    Route::get('/', [NewsletterCampaignController::class, 'index'])->name('index');
    Route::get('create', [NewsletterCampaignController::class, 'create'])->name('create');
    Route::post('/', [NewsletterCampaignController::class, 'store'])->name('store');

    // Editor helpers (JSON)
    Route::post('preview', [NewsletterCampaignController::class, 'preview'])->name('preview');
    Route::post('test-send', [NewsletterCampaignController::class, 'sendTest'])->name('test-send');

    // Per-campaign
    Route::get('{id}', [NewsletterCampaignController::class, 'show'])->name('show');
    Route::get('{id}/edit', [NewsletterCampaignController::class, 'edit'])->name('edit');
    Route::put('{id}', [NewsletterCampaignController::class, 'update'])->name('update');
    Route::delete('{id}', [NewsletterCampaignController::class, 'destroy'])->name('destroy');
    Route::post('{id}/duplicate', [NewsletterCampaignController::class, 'duplicate'])->name('duplicate');
    Route::post('{id}/retry-failed', [NewsletterCampaignController::class, 'retryFailed'])->name('retry-failed');

    // Exports
    Route::get('{id}/export/html', [NewsletterCampaignController::class, 'exportHtml'])->name('export-html');
    Route::get('{id}/export/recipients', [NewsletterCampaignController::class, 'exportRecipients'])->name('export-recipients');
  });

  // Legacy campaign status endpoint kept for backwards compatibility.
  Route::get('campaign/{id}', [NewsletterController::class, 'adminCampaignStatus'])->name('campaign.status');
  Route::get('campaigns-legacy', [NewsletterController::class, 'adminCampaigns'])->name('campaigns.legacy');
});

