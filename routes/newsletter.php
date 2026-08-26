<?php
// routes/newsletter.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\NewsletterController;

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
  // List all subscribers
  Route::get('/', [NewsletterController::class, 'adminIndex'])->name('index');

  // Campaign management routes
  Route::get('campaigns', [NewsletterController::class, 'adminCampaigns'])->name('campaigns');
  Route::get('campaign/{id}', [NewsletterController::class, 'adminCampaignStatus'])->name('campaign.status');

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
});
