<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobListing;
use App\Models\JobView;
use App\Models\Location;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\ApplicantProfile;

class DashboardController extends Controller
{
  /**
   * Cache duration in seconds (5 minutes).
   */
  protected int $cacheDuration = 120;

  /**
   * Display the dashboard based on user role.
   */
  public function index(): Response
  {
    $user = $this->getAuthUser();

    // Log dashboard access
    SimpleLogger::system(
      "📊 Dashboard accessed by: " . $user->email,
      [
        'user_id' => $user->id,
        'user_email' => $user->email,
        'ip' => request()->ip(),
      ]
    );

    // Cache dashboard data per user (5 minutes)
    $cacheKey = 'dashboard_data_' . $user->id;

    $dashboardData = Cache::remember($cacheKey, $this->cacheDuration, function () use ($user) {
      return $this->buildDashboardData($user);
    });

    Log::info('Dashboard Data:', [
      'role' => $dashboardData['role'],
      'has_job_seeker' => $dashboardData['job_seeker'] !== null,
      'has_admin_staff' => $dashboardData['admin_staff'] !== null,
    ]);

    return Inertia::render('dashboard', [
      'dashboardData' => $dashboardData,
    ]);
  }

  /**
   * Clear dashboard cache (useful after profile updates, job applications, etc.).
   */
  public function clearCache(?int $userId = null): void
  {
    if ($userId) {
      Cache::forget('dashboard_data_' . $userId);
    } elseif ($user = $this->getAuthUser()) {
      Cache::forget('dashboard_data_' . $user->id);
    }
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

  /**
   * Get the authenticated user.
   */
  private function getAuthUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

  /**
   * Build dashboard data for the current user.
   */
  private function buildDashboardData(User $user): array
  {
    $roles = $user->roles?->pluck('slug')->all() ?? [];
    $permissions = $user->permissions_list ?? [];

    $role = $this->detectRole($roles, $permissions);

    $jobSeekerDashboard = $this->buildJobSeekerData($user, $roles, $permissions);
    $adminDashboard = $this->buildAdminData($user, $roles, $permissions);

    return [
      'role' => $role,
      'job_seeker' => $jobSeekerDashboard,
      'admin_staff' => $adminDashboard,
    ];
  }

  /**
   * Detect the user's primary role.
   */
  private function detectRole(array $roles, array $permissions): string
  {
    $hasAnyRole = fn(array $needles) => count(array_intersect($roles, $needles)) > 0;
    $hasPermission = fn(string $permission) => in_array($permission, $permissions, true);

    $isAdmin = $hasAnyRole(['super-admin', 'admin']) || $hasPermission('dashboard.admin');
    $isEmployer = $hasAnyRole(['employer-admin', 'hr-manager', 'recruiter']) || $hasPermission('dashboard.employer');
    $isJobSeeker = in_array('job-seeker', $roles, true) || $hasPermission('dashboard.job_seeker');

    if ($isAdmin) {
      return 'admin';
    }
    if ($isEmployer) {
      return 'staff';
    }
    if ($isJobSeeker) {
      return 'job_seeker';
    }
    return 'guest';
  }

  /**
   * Build job seeker dashboard data.
   */
  private function buildJobSeekerData(User $user, array $roles, array $permissions): ?array
  {
    $isJobSeeker = in_array('job-seeker', $roles, true)
      || in_array('dashboard.job_seeker', $permissions, true);

    if (!$isJobSeeker) {
      return null;
    }

    $profile = $user->applicantProfile()->with([
      'cvs' => fn($q) => $q->where('status', 'active')->orderBy('order_position'),
      'primaryCv',
      'jobHistories',
      'educationHistories',
      'achievements',
    ])->first();

    if (!$profile) {
      return null;
    }

    return [
      'role' => 'job_seeker',
      'summary' => [
        'profile_completion' => $profile->completionPercentage(),
        'active_cvs' => $profile->cvs->count(),
        'primary_cv_set' => (bool) $profile->primaryCv,
        'total_applications' => $profile->applications()->count(),
        'pending_applications' => $profile->applications()->where('status', Application::STATUS_PENDING)->count(),
        'shortlisted_applications' => $profile->applications()->where('status', Application::STATUS_SHORTLISTED)->count(),
        'rejected_applications' => $profile->applications()->where('status', Application::STATUS_REJECTED)->count(),
        'hired_applications' => $profile->applications()->where('status', Application::STATUS_HIRED)->count(),
        'interviews' => $profile->applications()->where('status', Application::STATUS_SHORTLISTED)->count(),
        'views_on_profile' => JobView::where('user_id', $user->id)->count(),
      ],
      'progress' => [
        'label' => 'Profile completion',
        'value' => $profile->completionPercentage(),
        'message' => $profile->completionPercentage() < 100
          ? 'Complete your profile to improve your visibility to recruiters.'
          : 'Your profile is complete and ready to attract recruiters.',
      ],
      'recent_applications' => $profile->applications()
        ->with(['jobListing.category', 'jobListing.employer'])
        ->latest()
        ->limit(5)
        ->get()
        ->map(fn($app) => [
          'id' => $app->id,
          'job_title' => $app->jobListing?->title ?? 'N/A',
          'company' => $app->jobListing?->employer?->name ?? 'N/A',
          'status' => $app->status,
          'ats_score' => $app->ats_score_percentage,
          'applied_at' => $app->created_at?->toDateTimeString(),
          'deadline' => $app->jobListing?->application_deadline?->toDateString(),
        ])->values(),
      'recent_notifications' => $user->notifications()->latest()->limit(5)->get()->map(fn($n) => [
        'id' => $n->id,
        'title' => $n->data['title'] ?? 'Update received',
        'body' => $n->data['message'] ?? null,
        'read_at' => $n->read_at,
        'created_at' => $n->created_at?->toDateTimeString(),
      ])->values(),
      'recommended_jobs' => $this->getRecommendedJobs($profile),
    ];
  }
  /**
   * Get recommended jobs for a job seeker.
   *
   * @param ApplicantProfile|null $profile
   * @return array<int, array<string, mixed>>
   */
  private function getRecommendedJobs(?ApplicantProfile $profile): array
  {
    $query = JobListing::query()
      ->where('is_active', true)
      ->whereNull('deleted_at')
      ->where('application_deadline', '>=', now())
      ->with(['category', 'locations', 'employer'])
      ->withCount(['applications', 'views']);

    if ($profile?->current_job_title) {
      $query->where('title', 'like', '%' . $profile->current_job_title . '%');
    }

    /** @var \Illuminate\Support\Collection<int, JobListing> $jobs */
    $jobs = $query->latest()
      ->limit(6)
      ->get();

    return $jobs
      ->map(fn(JobListing $job) => [
        'id' => $job->id,
        'title' => $job->title,
        'slug' => $job->slug,
        'company' => $job->employer?->name ?? 'N/A',
        'category' => $job->category?->name ?? 'N/A',
        'locations' => $job->locations->pluck('name')->values(),
        'job_type' => $job->job_type,
        'salary_range' => $job->salary_range,
        'applications_count' => $job->applications_count,
        'views_count' => $job->views_count,
      ])
      ->values()
      ->toArray();
  }

  /**
   * Build admin/employer dashboard data.
   */
  /**
   * Build admin/employer dashboard data.
   */
  private function buildAdminData(User $user, array $roles, array $permissions): ?array
  {
    $hasAnyRole = fn(array $needles) => count(array_intersect($roles, $needles)) > 0;
    $hasPermission = fn(string $permission) => in_array($permission, $permissions, true);

    $isAdmin = $hasAnyRole(['super-admin', 'admin']) || $hasPermission('dashboard.admin');
    $isEmployer = $hasAnyRole(['employer-admin', 'hr-manager', 'recruiter']) || $hasPermission('dashboard.employer');

    if (!($isAdmin || $isEmployer)) {
      return null;
    }

    return [
      'role' => $isAdmin ? 'admin' : 'employer',
      'summary' => [
        'total_users' => User::count(),
        'active_users' => User::whereNotNull('email_verified_at')->count(),
        'total_job_seekers' => User::whereHas('roles', fn($q) => $q->where('slug', 'job-seeker'))->count(),
        'total_employers' => User::whereHas('roles', fn($q) => $q->whereIn('slug', ['employer-admin', 'hr-manager', 'recruiter']))->count(),
        'total_jobs' => JobListing::withTrashed()->count(),
        'active_jobs' => JobListing::where('is_active', true)->whereNull('deleted_at')->count(),
        'expired_jobs' => JobListing::where('application_deadline', '<', now())->count(),
        'total_applications' => Application::count(),
        'pending_applications' => Application::where('status', Application::STATUS_PENDING)->count(),
        'shortlisted_applications' => Application::where('status', Application::STATUS_SHORTLISTED)->count(),
        'hired_applications' => Application::where('status', Application::STATUS_HIRED)->count(),
        'average_ats' => (int) round((float) Application::query()
          ->selectRaw('AVG(COALESCE(JSON_EXTRACT(ats_score, "$.percentage"), JSON_EXTRACT(ats_score, "$.total"), 0)) as avg_score')
          ->value('avg_score') ?? 0),
        'active_locations' => Location::where('is_active', true)->count(),
      ],
      'recent_applications' => Application::with(['jobListing.employer', 'applicantProfile.user'])
        ->latest()
        ->limit(8)
        ->get()
        ->map(fn(Application $app) => [
          'id' => $app->id,
          'applicant' => $app->name ?? 'N/A',
          'job_title' => $app->jobListing?->title ?? 'N/A',
          'company' => $app->jobListing?->employer?->name ?? 'N/A',
          'status' => $app->status,
          'ats_score' => $app->ats_score_percentage,
          'submitted_at' => $app->created_at?->toDateTimeString(),
        ])->values(),
      'top_jobs' => JobListing::with(['category', 'employer'])
        ->withCount(['applications', 'views'])
        ->orderByDesc('applications_count')
        ->limit(6)
        ->get()
        ->map(fn(JobListing $job) => [
          'id' => $job->id,
          'title' => $job->title,
          'company' => $job->employer?->name ?? 'N/A',
          'category' => $job->category?->name ?? 'N/A',
          'applications_count' => $job->applications_count,
          'views_count' => $job->views_count,
          'is_active' => $job->is_active,
          'deadline' => $job->application_deadline,
        ])->values(),
      'top_employers' => User::query()
        ->whereHas('roles', fn($q) => $q->whereIn('slug', ['employer-admin', 'hr-manager', 'recruiter']))
        ->withCount(['jobListings', 'applications'])
        ->orderByDesc('job_listings_count')
        ->limit(8)
        ->get()
        ->map(fn(User $employer) => [
          'id' => $employer->id,
          'name' => $employer->name ?? 'N/A',
          'job_listings_count' => $employer->job_listings_count,
          'applications_count' => $employer->applications_count,
        ])->values(),
      'trend' => [
        'jobs_last_30_days' => JobListing::where('created_at', '>=', now()->subDays(30))->count(),
        'applications_last_30_days' => Application::where('created_at', '>=', now()->subDays(30))->count(),
        'views_last_30_days' => JobView::where('created_at', '>=', now()->subDays(30))->count(),
      ],
    ];
  }
}
