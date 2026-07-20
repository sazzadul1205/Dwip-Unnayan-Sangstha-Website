<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Profile\ApplicantProfileController;

// Admin routes (index, export, bulk actions, restore, force delete)
Route::prefix('applicant-profiles')->name('applicant-profile.')->group(function () {
  Route::get('/', [ApplicantProfileController::class, 'index'])->name('index');
  Route::post('/bulk-delete', [ApplicantProfileController::class, 'bulkDelete'])->name('bulk-delete');
  Route::post('/bulk-restore', [ApplicantProfileController::class, 'bulkRestore'])->name('bulk-restore');
  Route::delete('/{id}/force-delete', [ApplicantProfileController::class, 'forceDelete'])->name('force-delete');
  Route::get('/export', [ApplicantProfileController::class, 'export'])->name('export');

  // Single profile actions (show, update sections, restore)
  Route::get('/{applicantProfile}', [ApplicantProfileController::class, 'show'])->name('show');
  Route::post('/{applicantProfile}/restore', [ApplicantProfileController::class, 'restore'])->name('restore');
  Route::delete('/{applicantProfile}', [ApplicantProfileController::class, 'destroy'])->name('destroy');

  // Owner-specific updates (these can also be used by admin)
  Route::put('/{applicantProfile}/basic-info', [ApplicantProfileController::class, 'updateBasicInfo'])->name('update-basic');
  Route::put('/{applicantProfile}/professional-info', [ApplicantProfileController::class, 'updateProfessionalInfo'])->name('update-professional');
  Route::put('/{applicantProfile}/work-experiences', [ApplicantProfileController::class, 'updateWorkExperiences'])->name('update-work');
  Route::put('/{applicantProfile}/educations', [ApplicantProfileController::class, 'updateEducations'])->name('update-education');
  Route::put('/{applicantProfile}/achievements', [ApplicantProfileController::class, 'updateAchievements'])->name('update-achievements');
  Route::post('/{applicantProfile}/cv', [ApplicantProfileController::class, 'uploadCv'])->name('upload-cv');
  Route::delete('/cv/{cv}', [ApplicantProfileController::class, 'destroyCv'])->name('destroy-cv');
  Route::post('/cv/{cv}/primary', [ApplicantProfileController::class, 'setPrimaryCv'])->name('set-primary-cv');
});
