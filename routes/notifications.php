<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Backend\NotificationController;

Route::prefix('notifications')->name('notifications.')->group(function () {
  Route::get('/', [NotificationController::class, 'index'])->name('index');
  Route::post('/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('mark-read');
  Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
});
