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
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// Controllers - Frontend
use App\Http\Controllers\Frontend\FrontendController;
use App\Http\Controllers\Frontend\PageController;

// Controllers - Admin
use App\Http\Controllers\Admin\CacheController;

// Controllers - API
use App\Http\Controllers\Api\ContentApiController;
use App\Http\Controllers\Api\JobListingApiController;

// Controllers - Job Listings
use App\Http\Controllers\JobListing\JobListingController;

// Controllers - Profile
use App\Http\Controllers\Profile\ApplicantProfileController;
use App\Http\Controllers\Profile\EmployerProfileController;
use App\Http\Controllers\Auth\JobSeeker\ProfileCompletionController;

// Controllers - Backend
use App\Http\Controllers\Backend\LocationController;
use App\Http\Controllers\Backend\ApplyController;
use App\Http\Controllers\Backend\JobCategoryController;
use App\Http\Controllers\Backend\ApplicationsController;
use App\Http\Controllers\Backend\NotificationController;
use App\Http\Controllers\Backend\RoleController;
use App\Http\Controllers\Backend\UserController;

// Controllers - Profile (Admin/Employer)
use App\Http\Controllers\Profile\AdminProfileController;

// Controllers - Settings
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;

// Controllers - Auth
use App\Http\Controllers\Auth\AdminStaff\AdminLoginController;
use App\Http\Controllers\Auth\JobSeeker\JobSeekerLoginController;
use App\Http\Controllers\Auth\JobSeeker\JobSeekerRegisterController;
use App\Http\Controllers\Auth\Shared\AuthenticatedSessionController;
use App\Http\Controllers\Auth\Shared\ConfirmablePasswordController;
use App\Http\Controllers\Auth\Shared\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\Shared\EmailVerificationPromptController;
use App\Http\Controllers\Auth\Shared\EmailVerifiedController;
use App\Http\Controllers\Auth\Shared\GoogleAuthController;
use App\Http\Controllers\Auth\Shared\NewPasswordController;
use App\Http\Controllers\Auth\Shared\PasswordResetLinkController;
use App\Http\Controllers\Auth\Shared\VerifyEmailController;

// Controllers - CMS
use App\Http\Controllers\Cms\SharedDataController;
use App\Http\Controllers\Cms\PageController as CmsPageController;
use App\Http\Controllers\Cms\BlogController as CmsBlogController;
use App\Http\Controllers\Cms\ProgramController as CmsProgramController;
use App\Http\Controllers\Cms\SectionController as CmsSectionController;
use App\Http\Controllers\Cms\AboutContentController as CmsAboutContentController;
use App\Http\Controllers\Cms\PublicationController as CmsPublicationController;
use App\Http\Controllers\Cms\EditorImageUploadController;

// Models
use App\Models\pages\Page;
use App\Models\pages\Program;
use Illuminate\Support\Facades\Log;

// ============================================
// API ROUTES (Data endpoints for the frontend)
// ============================================
// These routes provide JSON data for frontend consumption.
// Used by the Inertia.js frontend to fetch dynamic data.
// ============================================

Route::prefix('data')->group(function () {
    Route::get('pages.json', [ContentApiController::class, 'pages']);
    Route::get('section_configs.json', [ContentApiController::class, 'sectionConfigs']);
    Route::get('shared_data.json', [ContentApiController::class, 'sharedData']);
    Route::get('custom_section_data.json', [ContentApiController::class, 'customSectionData']);
    Route::get('programs.json', [ContentApiController::class, 'programs']);
    Route::get('blogs.json', [ContentApiController::class, 'blogs']);
    Route::get('about_content.json', [ContentApiController::class, 'aboutContent']);
    Route::get('jobs.json', [ContentApiController::class, 'jobs']);
});

// Combined navigation endpoint
Route::get('/data/navigation.json', function (Request $request) {
    // Fetch all active pages (excluding detail pages)
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

    // Fetch all active programs
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

    // Combine and sort alphabetically
    $items = $pages->concat($programs)->sortBy('name')->values();

    return response()->json([
        'success' => true,
        'items' => $items,
        'pages' => $pages,
        'programs' => $programs
    ]);
})->name('data.navigation');

// Individual endpoints for backward compatibility
Route::get('/api/pages', function (Request $request) {
    $pages = Page::where('is_active', true)
        ->where('slug', 'not like', '%-details')
        ->select('id', 'slug', 'name')
        ->orderBy('name')
        ->get();

    return response()->json([
        'success' => true,
        'pages' => $pages
    ]);
})->name('api.pages');

Route::get('/api/programs', function (Request $request) {
    $programs = Program::where('is_active', true)
        ->select('id', 'slug', 'title as name')
        ->orderBy('display_order')
        ->get();

    return response()->json([
        'success' => true,
        'programs' => $programs
    ]);
})->name('api.programs');

// ============================================
// JOB LISTING API ROUTES (Public endpoints)
// ============================================
// These routes provide job listing data for the frontend.
// ============================================

Route::prefix('api/jobs')->group(function () {
    Route::get('/', [JobListingApiController::class, 'index']);
    Route::get('/{identifier}', [JobListingApiController::class, 'show']);
    Route::get('/{slug}/related', [JobListingApiController::class, 'related']);
    Route::get('/popular', [JobListingController::class, 'popular'])->name('api.jobs.popular');
    Route::get('/trending', [JobListingController::class, 'trending'])->name('api.jobs.trending');
});

// ============================================
// JOB LISTINGS ROUTES (Public)
// ============================================
// Routes for job seekers to view job listings.
// ============================================

Route::middleware('auth')->prefix('seeker')->name('public.jobs.')->group(function () {
    Route::get('/jobs', [JobListingController::class, 'index'])->name('index');
    Route::get('/jobs/{slug}', [JobListingController::class, 'show'])->name('show');
});

// ============================================
// FRONTEND PUBLIC ROUTES
// ============================================
// These routes handle public page serving, asset serving,
// and dynamic page rendering via Inertia.js.
// ============================================

// Storage route for serving files (secure)
Route::get('/storage/{path}', function ($path) {
    if (str_contains($path, '..')) abort(404);
    $disk = Storage::disk('public');
    if (!$disk->exists($path)) abort(404);
    return response()->file($disk->path($path));
})->where('path', '.*')->name('storage.file');

// Asset route for serving assets (with caching)
Route::get('/asset/{path}', [FrontendController::class, 'asset'])->where('path', '.*')->name('asset');

// Unauthorized access page
Route::get('/unauthorized', function () {
    return Inertia::render('UnauthorizedAccess', [
        'status' => 403,
        'message' => session('error', 'You do not have permission to access this page.')
    ]);
})->name('unauthorized.access');

// ============================================
// DYNAMIC PAGE ROUTES (Cached)
// ============================================
// These routes handle all public pages dynamically.
// Pages are cached to improve performance.
// ============================================

// Home page
Route::get('/', [PageController::class, 'show'])->name('home');

// ============================================
// STARTUP CACHE WARMUP
// ============================================
// On application startup, we warm up the cache
// by visiting key pages. This ensures the cache
// is populated and ready for visitors.
// ============================================

Route::get('/_warmup', function () {
    try {
        $startTime = microtime(true);
        $results = [];

        // List of key pages to warm up
        $pages = [
            '/',
            '/about',
            '/blogs',
            '/projects-programs',
            '/publications',
            '/jobs',
            '/contact',
        ];

        foreach ($pages as $page) {
            try {
                // Make a request to the page to trigger cache
                $response = file_get_contents(url($page));
                $results[$page] = [
                    'status' => 'success',
                    'size' => strlen($response) . ' bytes'
                ];
            } catch (\Exception $e) {
                $results[$page] = [
                    'status' => 'failed',
                    'error' => $e->getMessage()
                ];
            }
        }

        $executionTime = round(microtime(true) - $startTime, 2);

        Log::info('Cache warmup completed', [
            'pages' => count($pages),
            'execution_time' => $executionTime . 's',
            'results' => $results
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cache warmup completed',
            'execution_time' => $executionTime . ' seconds',
            'pages_warmed' => count($pages),
            'results' => $results,
            'timestamp' => now()->toDateTimeString()
        ]);
    } catch (\Exception $e) {
        Log::error('Cache warmup failed', [
            'error' => $e->getMessage()
        ]);

        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
})->name('cache.warmup');

// Playground (development/testing)
Route::get('/Playground', function () {
    return Inertia::render('Playground');
})->name('playground');

// Dynamic detail pages (more specific pattern)
Route::get('/{pageSlug}/{detailSlug}', [PageController::class, 'show'])
    ->where('pageSlug', '^(?!admin|backend|login|register|dashboard|api|storage|Playground|Playground|_warmup).*$')
    ->where('detailSlug', '.*');

// Dynamic listing pages (less specific pattern)
Route::get('/{pageSlug}', [PageController::class, 'show'])
    ->where('pageSlug', '^(?!admin|backend|login|register|dashboard|api|storage|Playground|Playground|_warmup).*$');

// ============================================
// AUTHENTICATION ROUTES
// ============================================
// These routes handle all authentication flows
// including login, registration, password reset,
// and email verification.
// ============================================

Route::middleware('guest')->group(function () {
    // ============================================
    // ADMIN / STAFF LOGIN
    // ============================================
    Route::get('/login/admin', [AdminLoginController::class, 'create'])->name('admin.login');
    Route::post('/login/admin', [AdminLoginController::class, 'store']);

    // ============================================
    // JOB SEEKER LOGIN
    // ============================================
    Route::get('/login/job-seeker', [JobSeekerLoginController::class, 'create'])->name('job-seeker.login');
    Route::post('/login/job-seeker', [JobSeekerLoginController::class, 'store']);

    // ============================================
    // DEFAULT LOGIN (Redirects to Job Seeker Login)
    // ============================================
    Route::get('/login', function () {
        return redirect()->route('job-seeker.login');
    })->name('login');

    // ============================================
    // JOB SEEKER REGISTRATION
    // ============================================
    Route::get('/register', [JobSeekerRegisterController::class, 'create'])->name('register');
    Route::post('/register', [JobSeekerRegisterController::class, 'store']);

    // ============================================
    // GOOGLE AUTH (Job Seekers only)
    // ============================================
    Route::get('auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

    // ============================================
    // PASSWORD RESET
    // ============================================
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('password.store');
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================
// Routes that require the user to be logged in.
// ============================================

Route::middleware('auth')->group(function () {
    // ============================================
    // EMAIL VERIFICATION (Job Seekers only)
    // ============================================
    Route::get('verify-email', EmailVerificationPromptController::class)->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
    Route::get('email/verified', [EmailVerifiedController::class, 'index'])->name('verification.verified');

    // ============================================
    // CONFIRM PASSWORD
    // ============================================
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('password.confirm');
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    // ============================================
    // LOGOUT
    // ============================================
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

// ============================================
// PROFILE COMPLETION ROUTES (Job Seekers only)
// ============================================
// Routes for job seekers to complete their profiles.
// ============================================

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


// ============================================
// AUTHENTICATED + VERIFIED ROUTES (MAIN APP AREA)
// ============================================
// Routes that require authentication, email verification,
// and completed profile.
// ============================================

Route::middleware(['auth', 'verified', 'profile.complete'])->group(function () {
    // ============================================
    // DASHBOARD (Default Landing Page)
    // ============================================
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('backend.dashboard');

    // ============================================
    // BACKEND (Admin/Employer Panel)
    // ============================================
    Route::prefix('backend')->name('backend.')->group(function () {
        // ============================================
        // ROLES MANAGEMENT
        // ============================================
        Route::prefix('roles')->name('roles.')->group(function () {
            Route::get('/', [RoleController::class, 'index'])->name('index');
            Route::get('/create', [RoleController::class, 'create'])->name('create');
            Route::post('/', [RoleController::class, 'store'])->name('store');
            Route::get('/trashed', [RoleController::class, 'trashed'])->name('trashed');
            Route::get('/export', [RoleController::class, 'export'])->name('export');
            Route::get('/{id}', [RoleController::class, 'show'])->name('show')->whereNumber('id');
            Route::get('/{id}/edit', [RoleController::class, 'edit'])->name('edit')->whereNumber('id');
            Route::put('/{id}', [RoleController::class, 'update'])->name('update')->whereNumber('id');
            Route::delete('/{id}', [RoleController::class, 'destroy'])->name('destroy')->whereNumber('id');
            Route::post('/{id}/restore', [RoleController::class, 'restore'])->name('restore')->whereNumber('id');
            Route::delete('/{id}/force', [RoleController::class, 'forceDelete'])->name('force-delete')->whereNumber('id');
            Route::post('/bulk/delete', [RoleController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [RoleController::class, 'bulkRestore'])->name('bulk-restore');
            Route::post('/{id}/toggle-status', [RoleController::class, 'toggleStatus'])->name('toggle-status')->whereNumber('id');
            Route::post('/{id}/clone', [RoleController::class, 'clone'])->name('clone')->whereNumber('id');
        });

        // ============================================
        // LOCATIONS MANAGEMENT
        // ============================================
        Route::prefix('locations')->name('locations.')->group(function () {
            Route::get('/', [LocationController::class, 'index'])->name('index');
            Route::post('/', [LocationController::class, 'store'])->name('store');
            Route::put('/{location}', [LocationController::class, 'update'])->name('update');
            Route::delete('/{location}', [LocationController::class, 'destroy'])->name('destroy');
            Route::patch('/{location}/toggle', [LocationController::class, 'toggleActive'])->name('toggle');
            Route::patch('/{id}/restore', [LocationController::class, 'restore'])->name('restore');
            Route::delete('/{id}/force-delete', [LocationController::class, 'forceDelete'])->name('force-delete');
            Route::post('/bulk/activate', [LocationController::class, 'bulkActivate'])->name('bulk-activate');
            Route::post('/bulk/deactivate', [LocationController::class, 'bulkDeactivate'])->name('bulk-deactivate');
            Route::post('/bulk/delete', [LocationController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [LocationController::class, 'bulkRestore'])->name('bulk-restore');
            Route::get('/active', [LocationController::class, 'getActiveLocations'])->name('active');
        });

        // ============================================
        // JOB CATEGORIES MANAGEMENT
        // ============================================
        Route::prefix('categories')->name('categories.')->group(function () {
            Route::patch('{category}/toggle', [JobCategoryController::class, 'toggleActive'])->name('toggle');
            Route::patch('{category}/restore', [JobCategoryController::class, 'restore'])->name('restore');
            Route::delete('{category}/force-delete', [JobCategoryController::class, 'forceDelete'])->name('force-delete');
            Route::get('active', [JobCategoryController::class, 'getActiveCategories'])->name('active');
            Route::post('bulk/activate', [JobCategoryController::class, 'bulkActivate'])->name('bulk-activate');
            Route::post('bulk/deactivate', [JobCategoryController::class, 'bulkDeactivate'])->name('bulk-deactivate');
            Route::post('bulk/delete', [JobCategoryController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('bulk/restore', [JobCategoryController::class, 'bulkRestore'])->name('bulk-restore');
            Route::post('bulk/force-delete', [JobCategoryController::class, 'bulkForceDelete'])->name('bulk-force-delete');
            Route::get('/', [JobCategoryController::class, 'index'])->name('index');
            Route::post('/', [JobCategoryController::class, 'store'])->name('store');
            Route::put('{category}', [JobCategoryController::class, 'update'])->name('update');
            Route::delete('{category}', [JobCategoryController::class, 'destroy'])->name('destroy');
        });

        // ============================================
        // JOB LISTINGS MANAGEMENT
        // ============================================
        Route::prefix('listing')->name('listing.')->group(function () {
            Route::get('/', [JobListingController::class, 'adminIndex'])->name('index');
            Route::get('/create', [JobListingController::class, 'adminCreate'])->name('create');
            Route::post('/', [JobListingController::class, 'adminStore'])->name('store');
            Route::get('{jobListing}', [JobListingController::class, 'adminShow'])->name('show');
            Route::get('{jobListing}/edit', [JobListingController::class, 'adminEdit'])->name('edit');
            Route::put('{jobListing}', [JobListingController::class, 'adminUpdate'])->name('update');
            Route::delete('{jobListing}', [JobListingController::class, 'adminDestroy'])->name('destroy');
            Route::patch('{jobListing}/toggle-active', [JobListingController::class, 'toggleActive'])->name('toggle-active');
            Route::patch('{jobListing}/restore', [JobListingController::class, 'restore'])->name('restore');
            Route::delete('{jobListing}/force-delete', [JobListingController::class, 'forceDelete'])->name('force-delete');
            Route::get('{jobListing}/applications', [JobListingController::class, 'applications'])->name('applications');
            Route::post('/bulk-activate', [JobListingController::class, 'bulkActivate'])->name('bulk-activate');
            Route::post('/bulk-deactivate', [JobListingController::class, 'bulkDeactivate'])->name('bulk-deactivate');
            Route::delete('/bulk-delete', [JobListingController::class, 'bulkDelete'])->name('bulk-delete');
        });

        // ============================================
        // STATISTICS
        // ============================================
        Route::prefix('statistics')->name('statistics.')->group(function () {
            Route::get('/', [JobListingController::class, 'statistics'])->name('index');
        });

        // ============================================
        // APPLY TO JOB
        // ============================================
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

        // ============================================
        // APPLICANT PROFILE (User Own)
        // ============================================
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

        // ============================================
        // APPLICANT PROFILE MANAGEMENT (Admin)
        // ============================================
        Route::prefix('applicant-profiles')->name('applicant-profile.')->group(function () {
            Route::get('/', [ApplicantProfileController::class, 'index'])->name('index');
            Route::get('/{id}', [ApplicantProfileController::class, 'show'])->name('show');
            Route::post('/bulk/delete', [ApplicantProfileController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [ApplicantProfileController::class, 'bulkRestore'])->name('bulk-restore');
            Route::delete('/{id}', [ApplicantProfileController::class, 'destroy'])->name('destroy');
            Route::post('/{id}/restore', [ApplicantProfileController::class, 'restore'])->name('restore');
            Route::delete('/{id}/force', [ApplicantProfileController::class, 'forceDelete'])->name('force-delete');
            Route::post('/export', [ApplicantProfileController::class, 'export'])->name('export');
            Route::post('/cv/upload', [ApplicantProfileController::class, 'uploadCv'])->name('cv.upload');
            Route::delete('/cv/{cv}', [ApplicantProfileController::class, 'destroyCv'])->name('cv.destroy');
            Route::patch('/cv/{cv}/primary', [ApplicantProfileController::class, 'setPrimaryCv'])->name('cv.primary');
        });

        // ============================================
        // EMPLOYER PROFILE
        // ============================================
        Route::prefix('employer')->name('employer.')->group(function () {
            Route::get('/profile/{id?}', [EmployerProfileController::class, 'show'])->whereNumber('id')->name('profile.show');
            Route::get('/profile/edit', [EmployerProfileController::class, 'edit'])->name('profile.edit');
            Route::patch('/profile', [EmployerProfileController::class, 'update'])->name('profile.update');
            Route::put('/profile/password', [EmployerProfileController::class, 'updatePassword'])->name('profile.password.update');
        });

        // ============================================
        // ADMIN PROFILE
        // ============================================
        Route::prefix('admin-profile')->name('admin-profile.')->group(function () {
            Route::get('/edit', [AdminProfileController::class, 'edit'])->name('edit');
            Route::patch('/', [AdminProfileController::class, 'update'])->name('update');
            Route::put('/password', [AdminProfileController::class, 'updatePassword'])->name('password.update');
        });

        // ============================================
        // APPLICATIONS MANAGEMENT
        // ============================================
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

        // ============================================
        // USERS MANAGEMENT
        // ============================================
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('/', [UserController::class, 'index'])->name('index');
            Route::post('/', [UserController::class, 'store'])->name('store');
            Route::put('/{id}', [UserController::class, 'update'])->name('update');
            Route::delete('/{id}', [UserController::class, 'destroy'])->name('destroy');
            Route::patch('/{id}/restore', [UserController::class, 'restore'])->name('restore');
            Route::post('/{id}/verify', [UserController::class, 'verify'])->name('verify');
            Route::delete('/{id}/force-delete', [UserController::class, 'forceDelete'])->name('force-delete');
            Route::post('/bulk/delete', [UserController::class, 'bulkDelete'])->name('bulk-delete');
            Route::post('/bulk/restore', [UserController::class, 'bulkRestore'])->name('bulk-restore');
        });

        // ============================================
        // NOTIFICATIONS MANAGEMENT
        // ============================================
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
            Route::post('/{id}/read', [NotificationController::class, 'markAsRead'])->name('read');
        });

        // ============================================
        // CMS MANAGEMENT (Inertia.js Admin Interface)
        // ============================================
        Route::prefix('cms')->name('cms.')->group(function () {
            // Page Management
            Route::prefix('pages')->name('pages.')->group(function () {
                Route::get('/', [CmsPageController::class, 'index'])->name('index');
                Route::post('/store', [CmsPageController::class, 'store'])->name('store');
                Route::put('/update/{id}', [CmsPageController::class, 'update'])->name('update');
                Route::post('/toggle-status/{id}', [CmsPageController::class, 'toggleStatus'])->name('toggle-status');
                Route::delete('/destroy/{id}', [CmsPageController::class, 'destroy'])->name('destroy');
                Route::post('/restore/{id}', [CmsPageController::class, 'restore'])->name('restore');
                Route::delete('/force-delete/{id}', [CmsPageController::class, 'forceDelete'])->name('force-delete');
            });

            // Section Management
            Route::prefix('sections')->name('sections.')->group(function () {
                Route::get('/page/{pageId}', [CmsSectionController::class, 'index'])->name('page.sections');
                Route::get('/trashed/{pageId}', [CmsSectionController::class, 'trashed'])->name('trashed');
                Route::get('/trashed-count/{pageId}', [CmsSectionController::class, 'trashedCount'])->name('trashed-count');
                Route::post('/', [CmsSectionController::class, 'store'])->name('store');
                Route::post('/{pageId}/update-order', [CmsSectionController::class, 'updateOrder'])->name('update-order');
                Route::put('/update/{section}', [CmsSectionController::class, 'update'])->name('update');
                Route::delete('/{section}', [CmsSectionController::class, 'destroy'])->name('destroy');
                Route::post('/{section}/restore', [CmsSectionController::class, 'restore'])->name('restore');
                Route::delete('/{section}/force-delete', [CmsSectionController::class, 'forceDelete'])->name('force-delete');
                Route::get('/about-content-options', [CmsSectionController::class, 'getAboutContentOptions'])->name('about-content-options');
            });

            // Shared Data Management (Edit only)
            Route::prefix('shared')->name('shared.')->group(function () {
                Route::get('/', [SharedDataController::class, 'index'])->name('index');
                Route::put('/update/{id}', [SharedDataController::class, 'update'])->name('update');
            });

            // Blogs
            Route::prefix('blogs')->name('blogs.')->group(function () {
                Route::get('/', [CmsBlogController::class, 'index'])->name('index');
                Route::post('/store', [CmsBlogController::class, 'store'])->name('store');
                Route::put('/update/{id}', [CmsBlogController::class, 'update'])->name('update');
                Route::post('/toggle-status/{id}', [CmsBlogController::class, 'toggleStatus'])->name('toggle-status');
                Route::post('/toggle-featured/{id}', [CmsBlogController::class, 'toggleFeatured'])->name('toggle-featured');
                Route::delete('/destroy/{id}', [CmsBlogController::class, 'destroy'])->name('destroy');
                Route::post('/restore/{id}', [CmsBlogController::class, 'restore'])->name('restore');
                Route::delete('/force-delete/{id}', [CmsBlogController::class, 'forceDelete'])->name('force-delete');
            });

            // Programs
            Route::prefix('programs')->name('programs.')->group(function () {
                Route::get('/', [CmsProgramController::class, 'index'])->name('index');
                Route::post('/store', [CmsProgramController::class, 'store'])->name('store');
                Route::put('/update/{id}', [CmsProgramController::class, 'update'])->name('update');
                Route::post('/toggle-status/{id}', [CmsProgramController::class, 'toggleStatus'])->name('toggle-status');
                Route::post('/toggle-featured/{id}', [CmsProgramController::class, 'toggleFeatured'])->name('toggle-featured');
                Route::post('/update-order', [CmsProgramController::class, 'updateOrder'])->name('update-order');
                Route::delete('/destroy/{id}', [CmsProgramController::class, 'destroy'])->name('destroy');
                Route::post('/restore/{id}', [CmsProgramController::class, 'restore'])->name('restore');
                Route::delete('/force-delete/{id}', [CmsProgramController::class, 'forceDelete'])->name('force-delete');
            });

            // About Content
            Route::prefix('about')->name('about.')->group(function () {
                Route::get('/', [CmsAboutContentController::class, 'index'])->name('index');
                Route::post('/store', [CmsAboutContentController::class, 'store'])->name('store');
                Route::put('/update/{id}', [CmsAboutContentController::class, 'update'])->name('update');
                Route::post('/toggle-status/{id}', [CmsAboutContentController::class, 'toggleStatus'])->name('toggle-status');
                Route::post('/toggle-featured/{id}', [CmsAboutContentController::class, 'toggleFeatured'])->name('toggle-featured');
                Route::post('/update-order', [CmsAboutContentController::class, 'updateOrder'])->name('update-order');
                Route::delete('/destroy/{id}', [CmsAboutContentController::class, 'destroy'])->name('destroy');
                Route::post('/restore/{id}', [CmsAboutContentController::class, 'restore'])->name('restore');
                Route::delete('/force-delete/{id}', [CmsAboutContentController::class, 'forceDelete'])->name('force-delete');
            });

            // Publications
            Route::prefix('publications')->name('publications.')->group(function () {
                Route::get('/', [CmsPublicationController::class, 'index'])->name('index');
                Route::post('/store', [CmsPublicationController::class, 'store'])->name('store');
                Route::put('/update/{id}', [CmsPublicationController::class, 'update'])->name('update');
                Route::post('/toggle-status/{id}', [CmsPublicationController::class, 'toggleStatus'])->name('toggle-status');
                Route::post('/toggle-featured/{id}', [CmsPublicationController::class, 'toggleFeatured'])->name('toggle-featured');
                Route::delete('/destroy/{id}', [CmsPublicationController::class, 'destroy'])->name('destroy');
                Route::post('/restore/{id}', [CmsPublicationController::class, 'restore'])->name('restore');
                Route::delete('/force-delete/{id}', [CmsPublicationController::class, 'forceDelete'])->name('force-delete');
            });
        });
    });

    // ============================================
    // SETTINGS ROUTES
    // ============================================
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile');
        Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
        Route::get('/password', [PasswordController::class, 'edit'])->name('password');
        Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
    });
});

// ============================================
// EDITOR IMAGE UPLOAD
// ============================================
// Routes for handling editor image uploads (CKEditor/TinyMCE).
// ============================================

Route::post('/admin/upload-editor-image', [EditorImageUploadController::class, 'upload'])->name('admin.upload-editor-image');
Route::delete('/admin/editor-image', [EditorImageUploadController::class, 'deleteImages'])->name('admin.editor-image.delete');

// ============================================
// CACHE MANAGEMENT ROUTES (Admin only)
// ============================================
// Routes for managing the frontend cache.
// These should only be accessible to administrators.
// ============================================

Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::post('/cache/clear', [CacheController::class, 'clearAll'])->name('admin.cache.clear');
    Route::post('/cache/clear/{pageSlug}', [CacheController::class, 'clearPage'])->name('admin.cache.clear-page');
    Route::get('/cache/status', [CacheController::class, 'status'])->name('admin.cache.status');
});
