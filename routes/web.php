<?php

// routes/web.php

// Inertia
use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

// Controllers - Job Listings
use App\Http\Controllers\JobListing\JobListingController;
use App\Http\Controllers\JobListing\PublicJobListingController;

// Controllers - Profile
use App\Http\Controllers\Profile\ApplicantProfileController;
use App\Http\Controllers\Profile\EmployerProfileController;
use App\Http\Controllers\Profile\ProfileCompletionController;

// Controllers
use App\Http\Controllers\Backend\LocationController;
use App\Http\Controllers\Backend\ApplyController;
use App\Http\Controllers\Backend\JobCategoryController;
use App\Http\Controllers\Backend\ApplicationsController;
use App\Http\Controllers\Backend\NotificationController;
use App\Http\Controllers\Backend\RoleController;
use App\Http\Controllers\Backend\UserController;
use App\Http\Controllers\Frontend\FrontendController;
use App\Http\Controllers\Profile\AdminProfileController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;

// Laravel
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Frontend Routes
|--------------------------------------------------------------------------
*/

Route::get('/unauthorized', function () {
    return Inertia::render('UnauthorizedAccess', [
        'status' => 403,
        'message' => session('error', 'You do not have permission to access this page.')
    ]);
})->name('unauthorized.access');

Route::prefix('/')->group(function () {
    // Home page (main landing page)
    Route::get('/', [FrontendController::class, 'home'])->name('home');

    // Other frontend pages
    Route::get('/about', [FrontendController::class, 'about'])->name('frontend.about');
    Route::get('/projects-programs', [FrontendController::class, 'projectsPrograms'])->name('frontend.projects-programs');
    Route::get('/workplace-area', [FrontendController::class, 'workplaceArea'])->name('frontend.workplace-area');
    Route::get('/posts', [FrontendController::class, 'posts'])->name('frontend.posts');
    Route::get('/posts/{slug}', [FrontendController::class, 'showPost'])->name('frontend.posts.show');
    Route::get('/media', [FrontendController::class, 'media'])->name('frontend.media');
    Route::get('/get-involved', [FrontendController::class, 'getInvolved'])->name('frontend.get-involved');
    Route::get('/jobs-frontend', [FrontendController::class, 'jobs'])->name('frontend.jobs');
    Route::get('/jobs-frontend/{slug}', [FrontendController::class, 'showJob'])->name('frontend.jobs.show');
});


// Public job listings (no auth) - Using PublicJobListingController
Route::get('/jobs', [PublicJobListingController::class, 'index'])->name('public.jobs.index');
Route::get('/jobs/{slug}', [PublicJobListingController::class, 'show'])->name('public.jobs.show');

/*
|--------------------------------------------------------------------------
| Profile Completion Route
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    Route::get('/complete-profile', [ProfileCompletionController::class, 'show'])->name('profile.complete');
    Route::get('/profile/photo/{path}', [ApplicantProfileController::class, 'photo'])->where('path', '.*')->name('profile.photo');
    Route::post('/profile/photo', [ProfileCompletionController::class, 'uploadPhoto'])->name('profile.photo.upload');
    Route::post('/profile/complete', [ProfileCompletionController::class, 'store'])->name('profile.complete.store');
    Route::post('/profile/cv', [ProfileCompletionController::class, 'uploadCv'])->middleware('throttle:profile-cv')->name('profile.cv.upload');
    Route::delete('/profile/cv/{cv}', [ProfileCompletionController::class, 'destroyCv'])->name('profile.cv.destroy');
    Route::patch('/profile/cv/{cv}/primary', [ProfileCompletionController::class, 'setPrimaryCv'])->name('profile.cv.primary');

    // API endpoint for checking verification status (used by the verify page)
    Route::get('/api/user/verification-status', function (Request $request) {
        return response()->json([
            'verified' => $request->user()->hasVerifiedEmail(),
        ]);
    })->name('api.verification.status');
});

/*
|--------------------------------------------------------------------------
| Authenticated + VERIFIED Routes (MAIN APP AREA)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'profile.complete'])->group(function () {

    /*
    | Dashboard
    */
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    /*
    | Backend (Admin/Employer Panel)
    */
    Route::prefix('backend')->name('backend.')->group(function () {

        /*
        |--------------------------------------------------------------------------
        | Roles Management 
        |--------------------------------------------------------------------------
        */

        Route::prefix('roles')->name('roles.')->group(function () {
            // Main CRUD
            Route::get('/', [RoleController::class, 'index'])->name('index');
            Route::get('/create', [RoleController::class, 'create'])->name('create');
            Route::post('/', [RoleController::class, 'store'])->name('store');

            // Trashed listing & exports (must be declared before /{id})
            Route::get('/trashed', [RoleController::class, 'trashed'])->name('trashed');
            Route::get('/export', [RoleController::class, 'export'])->name('export');

            Route::get('/{id}', [RoleController::class, 'show'])->name('show')->whereNumber('id');
            Route::get('/{id}/edit', [RoleController::class, 'edit'])->name('edit')->whereNumber('id');
            Route::put('/{id}', [RoleController::class, 'update'])->name('update')->whereNumber('id');

            // Soft Delete & Restore
            Route::delete('/{id}', [RoleController::class, 'destroy'])->name('destroy')->whereNumber('id');
            Route::post('/{id}/restore', [RoleController::class, 'restore'])->name('restore')->whereNumber('id');
            Route::delete('/{id}/force', [RoleController::class, 'forceDelete'])->name('force-delete')->whereNumber('id');

            // Bulk operations
            Route::post('/bulk/delete', [RoleController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [RoleController::class, 'bulkRestore'])->name('bulk-restore');

            // Utilities
            Route::post('/{id}/toggle-status', [RoleController::class, 'toggleStatus'])->name('toggle-status')->whereNumber('id');
            Route::post('/{id}/clone', [RoleController::class, 'clone'])->name('clone')->whereNumber('id');
        });

        /*
        |--------------------------------------------------------------------------
        | Locations Management
        |--------------------------------------------------------------------------
        */

        Route::prefix('locations')->name('locations.')->group(function () {
            // Main CRUD
            Route::get('/', [LocationController::class, 'index'])->name('index');
            Route::post('/', [LocationController::class, 'store'])->name('store');
            Route::put('/{location}', [LocationController::class, 'update'])->name('update');
            Route::delete('/{location}', [LocationController::class, 'destroy'])->name('destroy');

            // Status toggles
            Route::patch('/{location}/toggle', [LocationController::class, 'toggleActive'])->name('toggle');

            // Soft delete & restore
            Route::patch('/{id}/restore', [LocationController::class, 'restore'])->name('restore');
            Route::delete('/{id}/force-delete', [LocationController::class, 'forceDelete'])->name('force-delete');

            // Bulk operations
            Route::post('/bulk/activate', [LocationController::class, 'bulkActivate'])->name('bulk-activate');
            Route::post('/bulk/deactivate', [LocationController::class, 'bulkDeactivate'])->name('bulk-deactivate');
            Route::post('/bulk/delete', [LocationController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [LocationController::class, 'bulkRestore'])->name('bulk-restore');

            // Utilities
            Route::get('/active', [LocationController::class, 'getActiveLocations'])->name('active');
        });

        /*
        |--------------------------------------------------------------------------
        | Job Categories Management
        |--------------------------------------------------------------------------
        */

        Route::prefix('categories')->name('categories.')->group(function () {
            // Custom routes first
            Route::patch('{category}/toggle', [JobCategoryController::class, 'toggleActive'])->name('toggle');
            Route::patch('{category}/restore', [JobCategoryController::class, 'restore'])->name('restore');
            Route::delete('{category}/force-delete', [JobCategoryController::class, 'forceDelete'])->name('force-delete');
            Route::get('active', [JobCategoryController::class, 'getActiveCategories'])->name('active');

            // Bulk operations
            Route::post('bulk/activate', [JobCategoryController::class, 'bulkActivate'])->name('bulk-activate');
            Route::post('bulk/deactivate', [JobCategoryController::class, 'bulkDeactivate'])->name('bulk-deactivate');
            Route::post('bulk/delete', [JobCategoryController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('bulk/restore', [JobCategoryController::class, 'bulkRestore'])->name('bulk-restore');
            Route::post('bulk/force-delete', [JobCategoryController::class, 'bulkForceDelete'])->name('bulk-force-delete');

            // Resource routes
            Route::get('/', [JobCategoryController::class, 'index'])->name('index');
            Route::post('/', [JobCategoryController::class, 'store'])->name('store');
            Route::put('{category}', [JobCategoryController::class, 'update'])->name('update');
            Route::delete('{category}', [JobCategoryController::class, 'destroy'])->name('destroy');
        });

        /*
        |--------------------------------------------------------------------------
        | Job Listings Management
        |--------------------------------------------------------------------------
        */

        Route::prefix('listing')->name('listing.')->group(function () {
            // Custom routes first
            Route::patch('{jobListing}/toggle-active', [JobListingController::class, 'toggleActive'])->name('toggle-active');
            Route::patch('{jobListing}/restore', [JobListingController::class, 'restore'])->name('restore');
            Route::delete('{jobListing}/force-delete', [JobListingController::class, 'forceDelete'])->name('force-delete');
            Route::get('{jobListing}/applications', [JobListingController::class, 'applications'])->name('applications');

            // Bulk routes
            Route::post('/bulk-activate', [JobListingController::class, 'bulkActivate'])->name('bulk-activate');
            Route::post('/bulk-deactivate', [JobListingController::class, 'bulkDeactivate'])->name('bulk-deactivate');
            Route::delete('/bulk-delete', [JobListingController::class, 'bulkDelete'])->name('bulk-delete');

            // Resource routes
            Route::get('/', [JobListingController::class, 'index'])->name('index');
            Route::get('/create', [JobListingController::class, 'create'])->name('create');
            Route::post('/', [JobListingController::class, 'store'])->name('store');
            Route::get('{jobListing}', [JobListingController::class, 'show'])->name('show');
            Route::get('{jobListing}/edit', [JobListingController::class, 'edit'])->name('edit');
            Route::put('{jobListing}', [JobListingController::class, 'update'])->name('update');
            Route::delete('{jobListing}', [JobListingController::class, 'destroy'])->name('destroy');
        });

        /*
        |--------------------------------------------------------------------------
        | Statistics
        |--------------------------------------------------------------------------
        */

        Route::prefix('statistics')->name('statistics.')->group(function () {
            Route::get('/', [JobListingController::class, 'statistics'])->name('index');
        });

        /*
        |--------------------------------------------------------------------------
        | Public Job Listings Management (Backend viewing)
        |--------------------------------------------------------------------------
        */

        Route::prefix('public-jobs')->name('public-jobs.')->group(function () {
            Route::get('/', [PublicJobListingController::class, 'index'])->name('index');
            Route::get('{slug}', [PublicJobListingController::class, 'show'])->name('show');
        });

        /*
        |--------------------------------------------------------------------------
        | Apply To Job Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('apply')->name('apply.')->group(function () {
            Route::get('/', [ApplyController::class, 'index'])->name('index');
            Route::get('/create/{slug}', [ApplyController::class, 'create'])->name('create');
            Route::post('/store/{slug}', [ApplyController::class, 'store'])->name('store');
            Route::get('/{id}', [ApplyController::class, 'show'])->name('show');
            Route::get('/{id}/edit', [ApplyController::class, 'edit'])->name('edit');
            Route::put('/{id}', [ApplyController::class, 'update'])->name('update');
            Route::delete('/{id}', [ApplyController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/restore', [ApplyController::class, 'restore'])->name('restore');
            Route::delete('/{id}/force-delete', [ApplyController::class, 'forceDelete'])->name('force-delete');
            Route::post('/{id}/recalculate-ats', [ApplyController::class, 'recalculateAts'])->name('recalculate-ats');
            Route::get('/{id}/ats-status', [ApplyController::class, 'getAtsStatus'])->name('ats-status');
        });

        /*
        |--------------------------------------------------------------------------
        | Applicant Profile Routes (User-specific - for own profile)
        |--------------------------------------------------------------------------
        */

        Route::prefix('applicant')->name('applicant.')->group(function () {
            Route::delete('/profile/{applicantProfile}', [ApplicantProfileController::class, 'destroy'])->name('profile.destroy');
            Route::get('/profile/{applicantProfile}/download-cv', [ApplicantProfileController::class, 'downloadCV'])->name('profile.download-cv');
            Route::post('/profile/{id}/restore', [ApplicantProfileController::class, 'restore'])->name('profile.restore');
            Route::get('/profile/{id?}', [ApplicantProfileController::class, 'show'])->name('profile.show');
            Route::patch('/profile/{applicantProfile}/basic-info', [ApplicantProfileController::class, 'updateBasicInfo'])->name('profile.update-basic-info');
            Route::patch('/profile/{applicantProfile}/professional-info', [ApplicantProfileController::class, 'updateProfessionalInfo'])->name('profile.update-professional-info');
            Route::put('/profile/{applicantProfile}/work-experiences', [ApplicantProfileController::class, 'updateWorkExperiences'])->name('profile.update-work-experiences');
            Route::put('/profile/{applicantProfile}/educations', [ApplicantProfileController::class, 'updateEducations'])->name('profile.update-educations');
            Route::put('/profile/{applicantProfile}/achievements', [ApplicantProfileController::class, 'updateAchievements'])->name('profile.update-achievements');
            Route::post('/profile/change-password', [ApplicantProfileController::class, 'changePassword'])->name('profile.change-password');
            Route::get('/profile/{applicantProfile}/data', [ApplicantProfileController::class, 'getProfileData'])->name('profile.get-data');
        });

        /*
        |--------------------------------------------------------------------------
        | Applicant Profile Management (Admin - All Profiles)
        |--------------------------------------------------------------------------
        */

        Route::prefix('applicant-profiles')->name('applicant-profile.')->group(function () {
            // Main index with comprehensive filtering
            Route::get('/', [ApplicantProfileController::class, 'index'])->name('index');

            // Single profile view (admin view)
            Route::get('/{id}', [ApplicantProfileController::class, 'show'])->name('show');

            // Bulk operations
            Route::post('/bulk/delete', [ApplicantProfileController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [ApplicantProfileController::class, 'bulkRestore'])->name('bulk-restore');

            // Single profile actions (soft delete & restore)
            Route::delete('/{id}', [ApplicantProfileController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/restore', [ApplicantProfileController::class, 'restore'])->name('restore');

            // Force delete (permanent)
            Route::delete('/{id}/force', [ApplicantProfileController::class, 'forceDelete'])->name('force-delete');

            // Export functionality
            Route::post('/export', [ApplicantProfileController::class, 'export'])->name('export');

            // ==========================================
            // CV Management Routes (for profile management)
            // ==========================================
            Route::post('/cv/upload', [ApplicantProfileController::class, 'uploadCv'])->name('cv.upload');
            Route::delete('/cv/{cv}', [ApplicantProfileController::class, 'destroyCv'])->name('cv.destroy');
            Route::patch('/cv/{cv}/primary', [ApplicantProfileController::class, 'setPrimaryCv'])->name('cv.primary');
        });
        /*
        |--------------------------------------------------------------------------
        | Employer Profile Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('employer')->name('employer.')->group(function () {
            // Profile routes
            Route::get('/profile/{id?}', [EmployerProfileController::class, 'show'])->whereNumber('id')->name('profile.show');
            Route::get('/profile/edit', [EmployerProfileController::class, 'edit'])->name('profile.edit');
            Route::patch('/profile', [EmployerProfileController::class, 'update'])->name('profile.update');
            Route::put('/profile/password', [EmployerProfileController::class, 'updatePassword'])->name('profile.password.update');
        });

        /*
        |--------------------------------------------------------------------------
        | Admin Profile Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('admin-profile')->name('admin-profile.')->group(function () {
            Route::get('/edit', [AdminProfileController::class, 'edit'])->name('edit');
            Route::patch('/', [AdminProfileController::class, 'update'])->name('update');
            Route::put('/password', [AdminProfileController::class, 'updatePassword'])->name('password.update');
        });

        /*
        |--------------------------------------------------------------------------
        | Applications Management (Enhanced with Bulk Actions & CV Downloads)
        |--------------------------------------------------------------------------
        */

        Route::prefix('applications')->name('applications.')->group(function () {
            Route::get('/', [ApplicationsController::class, 'index'])->name('index');
            Route::get('/job/{jobId}', [ApplicationsController::class, 'jobApplications'])->name('job');
            Route::get('/{id}', [ApplicationsController::class, 'show'])->name('show');
            Route::put('/{id}/status', [ApplicationsController::class, 'updateStatus'])->name('update-status');
            Route::post('/bulk-status', [ApplicationsController::class, 'bulkUpdateStatus'])->name('bulk-status');
            Route::delete('/{id}', [ApplicationsController::class, 'destroy'])->name('destroy');
            Route::post('/bulk-delete', [ApplicationsController::class, 'bulkDelete'])->name('bulk-delete');
            Route::get('/{id}/download', [ApplicationsController::class, 'downloadResume'])->name('download');
            Route::post('/bulk-download', [ApplicationsController::class, 'bulkDownloadResumes'])->name('bulk-download');
            Route::post('/{id}/send-email', [ApplicationsController::class, 'sendEmail'])->name('send-email');
            Route::post('/bulk-send-email', [ApplicationsController::class, 'sendBulkEmail'])->name('bulk-send-email');
            Route::post('/{id}/recalculate-ats', [ApplicationsController::class, 'recalculateAts'])->name('recalculate-ats');
            Route::post('export/{jobId}', [ApplicationsController::class, 'exportApplications'])->name('export');
            Route::post('export-single/{id}', [ApplicationsController::class, 'exportSingleApplication'])->name('export-single');
        });

        /*
        |--------------------------------------------------------------------------
        | Users Management
        |--------------------------------------------------------------------------
        */

        Route::prefix('users')->name('users.')->group(function () {
            // Main CRUD
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::post('/', [UserController::class, 'store'])->name('store');
            Route::put('/{id}', [UserController::class, 'update'])->name('update');
            Route::delete('/{id}', [UserController::class, 'destroy'])->name('destroy');

            // Soft delete & restore
            Route::patch('/{id}/restore', [UserController::class, 'restore'])->name('restore');
            Route::post('/{id}/verify', [UserController::class, 'verify'])->name('verify');
            Route::delete('/{id}/force-delete', [UserController::class, 'forceDelete'])->name('force-delete');

            // Bulk operations
            Route::post('/bulk/delete', [UserController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [UserController::class, 'bulkRestore'])->name('bulk-restore');
        });

        /*
        |--------------------------------------------------------------------------
        | Notifications Management
        |--------------------------------------------------------------------------
        */

        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
            Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->name('read');
        });
    });

    /*
    | Settings
    */
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

        Route::get('/password', [PasswordController::class, 'edit'])->name('password');
        Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
    });
});

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

require __DIR__ . '/auth.php';
