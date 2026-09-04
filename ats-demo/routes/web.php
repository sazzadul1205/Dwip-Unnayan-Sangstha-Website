<?php

use App\Http\Controllers\ATSController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ATS Demo Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [ATSController::class, 'dashboard'])->name('ats.dashboard');

// Applications
Route::get('/applications', [ATSController::class, 'applications'])->name('ats.applications.index');
Route::get('/applications/{id}', [ATSController::class, 'showApplication'])->name('ats.applications.show');
Route::post('/applications/{id}/status', [ATSController::class, 'updateStatus'])->name('ats.applications.update-status');
Route::post('/applications/bulk-status', [ATSController::class, 'bulkUpdateStatus'])->name('ats.applications.bulk-status');
Route::post('/applications/{id}/recalculate-ats', [ATSController::class, 'recalculateAtsScore'])->name('ats.applications.recalculate-ats');

// Jobs
Route::get('/jobs', [ATSController::class, 'jobs'])->name('ats.jobs.index');
Route::get('/jobs/{jobId}/applications', [ATSController::class, 'jobApplications'])->name('ats.jobs.applications');
