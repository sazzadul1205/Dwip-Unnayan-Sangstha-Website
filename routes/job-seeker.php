<?php

// ============================================
// JOB SEEKER ROUTES
// URL: /complete-profile, /profile/*, /seeker/*
// ============================================

// Requests
use Illuminate\Http\Request;

// Facades
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\Profile\ApplicantProfileController;
use App\Http\Controllers\JobListing\PublicJobListingController;
use App\Http\Controllers\Auth\JobSeeker\ProfileCompletionController;

// Profile completion routes (auth required)
Route::middleware(['auth', 'verified'])->group(function () {
  Route::get('/complete-profile', [ProfileCompletionController::class, 'show'])->name('profile.complete');
  Route::get('/profile/photo/{path}', [ApplicantProfileController::class, 'photo'])->where('path', '.*')->name('profile.photo');
  Route::post('/profile/photo', [ProfileCompletionController::class, 'uploadPhoto'])->name('profile.photo.upload');
  Route::post('/profile/complete', [ProfileCompletionController::class, 'store'])->name('profile.complete.store');
  Route::post('/profile/cv', [ProfileCompletionController::class, 'uploadCv'])->middleware('throttle:profile-cv')->name('profile.cv.upload');
  Route::delete('/profile/cv/{cv}', [ProfileCompletionController::class, 'destroyCv'])->name('profile.cv.destroy');
  Route::patch('/profile/cv/{cv}/primary', [ProfileCompletionController::class, 'setPrimaryCv'])->name('profile.cv.primary');

  // API endpoint for checking verification status
  Route::get('/api/user/verification-status', function (Request $request) {
    return response()->json([
      'verified' => $request->user()->hasVerifiedEmail(),
    ]);
  })->name('api.verification.status');
});

// Job listing routes for job seekers (auth required)
Route::middleware(['auth'])->prefix('backend/seeker')->name('public.jobs.')->group(function () {
  Route::get('/jobs', [PublicJobListingController::class, 'index'])->name('index');
  Route::get('/jobs/{slug}', [PublicJobListingController::class, 'show'])->name('show');
});
