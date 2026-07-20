<?php

// ============================================
// ROUTES: WEB.PHP
// ============================================
// This file contains all web routes for the application.
// Routes are organized by: API, Public, Authentication, Backend, CMS.
// ============================================

// ============================================
// IMPORTS
// ============================================

// Inertia
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Controllers - Frontend
use App\Http\Controllers\Frontend\PageController;

// Controllers - Admin
use App\Http\Controllers\Admin\CacheController;

// Controllers - API
use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\Api\JobListingApiController;

// Controllers - Job Listings
use App\Http\Controllers\JobListing\JobListingController;

// Controllers - Profile
use App\Http\Controllers\Profile\EmployerProfileController;
use App\Http\Controllers\Profile\ApplicantProfileController;
use App\Http\Controllers\Auth\JobSeeker\ProfileCompletionController;

// Controllers - Backend
use App\Http\Controllers\Backend\UserController;
use App\Http\Controllers\Backend\RoleController;
use App\Http\Controllers\Backend\ApplyController;
use App\Http\Controllers\Backend\LocationController;
use App\Http\Controllers\Backend\JobCategoryController;
use App\Http\Controllers\Backend\ApplicationsController;
use App\Http\Controllers\Backend\NotificationController;

// Controllers - Profile (Admin/Employer)
use App\Http\Controllers\Profile\AdminProfileController;

// Controllers - Auth
use App\Http\Controllers\Auth\Shared\GoogleAuthController;
use App\Http\Controllers\Auth\Shared\NewPasswordController;
use App\Http\Controllers\Auth\Shared\VerifyEmailController;
use App\Http\Controllers\Auth\Shared\EmailVerifiedController;
use App\Http\Controllers\Auth\AdminStaff\AdminLoginController;
use App\Http\Controllers\Auth\JobSeeker\JobSeekerLoginController;
use App\Http\Controllers\Auth\Shared\PasswordResetLinkController;
use App\Http\Controllers\Auth\JobSeeker\JobSeekerRegisterController;
use App\Http\Controllers\Auth\Shared\AuthenticatedSessionController;
use App\Http\Controllers\Auth\Shared\ConfirmablePasswordController;
use App\Http\Controllers\Auth\Shared\EmailVerificationPromptController;
use App\Http\Controllers\Auth\Shared\EmailVerificationNotificationController;
use App\Http\Controllers\Backup\BackupController;
// Controllers - CMS
use App\Http\Controllers\Cms\SharedDataController;
use App\Http\Controllers\Cms\EditorImageUploadController;
use App\Http\Controllers\Cms\PageController as CmsPageController;
use App\Http\Controllers\Cms\BlogController as CmsBlogController;
use App\Http\Controllers\Cms\ProgramController as CmsProgramController;
use App\Http\Controllers\Cms\SectionController as CmsSectionController;
use App\Http\Controllers\Cms\PublicationController as CmsPublicationController;
use App\Http\Controllers\Cms\AboutContentController as CmsAboutContentController;
use App\Http\Controllers\Frontend\SharedDataTrait;
// Models
use App\Models\pages\Page;
use App\Models\pages\Program;

// ============================================
// EXCLUDED PATHS FOR DYNAMIC ROUTES
// ============================================
// Define paths that should NOT be handled by the dynamic page controller
$excludedPaths = ['admin', 'backend', 'login', 'register', 'dashboard', 'api', 'storage', 'playground', '_warmup', 'auth', 'complete-profile', 'test-write'];
$exclusionPattern = '^(?!' . implode('|', $excludedPaths) . ').*$';

// ============================================
// SECTION 1: PUBLIC DATA API ROUTES
// URL: /data/* or /api/*
// ============================================

Route::prefix('data')->group(function () {
    Route::get('jobs.json', [ContentApiController::class, 'jobs']);                             // URL: /data/jobs.json
    Route::get('blogs.json', [ContentApiController::class, 'blogs']);                           // URL: /data/blogs.json
    Route::get('pages.json', [ContentApiController::class, 'pages']);                           // URL: /data/pages.json
    Route::get('programs.json', [ContentApiController::class, 'programs']);                     // URL: /data/programs.json
    Route::get('shared_data.json', [ContentApiController::class, 'sharedData']);                // URL: /data/shared_data.json
    Route::get('about_content.json', [ContentApiController::class, 'aboutContent']);            // URL: /data/about_content.json
    Route::get('section_configs.json', [ContentApiController::class, 'sectionConfigs']);        // URL: /data/section_configs.json
    Route::get('custom_section_data.json', [ContentApiController::class, 'customSectionData']); // URL: /data/custom_section_data.json
});

Route::get('/test-write', function () {
    $testFile = storage_path('app/backups/test.txt');
    try {
        file_put_contents($testFile, 'Test write');
        unlink($testFile);
        return '✅ Directory is writable!';
    } catch (\Exception $e) {
        return '❌ Cannot write: ' . $e->getMessage();
    }
});

// Navigation endpoints
Route::get('/data/navigation.json', function () {
    $pages = Page::where('is_active', true)
        ->where('slug', 'not like', '%-details')
        ->select('id', 'slug', 'name')
        ->orderBy('name')
        ->get()
        ->map(function ($page) {
            return [
                'id' => $page->id,
                'slug' => $page->slug,
                'name' => $page->name,
                'type' => 'page',
                'url' => '/' . $page->slug
            ];
        });

    $programs = Program::where('is_active', true)
        ->select('id', 'slug', 'title as name')
        ->orderBy('display_order')
        ->get()
        ->map(function ($program) {
            return [
                'id' => $program->id,
                'slug' => $program->slug,
                'name' => $program->name,
                'type' => 'program',
                'url' => '/projects-programs/' . $program->slug
            ];
        });

    $items = $pages->concat($programs)->sortBy('name')->values();

    return response()->json([
        'success' => true,
        'items' => $items,
        'pages' => $pages,
        'programs' => $programs
    ]);
})->name('data.navigation'); // URL: /data/navigation.json

// Legacy API endpoints (maintained for backward compatibility)
Route::get('/api/pages', function () {
    $pages = Page::where('is_active', true)
        ->where('slug', 'not like', '%-details')
        ->select('id', 'slug', 'name')
        ->orderBy('name')
        ->get();

    return response()->json([
        'success' => true,
        'pages' => $pages
    ]);
})->name('api.pages'); // URL: /api/pages

Route::get('/api/programs', function () {
    $programs = Program::where('is_active', true)
        ->select('id', 'slug', 'title as name')
        ->orderBy('display_order')
        ->get();

    return response()->json([
        'success' => true,
        'programs' => $programs
    ]);
})->name('api.programs'); // URL: /api/programs

// ============================================
// SECTION 2: JOB LISTING API ROUTES
// URL: /api/jobs/*
// ============================================

Route::prefix('api/jobs')->group(function () {
    Route::get('/', [JobListingApiController::class, 'index']);                       // URL: /api/jobs
    Route::get('/{identifier}', [JobListingApiController::class, 'show']);            // URL: /api/jobs/{identifier}
    Route::get('/{slug}/related', [JobListingApiController::class, 'related']);       // URL: /api/jobs/{slug}/related
    Route::get('/popular', [JobListingController::class, 'popular'])->name('api.jobs.popular'); // URL: /api/jobs/popular
    Route::get('/trending', [JobListingController::class, 'trending'])->name('api.jobs.trending'); // URL: /api/jobs/trending
});

// Job listing public routes
Route::middleware('auth')->prefix('seeker')->name('public.jobs.')->group(function () {
    Route::get('/jobs', [JobListingController::class, 'index'])->name('index');       // URL: /seeker/jobs
    Route::get('/jobs/{slug}', [JobListingController::class, 'show'])->name('show');  // URL: /seeker/jobs/{slug}
});

// ============================================
// SECTION 3: PUBLIC FRONTEND ROUTES
// URL: /* (catch-all for public pages)
// ============================================

// Storage file serving
Route::get('/storage/{path}', function ($path) {
    if (str_contains($path, '..')) abort(404);
    $disk = Storage::disk('public');
    if (!$disk->exists($path)) abort(404);
    return response()->file($disk->path($path));
})->where('path', '.*')->name('storage.file'); // URL: /storage/{path}

// Unauthorized access page
Route::get('/unauthorized', function () {
    return Inertia::render('UnauthorizedAccess', [
        'status' => 403,
        'message' => session('error', 'You do not have permission to access this page.')
    ]);
})->name('unauthorized.access'); // URL: /unauthorized

// Home page
Route::get('/', [PageController::class, 'show'])->name('home'); // URL: /

// Playground
Route::get('/playground', function () {
    return Inertia::render('Playground');
})->name('playground'); // URL: /playground

// Dynamic detail pages (more specific pattern)
Route::get('/{pageSlug}/{detailSlug}', [PageController::class, 'show'])
    ->where('pageSlug', $exclusionPattern)
    ->where('detailSlug', '.*'); // URL: /{pageSlug}/{detailSlug}


// Dynamic listing pages (catch-all)
Route::get('/{pageSlug}', [PageController::class, 'show'])
    ->where('pageSlug', $exclusionPattern); // URL: /{pageSlug}


// ============================================
// SECTION 4: AUTHENTICATION ROUTES
// URL: /login, /register, /auth/*
// ============================================

Route::middleware('guest')->group(function () {
    // Admin login
    Route::get('/login/staff', [AdminLoginController::class, 'create'])->name('staff.login');    // URL: /login/staff
    Route::post('/login/staff', [AdminLoginController::class, 'store']);                         // URL: /login/staff (POST)

    // Job seeker login
    Route::get('/login/seeker', [JobSeekerLoginController::class, 'create'])->name('seeker.login'); // URL: /login/seeker
    Route::post('/login/seeker', [JobSeekerLoginController::class, 'store']);               // URL: /login/seeker (POST)

    // Default login (redirects to job seeker login)
    Route::get('/login', function () {
        return redirect()->route('seeker.login');
    })->name('login'); // URL: /login

    // Job seeker registration
    Route::get('/register', [JobSeekerRegisterController::class, 'create'])->name('register');  // URL: /register
    Route::post('/register', [JobSeekerRegisterController::class, 'store']);                    // URL: /register (POST)

    // Google authentication
    Route::get('auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect'); // URL: /auth/google/redirect
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback'); // URL: /auth/google/callback

    // Password reset
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request'); // URL: /forgot-password
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');   // URL: /forgot-password (POST)
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');  // URL: /reset-password/{token}
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');          // URL: /reset-password (POST)
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    // Email verification
    Route::get('verify-email', EmailVerificationPromptController::class)->name('verification.notice'); // URL: /verify-email
    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify'); // URL: /verify-email/{id}/{hash}
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send'); // URL: /email/verification-notification
    Route::get('email/verified', [EmailVerifiedController::class, 'index'])->name('verification.verified'); // URL: /email/verified

    // Confirm password
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm'); // URL: /confirm-password
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);                         // URL: /confirm-password (POST)

    // Logout
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout'); // URL: /logout (POST)
});

// ============================================
// SECTION 5: PROFILE COMPLETION ROUTES
// URL: /complete-profile, /profile/*
// ============================================

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/complete-profile', [ProfileCompletionController::class, 'show'])->name('profile.complete'); // URL: /complete-profile
    Route::get('/profile/photo/{path}', [ApplicantProfileController::class, 'photo'])->where('path', '.*')->name('profile.photo'); // URL: /profile/photo/{path}
    Route::post('/profile/photo', [ProfileCompletionController::class, 'uploadPhoto'])->name('profile.photo.upload'); // URL: /profile/photo (POST)
    Route::post('/profile/complete', [ProfileCompletionController::class, 'store'])->name('profile.complete.store'); // URL: /profile/complete (POST)
    Route::post('/profile/cv', [ProfileCompletionController::class, 'uploadCv'])->middleware('throttle:profile-cv')->name('profile.cv.upload'); // URL: /profile/cv (POST)
    Route::delete('/profile/cv/{cv}', [ProfileCompletionController::class, 'destroyCv'])->name('profile.cv.destroy'); // URL: /profile/cv/{cv} (DELETE)
    Route::patch('/profile/cv/{cv}/primary', [ProfileCompletionController::class, 'setPrimaryCv'])->name('profile.cv.primary'); // URL: /profile/cv/{cv}/primary (PATCH)

    // API endpoint for checking verification status
    Route::get('/api/user/verification-status', function (Request $request) {
        return response()->json([
            'verified' => $request->user()->hasVerifiedEmail(),
        ]);
    })->name('api.verification.status'); // URL: /api/user/verification-status
});

// ============================================
// SECTION 6: MAIN APPLICATION ROUTES
// URL: /dashboard, /backend/*, /settings/*
// ============================================

Route::middleware(['auth', 'verified', 'profile.complete'])->group(function () {
    // Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('backend.dashboard'); // URL: /dashboard

    // ============================================
    // SUBSECTION 6.1: BACKEND ROUTES
    // URL: /backend/*
    // ============================================
    Route::prefix('backend')->name('backend.')->group(function () {

        // Roles Management - URL: /backend/roles/*
        Route::prefix('roles')->name('roles.')->group(function () {
            Route::get('/', [RoleController::class, 'index'])->name('index');                                    // URL: /backend/roles
            Route::get('/create', [RoleController::class, 'create'])->name('create');                             // URL: /backend/roles/create
            Route::post('/', [RoleController::class, 'store'])->name('store');                                   // URL: /backend/roles (POST)
            Route::get('/trashed', [RoleController::class, 'trashed'])->name('trashed');                         // URL: /backend/roles/trashed
            Route::get('/export', [RoleController::class, 'export'])->name('export');                             // URL: /backend/roles/export
            Route::get('/{id}', [RoleController::class, 'show'])->name('show')->whereNumber('id');              // URL: /backend/roles/{id}
            Route::get('/{id}/edit', [RoleController::class, 'edit'])->name('edit')->whereNumber('id');         // URL: /backend/roles/{id}/edit
            Route::put('/{id}', [RoleController::class, 'update'])->name('update')->whereNumber('id');          // URL: /backend/roles/{id} (PUT)
            Route::delete('/{id}', [RoleController::class, 'destroy'])->name('destroy')->whereNumber('id');     // URL: /backend/roles/{id} (DELETE)
            Route::post('/{id}/restore', [RoleController::class, 'restore'])->name('restore')->whereNumber('id'); // URL: /backend/roles/{id}/restore
            Route::delete('/{id}/force', [RoleController::class, 'forceDelete'])->name('force-delete')->whereNumber('id'); // URL: /backend/roles/{id}/force
            Route::post('/bulk/delete', [RoleController::class, 'bulkDelete'])->name('bulk-delete');             // URL: /backend/roles/bulk/delete
            Route::post('/bulk/restore', [RoleController::class, 'bulkRestore'])->name('bulk-restore');         // URL: /backend/roles/bulk/restore
            Route::post('/{id}/toggle-status', [RoleController::class, 'toggleStatus'])->name('toggle-status')->whereNumber('id'); // URL: /backend/roles/{id}/toggle-status
            Route::post('/{id}/clone', [RoleController::class, 'clone'])->name('clone')->whereNumber('id');     // URL: /backend/roles/{id}/clone
        });

        // Locations Management - URL: /backend/locations/*
        Route::prefix('locations')->name('locations.')->group(function () {
            Route::get('/', [LocationController::class, 'index'])->name('index');                               // URL: /backend/locations
            Route::post('/', [LocationController::class, 'store'])->name('store');                              // URL: /backend/locations (POST)
            Route::put('/{location}', [LocationController::class, 'update'])->name('update');                   // URL: /backend/locations/{location} (PUT)
            Route::delete('/{location}', [LocationController::class, 'destroy'])->name('destroy');              // URL: /backend/locations/{location} (DELETE)
            Route::patch('/{location}/toggle', [LocationController::class, 'toggleActive'])->name('toggle');    // URL: /backend/locations/{location}/toggle
            Route::patch('/{id}/restore', [LocationController::class, 'restore'])->name('restore');             // URL: /backend/locations/{id}/restore
            Route::delete('/{id}/force-delete', [LocationController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/locations/{id}/force-delete
            Route::post('/bulk/activate', [LocationController::class, 'bulkActivate'])->name('bulk-activate');   // URL: /backend/locations/bulk/activate
            Route::post('/bulk/deactivate', [LocationController::class, 'bulkDeactivate'])->name('bulk-deactivate'); // URL: /backend/locations/bulk/deactivate
            Route::post('/bulk/delete', [LocationController::class, 'bulkDelete'])->name('bulk-delete');         // URL: /backend/locations/bulk/delete
            Route::post('/bulk/restore', [LocationController::class, 'bulkRestore'])->name('bulk-restore');     // URL: /backend/locations/bulk/restore
            Route::get('/active', [LocationController::class, 'getActiveLocations'])->name('active');           // URL: /backend/locations/active
        });

        // Job Categories Management - URL: /backend/categories/*
        Route::prefix('categories')->name('categories.')->group(function () {
            Route::get('/', [JobCategoryController::class, 'index'])->name('index');                            // URL: /backend/categories
            Route::post('/', [JobCategoryController::class, 'store'])->name('store');                           // URL: /backend/categories (POST)
            Route::put('/{category}', [JobCategoryController::class, 'update'])->name('update');                // URL: /backend/categories/{category} (PUT)
            Route::delete('/{category}', [JobCategoryController::class, 'destroy'])->name('destroy');           // URL: /backend/categories/{category} (DELETE)
            Route::patch('/{category}/toggle', [JobCategoryController::class, 'toggleActive'])->name('toggle'); // URL: /backend/categories/{category}/toggle
            Route::patch('/{category}/restore', [JobCategoryController::class, 'restore'])->name('restore');    // URL: /backend/categories/{category}/restore
            Route::delete('/{category}/force-delete', [JobCategoryController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/categories/{category}/force-delete
            Route::get('/active', [JobCategoryController::class, 'getActiveCategories'])->name('active');       // URL: /backend/categories/active
            Route::post('/bulk/activate', [JobCategoryController::class, 'bulkActivate'])->name('bulk-activate'); // URL: /backend/categories/bulk/activate
            Route::post('/bulk/deactivate', [JobCategoryController::class, 'bulkDeactivate'])->name('bulk-deactivate'); // URL: /backend/categories/bulk/deactivate
            Route::post('/bulk/delete', [JobCategoryController::class, 'bulkDelete'])->name('bulk-delete');     // URL: /backend/categories/bulk/delete
            Route::post('/bulk/restore', [JobCategoryController::class, 'bulkRestore'])->name('bulk-restore');  // URL: /backend/categories/bulk/restore
            Route::post('/bulk/force-delete', [JobCategoryController::class, 'bulkForceDelete'])->name('bulk-force-delete'); // URL: /backend/categories/bulk/force-delete
        });

        // Job Listings Management - URL: /backend/listing/*
        Route::prefix('listing')->name('listing.')->group(function () {
            Route::get('/', [JobListingController::class, 'adminIndex'])->name('index');                       // URL: /backend/listing
            Route::get('/create', [JobListingController::class, 'adminCreate'])->name('create');               // URL: /backend/listing/create
            Route::post('/', [JobListingController::class, 'adminStore'])->name('store');                      // URL: /backend/listing (POST)
            Route::get('/{jobListing}', [JobListingController::class, 'adminShow'])->name('show');             // URL: /backend/listing/{jobListing}
            Route::get('/{jobListing}/edit', [JobListingController::class, 'adminEdit'])->name('edit');        // URL: /backend/listing/{jobListing}/edit
            Route::put('/{jobListing}', [JobListingController::class, 'adminUpdate'])->name('update');         // URL: /backend/listing/{jobListing} (PUT)
            Route::delete('/{jobListing}', [JobListingController::class, 'adminDestroy'])->name('destroy');     // URL: /backend/listing/{jobListing} (DELETE)
            Route::patch('/{jobListing}/toggle-active', [JobListingController::class, 'toggleActive'])->name('toggle-active'); // URL: /backend/listing/{jobListing}/toggle-active
            Route::patch('/{jobListing}/restore', [JobListingController::class, 'restore'])->name('restore');  // URL: /backend/listing/{jobListing}/restore
            Route::delete('/{jobListing}/force-delete', [JobListingController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/listing/{jobListing}/force-delete
            Route::get('/{jobListing}/applications', [JobListingController::class, 'applications'])->name('applications'); // URL: /backend/listing/{jobListing}/applications
            Route::post('/bulk-activate', [JobListingController::class, 'bulkActivate'])->name('bulk-activate'); // URL: /backend/listing/bulk-activate
            Route::post('/bulk-deactivate', [JobListingController::class, 'bulkDeactivate'])->name('bulk-deactivate'); // URL: /backend/listing/bulk-deactivate
            Route::delete('/bulk-delete', [JobListingController::class, 'bulkDelete'])->name('bulk-delete');   // URL: /backend/listing/bulk-delete
        });

        // Statistics - URL: /backend/statistics
        Route::prefix('statistics')->name('statistics.')->group(function () {
            Route::get('/', [JobListingController::class, 'statistics'])->name('index'); // URL: /backend/statistics
        });

        // Apply to Job - URL: /backend/apply/*
        Route::prefix('apply')->name('apply.')->group(function () {
            Route::get('/', [ApplyController::class, 'index'])->name('index');                                   // URL: /backend/apply
            Route::get('/create/{slug}', [ApplyController::class, 'create'])->name('create');                    // URL: /backend/apply/create/{slug}
            Route::post('/store/{slug}', [ApplyController::class, 'store'])->name('store');                      // URL: /backend/apply/store/{slug} (POST)
            Route::get('/{id}', [ApplyController::class, 'show'])->name('show');                                 // URL: /backend/apply/{id}
            Route::get('/{id}/edit', [ApplyController::class, 'edit'])->name('edit');                            // URL: /backend/apply/{id}/edit
            Route::put('/{id}', [ApplyController::class, 'update'])->name('update');                             // URL: /backend/apply/{id} (PUT)
            Route::delete('/{id}', [ApplyController::class, 'destroy'])->name('destroy');                        // URL: /backend/apply/{id} (DELETE)
            Route::post('/{id}/restore', [ApplyController::class, 'restore'])->name('restore');                  // URL: /backend/apply/{id}/restore
            Route::delete('/{id}/force-delete', [ApplyController::class, 'forceDelete'])->name('force-delete');  // URL: /backend/apply/{id}/force-delete
            Route::post('/{id}/recalculate-ats', [ApplyController::class, 'recalculateAts'])->name('recalculate-ats'); // URL: /backend/apply/{id}/recalculate-ats
            Route::get('/{id}/ats-status', [ApplyController::class, 'getAtsStatus'])->name('ats-status');        // URL: /backend/apply/{id}/ats-status
        });

        // Applicant Profile (User Own) - URL: /backend/applicant/*
        Route::prefix('applicant')->name('applicant.')->group(function () {
            Route::get('/profile/{id?}', [ApplicantProfileController::class, 'show'])->name('profile.show');     // URL: /backend/applicant/profile/{id?}
            Route::delete('/profile/{applicantProfile}', [ApplicantProfileController::class, 'destroy'])->name('profile.destroy'); // URL: /backend/applicant/profile/{applicantProfile} (DELETE)
            Route::get('/profile/{applicantProfile}/download-cv', [ApplicantProfileController::class, 'downloadCV'])->name('profile.download-cv'); // URL: /backend/applicant/profile/{applicantProfile}/download-cv
            Route::post('/profile/{id}/restore', [ApplicantProfileController::class, 'restore'])->name('profile.restore'); // URL: /backend/applicant/profile/{id}/restore
            Route::patch('/profile/{applicantProfile}/basic-info', [ApplicantProfileController::class, 'updateBasicInfo'])->name('profile.update-basic-info'); // URL: /backend/applicant/profile/{applicantProfile}/basic-info
            Route::patch('/profile/{applicantProfile}/professional-info', [ApplicantProfileController::class, 'updateProfessionalInfo'])->name('profile.update-professional-info'); // URL: /backend/applicant/profile/{applicantProfile}/professional-info
            Route::put('/profile/{applicantProfile}/work-experiences', [ApplicantProfileController::class, 'updateWorkExperiences'])->name('profile.update-work-experiences'); // URL: /backend/applicant/profile/{applicantProfile}/work-experiences
            Route::put('/profile/{applicantProfile}/educations', [ApplicantProfileController::class, 'updateEducations'])->name('profile.update-educations'); // URL: /backend/applicant/profile/{applicantProfile}/educations
            Route::put('/profile/{applicantProfile}/achievements', [ApplicantProfileController::class, 'updateAchievements'])->name('profile.update-achievements'); // URL: /backend/applicant/profile/{applicantProfile}/achievements
            Route::post('/profile/change-password', [ApplicantProfileController::class, 'changePassword'])->name('profile.change-password'); // URL: /backend/applicant/profile/change-password
            Route::get('/profile/{applicantProfile}/data', [ApplicantProfileController::class, 'getProfileData'])->name('profile.get-data'); // URL: /backend/applicant/profile/{applicantProfile}/data
        });

        // Applicant Profile Management (Admin) - URL: /backend/applicant-profiles/*
        Route::prefix('applicant-profiles')->name('applicant-profile.')->group(function () {
            Route::get('/', [ApplicantProfileController::class, 'index'])->name('index');                       // URL: /backend/applicant-profiles
            Route::get('/{id}', [ApplicantProfileController::class, 'show'])->name('show');                     // URL: /backend/applicant-profiles/{id}
            Route::post('/bulk/delete', [ApplicantProfileController::class, 'bulkDelete'])->name('bulk-delete'); // URL: /backend/applicant-profiles/bulk/delete
            Route::post('/bulk/restore', [ApplicantProfileController::class, 'bulkRestore'])->name('bulk-restore'); // URL: /backend/applicant-profiles/bulk/restore
            Route::delete('/{id}', [ApplicantProfileController::class, 'destroy'])->name('destroy');            // URL: /backend/applicant-profiles/{id} (DELETE)
            Route::post('/{id}/restore', [ApplicantProfileController::class, 'restore'])->name('restore');      // URL: /backend/applicant-profiles/{id}/restore
            Route::delete('/{id}/force', [ApplicantProfileController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/applicant-profiles/{id}/force
            Route::post('/export', [ApplicantProfileController::class, 'export'])->name('export');              // URL: /backend/applicant-profiles/export
            Route::post('/cv/upload', [ApplicantProfileController::class, 'uploadCv'])->name('cv.upload');      // URL: /backend/applicant-profiles/cv/upload
            Route::delete('/cv/{cv}', [ApplicantProfileController::class, 'destroyCv'])->name('cv.destroy');    // URL: /backend/applicant-profiles/cv/{cv} (DELETE)
            Route::patch('/cv/{cv}/primary', [ApplicantProfileController::class, 'setPrimaryCv'])->name('cv.primary'); // URL: /backend/applicant-profiles/cv/{cv}/primary
        });

        // Employer Profile - URL: /backend/employer/*
        Route::prefix('employer')->name('employer.')->group(function () {
            Route::get('/profile/{id?}', [EmployerProfileController::class, 'show'])->whereNumber('id')->name('profile.show'); // URL: /backend/employer/profile/{id?}
            Route::get('/profile/edit', [EmployerProfileController::class, 'edit'])->name('profile.edit');       // URL: /backend/employer/profile/edit
            Route::patch('/profile', [EmployerProfileController::class, 'update'])->name('profile.update');      // URL: /backend/employer/profile (PATCH)
            Route::put('/profile/password', [EmployerProfileController::class, 'updatePassword'])->name('profile.password.update'); // URL: /backend/employer/profile/password (PUT)
        });

        // Applications Management - URL: /backend/applications/*
        Route::prefix('applications')->name('applications.')->group(function () {
            Route::get('/', [ApplicationsController::class, 'index'])->name('index');                         // URL: /backend/applications
            Route::get('/job/{jobId}', [ApplicationsController::class, 'jobApplications'])->name('job');      // URL: /backend/applications/job/{jobId}
            Route::get('/{id}', [ApplicationsController::class, 'show'])->name('show');                       // URL: /backend/applications/{id}
            Route::put('/{id}/status', [ApplicationsController::class, 'updateStatus'])->name('update-status'); // URL: /backend/applications/{id}/status (PUT)
            Route::post('/bulk-status', [ApplicationsController::class, 'bulkUpdateStatus'])->name('bulk-status'); // URL: /backend/applications/bulk-status
            Route::delete('/{id}', [ApplicationsController::class, 'destroy'])->name('destroy');              // URL: /backend/applications/{id} (DELETE)
            Route::post('/bulk-delete', [ApplicationsController::class, 'bulkDelete'])->name('bulk-delete');  // URL: /backend/applications/bulk-delete
            Route::get('/{id}/download', [ApplicationsController::class, 'downloadResume'])->name('download'); // URL: /backend/applications/{id}/download
            Route::post('/bulk-download', [ApplicationsController::class, 'bulkDownloadResumes'])->name('bulk-download'); // URL: /backend/applications/bulk-download
            Route::post('/{id}/send-email', [ApplicationsController::class, 'sendEmail'])->name('send-email'); // URL: /backend/applications/{id}/send-email
            Route::post('/bulk-send-email', [ApplicationsController::class, 'sendBulkEmail'])->name('bulk-send-email'); // URL: /backend/applications/bulk-send-email
            Route::post('/{id}/recalculate-ats', [ApplicationsController::class, 'recalculateAts'])->name('recalculate-ats'); // URL: /backend/applications/{id}/recalculate-ats
            Route::post('/export/{jobId}', [ApplicationsController::class, 'exportApplications'])->name('export'); // URL: /backend/applications/export/{jobId}
            Route::post('/export-single/{id}', [ApplicationsController::class, 'exportSingleApplication'])->name('export-single'); // URL: /backend/applications/export-single/{id}
        });

        // Users Management - URL: /backend/users/*
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [UserController::class, 'index'])->name('index');                                 // URL: /backend/users
            Route::post('/', [UserController::class, 'store'])->name('store');                                // URL: /backend/users (POST)
            Route::put('/{id}', [UserController::class, 'update'])->name('update');                           // URL: /backend/users/{id} (PUT)
            Route::delete('/{id}', [UserController::class, 'destroy'])->name('destroy');                      // URL: /backend/users/{id} (DELETE)
            Route::patch('/{id}/restore', [UserController::class, 'restore'])->name('restore');               // URL: /backend/users/{id}/restore
            Route::post('/{id}/verify', [UserController::class, 'verify'])->name('verify');                   // URL: /backend/users/{id}/verify
            Route::delete('/{id}/force-delete', [UserController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/users/{id}/force-delete
            Route::post('/bulk/delete', [UserController::class, 'bulkDelete'])->name('bulk-delete');          // URL: /backend/users/bulk/delete
            Route::post('/bulk/restore', [UserController::class, 'bulkRestore'])->name('bulk-restore');       // URL: /backend/users/bulk/restore
        });

        // Notifications Management - URL: /backend/notifications/*
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');                         // URL: /backend/notifications
            Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');     // URL: /backend/notifications/read-all
            Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->name('read');           // URL: /backend/notifications/{id}/read
        });

        // ============================================
        // BACKUP ROUTES - ADD THIS INSIDE THE BACKEND PREFIX GROUP
        // URL: /backend/backup/*
        // ============================================
        Route::prefix('backup')->name('backup.')->group(function () {
            Route::get('/', [BackupController::class, 'index'])->name('index');
            Route::post('/create-manual', [BackupController::class, 'createManual'])->name('create-manual');
            Route::post('/create-auto', [BackupController::class, 'createAuto'])->name('create-auto');
            Route::post('/restore', [BackupController::class, 'restore'])->name('restore');
            Route::delete('/delete', [BackupController::class, 'delete'])->name('delete');
            Route::get('/download', [BackupController::class, 'download'])->name('download');
            Route::get('/status', [BackupController::class, 'status'])->name('status');
        });
    });

    // ============================================
    // SUBSECTION 6.2: CMS ROUTES
    // URL: /backend/cms/*
    // ============================================
    Route::prefix('backend/cms')->name('backend.cms.')->group(function () {

        // Page Management - URL: /backend/cms/pages/*
        Route::prefix('pages')->name('pages.')->group(function () {
            Route::get('/', [CmsPageController::class, 'index'])->name('index');                                // URL: /backend/cms/pages
            Route::post('/store', [CmsPageController::class, 'store'])->name('store');                          // URL: /backend/cms/pages/store
            Route::put('/update/{id}', [CmsPageController::class, 'update'])->name('update');                  // URL: /backend/cms/pages/update/{id}
            Route::post('/toggle-status/{id}', [CmsPageController::class, 'toggleStatus'])->name('toggle-status'); // URL: /backend/cms/pages/toggle-status/{id}
            Route::delete('/destroy/{id}', [CmsPageController::class, 'destroy'])->name('destroy');            // URL: /backend/cms/pages/destroy/{id}
            Route::post('/restore/{id}', [CmsPageController::class, 'restore'])->name('restore');              // URL: /backend/cms/pages/restore/{id}
            Route::delete('/force-delete/{id}', [CmsPageController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/cms/pages/force-delete/{id}
        });

        // Section Management - URL: /backend/cms/sections/*
        Route::prefix('sections')->name('sections.')->group(function () {
            Route::get('/page/{pageId}', [CmsSectionController::class, 'index'])->name('page.sections');       // URL: /backend/cms/sections/page/{pageId}
            Route::get('/trashed/{pageId}', [CmsSectionController::class, 'trashed'])->name('trashed');        // URL: /backend/cms/sections/trashed/{pageId}
            Route::get('/trashed-count/{pageId}', [CmsSectionController::class, 'trashedCount'])->name('trashed-count'); // URL: /backend/cms/sections/trashed-count/{pageId}
            Route::post('/', [CmsSectionController::class, 'store'])->name('store');                           // URL: /backend/cms/sections (POST)
            Route::post('/{pageId}/update-order', [CmsSectionController::class, 'updateOrder'])->name('update-order'); // URL: /backend/cms/sections/{pageId}/update-order
            Route::put('/update/{section}', [CmsSectionController::class, 'update'])->name('update');          // URL: /backend/cms/sections/update/{section}
            Route::delete('/{section}', [CmsSectionController::class, 'destroy'])->name('destroy');            // URL: /backend/cms/sections/{section} (DELETE)
            Route::post('/{section}/restore', [CmsSectionController::class, 'restore'])->name('restore');      // URL: /backend/cms/sections/{section}/restore
            Route::delete('/{section}/force-delete', [CmsSectionController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/cms/sections/{section}/force-delete
            Route::get('/about-content-options', [CmsSectionController::class, 'getAboutContentOptions'])->name('about-content-options'); // URL: /backend/cms/sections/about-content-options
        });

        // Shared Data Management - URL: /backend/cms/shared/*
        Route::prefix('shared')->name('shared.')->group(function () {
            Route::get('/', [SharedDataController::class, 'index'])->name('index');                           // URL: /backend/cms/shared
            Route::put('/update/{id}', [SharedDataController::class, 'update'])->name('update');              // URL: /backend/cms/shared/update/{id}
        });

        // Blogs Management - URL: /backend/cms/blogs/*
        Route::prefix('blogs')->name('blogs.')->group(function () {
            Route::get('/', [CmsBlogController::class, 'index'])->name('index');                              // URL: /backend/cms/blogs
            Route::post('/store', [CmsBlogController::class, 'store'])->name('store');                        // URL: /backend/cms/blogs/store
            Route::put('/update/{id}', [CmsBlogController::class, 'update'])->name('update');                 // URL: /backend/cms/blogs/update/{id}
            Route::post('/toggle-status/{id}', [CmsBlogController::class, 'toggleStatus'])->name('toggle-status'); // URL: /backend/cms/blogs/toggle-status/{id}
            Route::post('/toggle-featured/{id}', [CmsBlogController::class, 'toggleFeatured'])->name('toggle-featured'); // URL: /backend/cms/blogs/toggle-featured/{id}
            Route::delete('/destroy/{id}', [CmsBlogController::class, 'destroy'])->name('destroy');           // URL: /backend/cms/blogs/destroy/{id}
            Route::post('/restore/{id}', [CmsBlogController::class, 'restore'])->name('restore');             // URL: /backend/cms/blogs/restore/{id}
            Route::delete('/force-delete/{id}', [CmsBlogController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/cms/blogs/force-delete/{id}
        });

        // Programs Management - URL: /backend/cms/programs/*
        Route::prefix('programs')->name('programs.')->group(function () {
            Route::get('/', [CmsProgramController::class, 'index'])->name('index');                           // URL: /backend/cms/programs
            Route::post('/store', [CmsProgramController::class, 'store'])->name('store');                     // URL: /backend/cms/programs/store
            Route::put('/update/{id}', [CmsProgramController::class, 'update'])->name('update');              // URL: /backend/cms/programs/update/{id}
            Route::post('/toggle-status/{id}', [CmsProgramController::class, 'toggleStatus'])->name('toggle-status'); // URL: /backend/cms/programs/toggle-status/{id}
            Route::post('/toggle-featured/{id}', [CmsProgramController::class, 'toggleFeatured'])->name('toggle-featured'); // URL: /backend/cms/programs/toggle-featured/{id}
            Route::post('/update-order', [CmsProgramController::class, 'updateOrder'])->name('update-order');  // URL: /backend/cms/programs/update-order
            Route::delete('/destroy/{id}', [CmsProgramController::class, 'destroy'])->name('destroy');        // URL: /backend/cms/programs/destroy/{id}
            Route::post('/restore/{id}', [CmsProgramController::class, 'restore'])->name('restore');          // URL: /backend/cms/programs/restore/{id}
            Route::delete('/force-delete/{id}', [CmsProgramController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/cms/programs/force-delete/{id}
        });

        // About Content Management - URL: /backend/cms/about/*
        Route::prefix('about')->name('about.')->group(function () {
            Route::get('/', [CmsAboutContentController::class, 'index'])->name('index');                     // URL: /backend/cms/about
            Route::post('/store', [CmsAboutContentController::class, 'store'])->name('store');               // URL: /backend/cms/about/store
            Route::put('/update/{id}', [CmsAboutContentController::class, 'update'])->name('update');        // URL: /backend/cms/about/update/{id}
            Route::post('/toggle-status/{id}', [CmsAboutContentController::class, 'toggleStatus'])->name('toggle-status'); // URL: /backend/cms/about/toggle-status/{id}
            Route::post('/toggle-featured/{id}', [CmsAboutContentController::class, 'toggleFeatured'])->name('toggle-featured'); // URL: /backend/cms/about/toggle-featured/{id}
            Route::post('/update-order', [CmsAboutContentController::class, 'updateOrder'])->name('update-order'); // URL: /backend/cms/about/update-order
            Route::delete('/destroy/{id}', [CmsAboutContentController::class, 'destroy'])->name('destroy');  // URL: /backend/cms/about/destroy/{id}
            Route::post('/restore/{id}', [CmsAboutContentController::class, 'restore'])->name('restore');    // URL: /backend/cms/about/restore/{id}
            Route::delete('/force-delete/{id}', [CmsAboutContentController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/cms/about/force-delete/{id}
        });

        // Publications Management - URL: /backend/cms/publications/*
        Route::prefix('publications')->name('publications.')->group(function () {
            Route::get('/', [CmsPublicationController::class, 'index'])->name('index');                     // URL: /backend/cms/publications
            Route::post('/store', [CmsPublicationController::class, 'store'])->name('store');               // URL: /backend/cms/publications/store
            Route::put('/update/{id}', [CmsPublicationController::class, 'update'])->name('update');        // URL: /backend/cms/publications/update/{id}
            Route::post('/toggle-status/{id}', [CmsPublicationController::class, 'toggleStatus'])->name('toggle-status'); // URL: /backend/cms/publications/toggle-status/{id}
            Route::post('/toggle-featured/{id}', [CmsPublicationController::class, 'toggleFeatured'])->name('toggle-featured'); // URL: /backend/cms/publications/toggle-featured/{id}
            Route::delete('/destroy/{id}', [CmsPublicationController::class, 'destroy'])->name('destroy');  // URL: /backend/cms/publications/destroy/{id}
            Route::post('/restore/{id}', [CmsPublicationController::class, 'restore'])->name('restore');    // URL: /backend/cms/publications/restore/{id}
            Route::delete('/force-delete/{id}', [CmsPublicationController::class, 'forceDelete'])->name('force-delete'); // URL: /backend/cms/publications/force-delete/{id}
        });
    });

    // ============================================
    // SUBSECTION 6.3: ADMIN PROFILE ROUTES
    // URL: /backend/admin-profile/*
    // ============================================
    Route::prefix('admin-profile')->name('admin-profile.')->group(function () {
        Route::get('/edit', [AdminProfileController::class, 'edit'])->name('edit');                           // URL: /backend/admin-profile/edit
        Route::patch('/', [AdminProfileController::class, 'update'])->name('update');                         // URL: /backend/admin-profile (PATCH)
        Route::put('/password', [AdminProfileController::class, 'updatePassword'])->name('password.update'); // URL: /backend/admin-profile/password (PUT)

        // Icon management routes - ADD THESE
        Route::post('/icon/update', [AdminProfileController::class, 'updateIcon'])->name('icon.update');     // URL: /backend/admin-profile/icon/update
        Route::delete('/icon/reset', [AdminProfileController::class, 'resetIcon'])->name('icon.reset');      // URL: /backend/admin-profile/icon/reset
    });
});

// ============================================
// SECTION 7: EDITOR & CACHE ROUTES
// URL: /admin/*, /backend/icon/*
// ============================================

// Editor image upload
Route::post('/admin/upload-editor-image', [EditorImageUploadController::class, 'upload'])->name('admin.upload-editor-image'); // URL: /admin/upload-editor-image
Route::delete('/admin/editor-image', [EditorImageUploadController::class, 'deleteImages'])->name('admin.editor-image.delete'); // URL: /admin/editor-image (DELETE)

// Cache management (Admin only)
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::post('/cache/clear', [CacheController::class, 'clearAll'])->name('admin.cache.clear');           // URL: /admin/cache/clear
    Route::post('/cache/clear/{pageSlug}', [CacheController::class, 'clearPage'])->name('admin.cache.clear-page'); // URL: /admin/cache/clear/{pageSlug}
    Route::get('/cache/status', [CacheController::class, 'status'])->name('admin.cache.status');            // URL: /admin/cache/status
});

// ============================================
// SECTION 8: FALLBACK ROUTE
// URL: /* (catch-all for any unmatched routes)
// ============================================


// Fallback route for unmatched URLs - MUST BE AT THE VERY END
Route::fallback(function () {
    // Get shared data using the trait
    $sharedData = (new class {
        use SharedDataTrait;
        public function getData()
        {
            return $this->getSharedData();
        }
    })->getData();

    return Inertia::render('Frontend/NotFound', array_merge($sharedData, [
        'storageUrl' => config('app.storage_url', ''),
        'pageTitle' => 'Page Not Found | DUS',
        'notFound' => true,
    ]))->toResponse(request())->setStatusCode(200);
});
