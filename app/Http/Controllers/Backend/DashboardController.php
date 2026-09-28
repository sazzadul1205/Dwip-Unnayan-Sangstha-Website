<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\ApplicantProfile;
use App\Models\Application;
use App\Models\JobListing;
use App\Models\JobView;
use App\Models\Location;
use App\Models\User;
use App\Services\DashboardMetrics;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
  /**
   * Cache lifetime for the global (identical-for-everyone) admin block.
   */
  protected int $globalCacheDuration = 300;

  /**
   * Cache lifetime for the per-user scoped blocks.
   */
  protected int $userCacheDuration = 120;

  /**
   * Role slugs that identify an employer-side account.
   */
  protected const EMPLOYER_ROLE_SLUGS = DashboardMetrics::EMPLOYER_ROLE_SLUGS;

  /**
   * Bump to invalidate every cached dashboard payload at once.
   */
  protected const CACHE_VERSION = 'v2';

  /**
   * Display the dashboard based on user role.
   */
  public function index(Request $request): Response
  {
    $user = $this->getAuthUser();
    $user->loadMissing('roles');

    $roles = $user->roles?->pluck('slug')->all() ?? [];
    $permissions = $user->permissions_list ?? [];
    $role = $this->detectRole($roles, $permissions);

    $days = DashboardMetrics::rangeToDays($request->query('range'));

    $dashboardData = [
      'role' => $role,
      'job_seeker' => $this->jobSeekerData($user, $roles, $permissions),
      'admin_staff' => $this->adminData($user, $roles, $permissions, $days),
      'generated_at' => now()->toDateTimeString(),
    ];

    Log::debug('Dashboard rendered', [
      'user_id' => $user->id,
      'role' => $role,
    ]);

    return Inertia::render('dashboard', [
      'dashboardData' => $dashboardData,
    ]);
  }

  /**
   * Clear cached dashboard payloads.
   *
   * The global block is shared by every admin, so clearing it invalidates one
   * key rather than one key per user. The legacy signature is kept for
   * compatibility with existing callers.
   */
  public function clearCache(?int $userId = null): void
  {
    Cache::forget($this->globalCacheKey());

    if ($userId) {
      Cache::forget($this->userCacheKey($userId));
    } elseif ($user = Auth::user()) {
      Cache::forget($this->userCacheKey($user->id));
    }
  }

  /* ==========================================
   | PRIVATE HELPERS
   |========================================== */

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
   * Cache key for the shared platform-wide block.
   */
  private function globalCacheKey(): string
  {
    return 'dash:global:' . self::CACHE_VERSION;
  }

  /**
   * Cache key for a per-user scoped block.
   */
  private function userCacheKey(int $userId): string
  {
    return 'dash:user:' . self::CACHE_VERSION . ':' . $userId;
  }

  /**
   * Detect the user's primary role.
   *
   * @param  array<int, string>  $roles
   * @param  array<int, string>  $permissions
   */
  private function detectRole(array $roles, array $permissions): string
  {
    $hasAnyRole = fn (array $needles) => count(array_intersect($roles, $needles)) > 0;
    $hasPermission = fn (string $permission) => in_array($permission, $permissions, true);

    $isAdmin = $hasAnyRole(['super-admin', 'admin']) || $hasPermission('dashboard.admin');
    $isEmployer = $hasAnyRole(self::EMPLOYER_ROLE_SLUGS) || $hasPermission('dashboard.employer');
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
   *
   * @param  array<int, string>  $roles
   * @param  array<int, string>  $permissions
   * @return array<string, mixed>|null
   */
  private function jobSeekerData(User $user, array $roles, array $permissions): ?array
  {
    $isJobSeeker = in_array('job-seeker', $roles, true)
      || in_array('dashboard.job_seeker', $permissions, true);

    if (!$isJobSeeker) {
      return null;
    }

    return Cache::remember($this->userCacheKey($user->id) . ':seeker', $this->userCacheDuration, function () use ($user) {
      $profile = $user->applicantProfile()->with([
        'cvs' => fn ($q) => $q->where('status', 'active')->orderBy('order_position'),
        'primaryCv',
      ])->first();

      if (!$profile) {
        return null;
      }

      $completion = $profile->completionPercentage();

      $statusCounts = Application::query()
        ->where('applicant_profile_id', $profile->id)
        ->selectRaw(<<<'SQL'
            COUNT(*)                                                    AS total,
            COALESCE(SUM(status = 'pending'), 0)     AS pending,
            COALESCE(SUM(status = 'shortlisted'), 0) AS shortlisted,
            COALESCE(SUM(status = 'rejected'), 0)    AS rejected,
            COALESCE(SUM(status = 'hired'), 0)       AS hired
        SQL)
        ->first();

      $recentApplications = $profile->applications()
        ->with(['jobListing.category', 'jobListing.employer'])
        ->latest()
        ->limit(5)
        ->get()
        ->map(fn (Application $app) => [
          'id' => $app->id,
          'job_title' => $app->jobListing?->title ?? 'N/A',
          'company' => $app->jobListing?->employer?->name ?? 'N/A',
          'status' => $app->status,
          'ats_score' => $app->ats_score_percentage,
          'applied_at' => $app->created_at?->toDateTimeString(),
          'deadline' => $app->jobListing?->application_deadline?->toDateString(),
        ])->values();

      return [
        'role' => 'job_seeker',
        'summary' => [
          'profile_completion' => $completion,
          'active_cvs' => $profile->cvs->count(),
          'primary_cv_set' => (bool) $profile->primaryCv,
          'total_applications' => (int) $statusCounts->total,
          'pending_applications' => (int) $statusCounts->pending,
          'shortlisted_applications' => (int) $statusCounts->shortlisted,
          'rejected_applications' => (int) $statusCounts->rejected,
          'hired_applications' => (int) $statusCounts->hired,
          // Distinct metric: an applicant can be shortlisted without ever
          // having received an interview, so this is no longer a copy of
          // shortlisted_applications.
          'interviews' => $this->countInterviews($profile->id),
          // JobView rows are job impressions, not profile impressions. This
          // now counts views of the jobs this seeker has applied to, which is
          // the signal the label always implied.
          'views_on_profile' => JobView::whereIn(
            'job_listing_id',
            $profile->applications()->select('job_listing_id')
          )->count(),
        ],
        'progress' => [
          'label' => 'Profile completion',
          'value' => $completion,
          'message' => $completion < 100
            ? 'Complete your profile to improve your visibility to recruiters.'
            : 'Your profile is complete and ready to attract recruiters.',
        ],
        'recent_applications' => $recentApplications,
        'recent_notifications' => $user->notifications()->latest()->limit(5)->get()->map(fn ($n) => [
          'id' => $n->id,
          'title' => $n->data['title'] ?? 'Update received',
          'body' => $n->data['message'] ?? null,
          'read_at' => $n->read_at,
          'created_at' => $n->created_at?->toDateTimeString(),
        ])->values(),
        'recommended_jobs' => $this->recommendedJobs($profile),
      ];
    });
  }

  /**
   * Applications that advanced to shortlisted or hired.
   *
   * Read from status_timelines so an interview is distinguished from a bare
   * shortlist.
   */
  private function countInterviews(int $profileId): int
  {
    return Application::query()
      ->where('applicant_profile_id', $profileId)
      ->whereHas('statusTimelines', fn ($q) => $q->whereIn('status', [
        Application::STATUS_SHORTLISTED,
        Application::STATUS_HIRED,
      ]))
      ->count();
  }

  /**
   * Recommended jobs for a job seeker.
   *
   * @return array<int, array<string, mixed>>
   */
  private function recommendedJobs(?ApplicantProfile $profile): array
  {
    $query = JobListing::query()
      ->where('is_active', true)
      ->whereNull('deleted_at')
      ->where('application_deadline', '>=', now())
      ->where('publish_at', '<=', now())
      ->with(['category', 'locations', 'employer'])
      ->withCount(['applications', 'views']);

    if ($profile?->current_job_title) {
      $query->where('title', 'like', '%' . $profile->current_job_title . '%');
    }

    return $query->latest()
      ->limit(6)
      ->get()
      ->map(fn (JobListing $job) => [
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
   *
   * Platform administrators receive global metrics. Employer-side staff
   * receive metrics scoped strictly to their own listings, because the
   * previous implementation handed them every applicant on the platform.
   *
   * @param  array<int, string>  $roles
   * @param  array<int, string>  $permissions
   * @return array<string, mixed>|null
   */
  private function adminData(User $user, array $roles, array $permissions, int $days): ?array
  {
    $hasAnyRole = fn (array $needles) => count(array_intersect($roles, $needles)) > 0;
    $hasPermission = fn (string $permission) => in_array($permission, $permissions, true);

    $isAdmin = $hasAnyRole(['super-admin', 'admin']) || $hasPermission('dashboard.admin');
    $isEmployer = $hasAnyRole(self::EMPLOYER_ROLE_SLUGS) || $hasPermission('dashboard.employer');

    if (!($isAdmin || $isEmployer)) {
      return null;
    }

    return $isAdmin
      ? $this->platformAdminData($days)
      : $this->employerData($user);
  }

  /**
   * Global platform view for administrators.
   *
   * @return array<string, mixed>
   */
  private function platformAdminData(int $days): array
  {
    return Cache::remember(
      $this->globalCacheKey() . ':' . $days,
      $this->globalCacheDuration,
      function () use ($days) {
        $kpis = DashboardMetrics::platformKpis();
        $pipeline = DashboardMetrics::pipelineHealth();
        $topJobs = DashboardMetrics::topJobs();
        $activity = DashboardMetrics::recentActivity(12);
        $series = DashboardMetrics::timeSeries($days);
        $monthlySeries = $days === 30 ? $series : DashboardMetrics::timeSeries(30);

        return [
          'scope' => 'platform',
          'role' => 'admin',

          // Legacy keys retained for the existing dashboard.jsx contract.
          'summary' => [
            'total_users' => $kpis['users']['total'],
            'active_users' => $kpis['users']['verified'],
            'total_job_seekers' => $kpis['users']['job_seekers'],
            'total_employers' => $kpis['users']['employers'],
            'total_jobs' => $kpis['jobs']['total'],
            'active_jobs' => $kpis['jobs']['active'],
            'expired_jobs' => $kpis['jobs']['expired'],
            'total_applications' => $kpis['applications']['total'],
            'pending_applications' => $kpis['applications']['pending'],
            'shortlisted_applications' => $kpis['applications']['shortlisted'],
            'hired_applications' => $kpis['applications']['hired'],
            'average_ats' => $kpis['engagement']['avg_ats'] ?? 0,
            'active_locations' => Location::where('is_active', true)->count(),
          ],

          'kpis' => $kpis,

          'timeseries' => $series,
          'comparison' => DashboardMetrics::periodComparison($days),
          'funnel' => DashboardMetrics::funnel(),
          'distributions' => DashboardMetrics::distributions(),
          'pipeline' => $pipeline,
          'ats' => DashboardMetrics::atsHealth(),
          'applicants' => DashboardMetrics::applicantPool(),
          'cms' => DashboardMetrics::cmsHealth(),
          'newsletter' => DashboardMetrics::newsletterHealth(),

          'recent_applications' => $this->recentApplications(),
          'recent_activity' => $activity,
          'top_jobs' => $topJobs['by_applications'],
          'top_jobs_by_views' => $topJobs['by_views'],
          'top_jobs_by_conversion' => $topJobs['by_conversion'],
          'top_employers' => DashboardMetrics::topEmployers(),

          'trend' => [
            'jobs_last_30_days' => array_sum($monthlySeries['jobs']),
            'applications_last_30_days' => array_sum($monthlySeries['applications']),
            'views_last_30_days' => $kpis['engagement']['views_30d'],
          ],
        ];
      }
    );
  }

  /**
   * Scoped view for employer-side staff.
   *
   * @return array<string, mixed>
   */
  private function employerData(User $user): array
  {
    return Cache::remember(
      $this->userCacheKey($user->id) . ':employer',
      $this->userCacheDuration,
      function () use ($user) {
        $jobIds = JobListing::query()
          ->where('user_id', $user->id)
          ->whereNull('deleted_at')
          ->select('id');

        $jobs = JobListing::query()
          ->where('user_id', $user->id)
          ->whereNull('deleted_at');

        $applications = Application::query()->whereIn('job_listing_id', $jobIds);

        $statusCounts = (clone $applications)
          ->selectRaw(<<<'SQL'
              COUNT(*)                                                    AS total,
              COALESCE(SUM(status = 'pending'), 0)     AS pending,
              COALESCE(SUM(status = 'shortlisted'), 0) AS shortlisted,
              COALESCE(SUM(status = 'rejected'), 0)    AS rejected,
              COALESCE(SUM(status = 'hired'), 0)       AS hired
          SQL)
          ->first();

        $totalViews = JobView::whereIn('job_listing_id', $jobIds)->count();

        $myJobs = $jobs->get()->map(fn (JobListing $job) => [
          'id' => $job->id,
          'title' => $job->title,
          'category' => $job->category?->name ?? 'N/A',
          'company' => $user->name ?? 'N/A',
          'is_active' => (bool) $job->is_active,
          'deadline' => $job->application_deadline?->toDateString(),
          'views_count' => (int) $job->views_count,
          'applications_count' => $job->applications()->count(),
        ])->values();

        return [
          'scope' => 'employer',
          'role' => 'employer',

          'summary' => [
            'total_users' => 0,
            'active_users' => 0,
            'total_job_seekers' => 0,
            'total_employers' => 0,
            'total_jobs' => (int) (clone $jobs)->count(),
            'active_jobs' => (clone $jobs)->where('is_active', true)->where('application_deadline', '>=', now())->count(),
            'expired_jobs' => (clone $jobs)->where('application_deadline', '<', now())->count(),
            'expiring_7d' => (clone $jobs)
              ->where('is_active', true)
              ->whereBetween('application_deadline', [now(), now()->addDays(7)])
              ->count(),
            'total_applications' => (int) $statusCounts->total,
            'pending_applications' => (int) $statusCounts->pending,
            'shortlisted_applications' => (int) $statusCounts->shortlisted,
            'hired_applications' => (int) $statusCounts->hired,
            'average_ats' => (int) round((float) (clone $applications)
              ->where('ats_calculation_status', Application::ATS_COMPLETED)
              ->selectRaw("AVG(CAST(JSON_UNQUOTE(JSON_EXTRACT(ats_score, '$.percentage')) AS DECIMAL(5,2))) AS avg_ats")
              ->value('avg_ats') ?? 0),
            'total_views' => $totalViews,
          ],

          'pending_reviews' => (int) (clone $applications)
            ->where('status', Application::STATUS_PENDING)
            ->where(fn ($q) => $q->whereNull('employer_notes')->orWhere('employer_notes', ''))
            ->count(),

          'my_jobs' => $myJobs,
          'recent_applications' => (clone $applications)
            ->with(['jobListing:id,title,user_id', 'jobListing.employer:id,name'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Application $app) => [
              'id' => $app->id,
              'applicant' => $app->name ?? 'N/A',
              'job_title' => $app->jobListing?->title ?? 'N/A',
              'company' => $app->jobListing?->employer?->name ?? 'N/A',
              'status' => $app->status,
              'ats_score' => $app->ats_score_percentage,
              'submitted_at' => $app->created_at?->toDateTimeString(),
            ])->values(),

          'top_jobs' => $myJobs->sortByDesc('applications_count')->take(6)->values()->all(),

          'trend' => [
            'applications_last_30_days' => (int) (clone $applications)
              ->where('created_at', '>=', now()->subDays(30))->count(),
            'views_last_30_days' => JobView::whereIn('job_listing_id', $jobIds)
              ->where('created_at', '>=', now()->subDays(30))->count(),
            'jobs_last_30_days' => 0,
          ],
        ];
      }
    );
  }

  /**
   * Latest applications across the platform, for the activity feed.
   *
   * @return Collection<int, array<string, mixed>>
   */
  private function recentApplications(): Collection
  {
    return Application::query()
      ->with(['jobListing.employer:id,name', 'jobListing:id,title,user_id'])
      ->latest()
      ->limit(8)
      ->get()
      ->map(fn (Application $app) => [
        'id' => $app->id,
        'applicant' => $app->name ?? 'N/A',
        'job_title' => $app->jobListing?->title ?? 'N/A',
        'company' => $app->jobListing?->employer?->name ?? 'N/A',
        'status' => $app->status,
        'ats_score' => $app->ats_score_percentage,
        'submitted_at' => $app->created_at?->toDateTimeString(),
      ])->values();
  }
}
