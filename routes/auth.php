<?php

// ============================================
// AUTHENTICATION ROUTES
// URL: /login, /register, /auth/*
// ============================================

// Facades
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Auth\Shared\GoogleAuthController;
use App\Http\Controllers\Auth\Shared\NewPasswordController;
use App\Http\Controllers\Auth\Shared\VerifyEmailController;
use App\Http\Controllers\Auth\Shared\EmailVerifiedController;
use App\Http\Controllers\Auth\AdminStaff\AdminLoginController;
use App\Http\Controllers\Auth\JobSeeker\JobSeekerLoginController;
use App\Http\Controllers\Auth\Shared\PasswordResetLinkController;
use App\Http\Controllers\Auth\Shared\ConfirmablePasswordController;
use App\Http\Controllers\Auth\JobSeeker\JobSeekerRegisterController;
use App\Http\Controllers\Auth\Shared\AuthenticatedSessionController;
use App\Http\Controllers\Auth\Shared\EmailVerificationPromptController;
use App\Http\Controllers\Auth\Shared\EmailVerificationNotificationController;

// Guest routes
Route::middleware('guest')->group(function () {
    // Admin login
    Route::get('/login/staff', [AdminLoginController::class, 'create'])->name('staff.login');
    Route::post('/login/staff', [AdminLoginController::class, 'store']);

    // Job seeker login
    Route::get('/login/seeker', [JobSeekerLoginController::class, 'create'])->name('seeker.login');
    Route::post('/login/seeker', [JobSeekerLoginController::class, 'store']);

    // Default login (redirects to job seeker login)
    Route::get('/login', function () {
        return redirect()->route('seeker.login');
    })->name('login');

    // Job seeker registration
    Route::get('/register', [JobSeekerRegisterController::class, 'create'])->name('register');
    Route::post('/register', [JobSeekerRegisterController::class, 'store'])->middleware('throttle:3,1');

    // Google authentication
    Route::get('auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

    // Password reset
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email')->middleware('throttle:3,1');
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store')->middleware('throttle:3,1');
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    // Email verification
    Route::get('verify-email', EmailVerificationPromptController::class)->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
    Route::get('email/verified', [EmailVerifiedController::class, 'index'])->name('verification.verified');

    // Confirm password
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
