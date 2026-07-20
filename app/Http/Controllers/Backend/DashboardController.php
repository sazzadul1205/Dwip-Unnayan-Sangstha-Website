<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobListing;
use App\Models\JobView;
use App\Models\User;
use App\Models\Location;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
  public function index()
  {
    $authUser = Auth::user();
    $user = $authUser instanceof User ? $authUser : null;
    $roles = $user?->roles?->pluck('slug')->all() ?? [];
    $permissions = $user?->permissions_list ?? [];

    $hasRole = fn(string $role) => in_array($role, $roles, true);
    $hasAnyRole = fn(array $needles) => count(array_intersect($roles, $needles)) > 0;
    $hasPermission = fn(string $permission) => in_array($permission, $permissions, true);
    $isAdmin = $hasAnyRole(['super-admin', 'admin']) || $hasPermission('dashboard.admin');
    $isEmployer = $hasAnyRole(['employer-admin', 'hr-manager', 'recruiter']) || $hasPermission('dashboard.employer');
    $isJobSeeker = $hasRole('job-seeker') || $hasPermission('dashboard.job_seeker');

    // Determine role
    $role = 'guest';
    if ($isAdmin) $role = 'admin';
    elseif ($isEmployer) $role = 'staff';
    elseif ($isJobSeeker) $role = 'job_seeker';

    // Job Seeker Dashboard Data
    $jobSeekerDashboard = null;
    if ($isJobSeeker && $user) {
      $profile = $user->applicantProfile()->with([
        'cvs' => fn($q) => $q->where('status', 'active')->orderBy('order_position'),
        'primaryCv',
        'jobHistories',
        'educationHistories',
        'achievements',
      ])->first();

      if ($profile) {
        $jobSeekerDashboard = [
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
            ->map(fn($application) => [
              'id' => $application->id,
              'job_title' => $application->jobListing?->title ?? 'N/A',
              'company' => $application->jobListing?->employer?->name ?? 'N/A',
              'status' => $application->status,
              'ats_score' => $application->ats_score_percentage,
              'applied_at' => $application->created_at?->toDateTimeString(),
              'deadline' => $application->jobListing?->application_deadline?->toDateString(),
            ])->values(),
          'recent_notifications' => $user->notifications()->latest()->limit(5)->get()->map(fn($n) => [
            'id' => $n->id,
            'title' => $n->data['title'] ?? 'Update received',
            'body' => $n->data['message'] ?? null,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at?->toDateTimeString(),
          ])->values(),
          'recommended_jobs' => JobListing::query()
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->when($profile?->current_job_title, fn($q) => $q->where('title', 'like', '%' . $profile->current_job_title . '%'))
            ->with(['category', 'locations', 'employer'])
            ->withCount(['applications', 'views'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn($job) => [
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
            ])->values(),
        ];
      }
    }

    // Admin Dashboard Data
    $adminDashboard = null;
    if ($isAdmin || $isEmployer) {
      $adminDashboard = [
        'role' => $isAdmin ? 'admin' : ($isEmployer ? 'employer' : 'staff'),
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
          ->map(fn($application) => [
            'id' => $application->id,
            'applicant' => $application->name ?? 'N/A',
            'job_title' => $application->jobListing?->title ?? 'N/A',
            'company' => $application->jobListing?->employer?->name ?? 'N/A',
            'status' => $application->status,
            'ats_score' => $application->ats_score_percentage,
            'submitted_at' => $application->created_at?->toDateTimeString(),
          ])->values(),
        'top_jobs' => JobListing::with(['category', 'employer'])
          ->withCount(['applications', 'views'])
          ->orderByDesc('applications_count')
          ->limit(6)
          ->get()
          ->map(fn($job) => [
            'id' => $job->id,
            'title' => $job->title,
            'company' => $job->employer?->name ?? 'N/A',
            'category' => $job->category?->name ?? 'N/A',
            'applications_count' => $job->applications_count,
            'views_count' => $job->views_count,
            'is_active' => $job->is_active,
            'deadline' => $job->application_deadline?->toDateString(),
          ])->values(),
        'top_employers' => User::query()
          ->whereHas('roles', fn($q) => $q->whereIn('slug', ['employer-admin', 'hr-manager', 'recruiter']))
          ->withCount(['jobListings', 'applications'])
          ->orderByDesc('job_listings_count')
          ->limit(8)
          ->get()
          ->map(fn($employer) => [
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

    // Build dashboard data
    $dashboardData = [
      'role' => $role,
      'job_seeker' => $jobSeekerDashboard,
      'admin_staff' => $adminDashboard,
    ];

    // Log for debugging
    Log::info('Dashboard Data:', [
      'role' => $role,
      'has_job_seeker' => $jobSeekerDashboard !== null,
      'has_admin_staff' => $adminDashboard !== null,
    ]);

    return Inertia::render('dashboard', [
      'dashboardData' => $dashboardData,
    ]);
  }
}
