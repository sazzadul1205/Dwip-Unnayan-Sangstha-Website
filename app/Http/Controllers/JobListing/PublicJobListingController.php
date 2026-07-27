<?php

namespace App\Http\Controllers\JobListing;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Models\JobView;
use App\Models\Location;
use App\Models\JobListing;
use App\Models\JobCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Http\JsonResponse;

class PublicJobListingController extends Controller
{
    /**
     * Display public job listings.
     */
    public function index(Request $request): \Inertia\Response
    {
        $query = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations', 'employer'])
            ->withCount(['applications', 'views']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', fn($cat) => $cat->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('locations', fn($loc) => $loc->where('name', 'like', "%{$search}%"));
            });
        }

        // Category filter
        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        // Location filter
        if ($request->filled('location')) {
            $query->whereHas('locations', fn($q) => $q->where('locations.id', $request->location));
        }

        // Job type filter
        if ($request->filled('job_type')) {
            $query->where('job_type', $request->job_type);
        }

        // Experience level filter
        if ($request->filled('experience_level')) {
            $query->where('experience_level', $request->experience_level);
        }

        // Salary filters
        if ($request->filled('salary_min')) {
            $query->where('salary_max', '>=', (float) $request->salary_min);
        }
        if ($request->filled('salary_max')) {
            $query->where('salary_min', '<=', (float) $request->salary_max);
        }

        // Sorting
        $sort = $request->input('sort', 'latest');
        $this->applyPublicSorting($query, $sort);

        $jobListings = $query->paginate(12)->through(fn($job) => $this->formatPublicJobListing($job));

        // Filter data
        $categories = $this->getCategoriesWithCounts();
        $locations = $this->getLocationsWithCounts();
        $jobTypes = $this->getDistinctJobTypes();
        $experienceLevels = $this->getDistinctExperienceLevels();
        $salaryRange = $this->getSalaryRange();
        $stats = $this->getPublicStats();

        return Inertia::render('Backend/PublicJobListing/Index', [
            'jobListings' => $jobListings,
            'categories' => $categories,
            'locations' => $locations,
            'jobTypes' => $jobTypes,
            'experienceLevels' => $experienceLevels,
            'salaryRange' => $salaryRange,
            'filters' => $request->only([
                'search',
                'category',
                'location',
                'job_type',
                'experience_level',
                'salary_min',
                'salary_max',
                'sort'
            ]),
            'stats' => $stats,
        ]);
    }

    /**
     * Display a single job listing.
     */
    public function show(string $slug): \Inertia\Response
    {
        $jobListing = JobListing::where('slug', $slug)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations', 'employer'])
            ->withCount(['applications', 'views'])
            ->firstOrFail();

        // Record view
        $this->recordJobView($jobListing);

        $totalViews = $jobListing->views()->count();

        // Check if user has applied
        $hasApplied = false;
        $existingApplication = null;
        if (Auth::check()) {
            $existingApplication = $jobListing->applications()
                ->where('user_id', Auth::id())
                ->first();
            $hasApplied = !is_null($existingApplication);
        }

        // Application stats
        $applications = $jobListing->applications()->get();
        $applicationStats = $this->calculateApplicationStats($applications);
        $averageAtsScore = $this->calculateAverageAtsScore($applications);

        // Related jobs
        $relatedJobs = $this->getRelatedJobs($jobListing);

        return Inertia::render('Backend/PublicJobListing/Show', [
            'jobListing' => $this->formatPublicJobDetail($jobListing, $totalViews),
            'userData' => Auth::user(),
            'hasApplied' => $hasApplied,
            'existingApplication' => $existingApplication,
            'relatedJobs' => $relatedJobs,
            'applicationStats' => $applicationStats,
            'averageAtsScore' => $averageAtsScore,
        ]);
    }

    /**
     * Get popular jobs based on views.
     */
    public function popular(): JsonResponse
    {
        /** @var Collection<int, JobListing> $popularJobs */
        $popularJobs = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations'])
            ->withCount(['applications', 'views'])
            ->orderBy('views_count', 'desc')
            ->limit(10)
            ->get();

        return response()->json(
            $popularJobs->map(fn(JobListing $job) => $this->formatPublicApiJob($job))->values()
        );
    }

    /**
     * Get trending jobs based on applications.
     */
    public function trending(): JsonResponse
    {
        /** @var Collection<int, JobListing> $trendingJobs */
        $trendingJobs = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations'])
            ->withCount(['applications', 'views'])
            ->orderBy('applications_count', 'desc')
            ->limit(10)
            ->get();

        return response()->json(
            $trendingJobs->map(fn(JobListing $job) => $this->formatPublicApiJob($job))->values()
        );
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    /**
     * Apply public sorting to query.
     */
    private function applyPublicSorting(Builder $query, string $sort): void
    {
        switch ($sort) {
            case 'latest':
                $query->orderBy('created_at', 'desc');
                break;
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'deadline_soon':
                $query->orderBy('application_deadline', 'asc');
                break;
            case 'deadline_later':
                $query->orderBy('application_deadline', 'desc');
                break;
            case 'salary_high':
                $query->orderByRaw('COALESCE(salary_max, salary_min, 0) DESC');
                break;
            case 'salary_low':
                $query->orderByRaw('COALESCE(salary_min, salary_max, 0) ASC');
                break;
            case 'popular':
                $query->orderBy('views_count', 'desc');
                break;
            case 'most_applied':
                $query->orderBy('applications_count', 'desc');
                break;
            default:
                $query->orderBy('created_at', 'desc');
        }
    }

    /**
     * Get categories with job counts.
     */
    private function getCategoriesWithCounts(): Collection
    {
        return JobCategory::whereHas('jobListings', function ($query) {
            $query->where('is_active', true)
                ->whereNull('deleted_at')
                ->where('application_deadline', '>=', now());
        })
            ->withCount(['jobListings' => function ($query) {
                $query->where('is_active', true)
                    ->whereNull('deleted_at')
                    ->where('application_deadline', '>=', now());
            }])
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'job_listings_count' => $category->job_listings_count,
            ]);
    }

    /**
     * Get locations with job counts.
     */
    private function getLocationsWithCounts(): Collection
    {
        return Location::whereHas('jobListings', function ($query) {
            $query->where('is_active', true)
                ->whereNull('deleted_at')
                ->where('application_deadline', '>=', now());
        })
            ->withCount(['jobListings' => function ($query) {
                $query->where('is_active', true)
                    ->whereNull('deleted_at')
                    ->where('application_deadline', '>=', now());
            }])
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn($location) => [
                'id' => $location->id,
                'name' => $location->name,
                'job_listings_count' => $location->job_listings_count,
            ]);
    }

    /**
     * Get distinct job types.
     */
    private function getDistinctJobTypes(): array
    {
        return JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->distinct()
            ->pluck('job_type')
            ->toArray();
    }

    /**
     * Get distinct experience levels.
     */
    private function getDistinctExperienceLevels(): array
    {
        return JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->distinct()
            ->pluck('experience_level')
            ->toArray();
    }

    /**
     * Get salary range for filtering.
     */
    private function getSalaryRange(): array
    {
        $stats = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->selectRaw('MIN(COALESCE(salary_min, salary_max)) as min_salary, MAX(COALESCE(salary_max, salary_min)) as max_salary')
            ->first();

        return [
            'min' => (int) ($stats->min_salary ?? 0),
            'max' => (int) ($stats->max_salary ?? 1000000),
        ];
    }

    /**
     * Get public statistics.
     */
    private function getPublicStats(): array
    {
        $baseQuery = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now());

        $totalJobs = $baseQuery->count();
        $totalViews = $baseQuery->sum('views_count');

        $totalApplications = $baseQuery->withCount('applications')
            ->get()
            ->sum('applications_count');

        return [
            'total_jobs' => $totalJobs,
            'total_views' => $totalViews,
            'total_applications' => $totalApplications,
        ];
    }

    /**
     * Format a public job listing for the API response.
     */
    private function formatPublicApiJob(JobListing $job): array
    {
        return [
            'id' => $job->id,
            'title' => $job->title,
            'slug' => $job->slug,
            'job_type' => $job->job_type,
            'salary_min' => $job->salary_min,
            'salary_max' => $job->salary_max,
            'views_count' => $job->views_count ?? 0,
            'applications_count' => $job->applications_count ?? 0,
            'category' => $job->category?->name,
            'locations' => $job->locations->pluck('name')->toArray(),
        ];
    }

    /**
     * Format a public job listing for display.
     */
    private function formatPublicJobListing(JobListing $jobListing): array
    {
        $description = strip_tags($jobListing->description);
        $truncated = substr($description, 0, 150) . (strlen($description) > 150 ? '...' : '');

        return [
            'id' => $jobListing->id,
            'title' => $jobListing->title,
            'slug' => $jobListing->slug,
            'job_type' => $jobListing->job_type,
            'experience_level' => $jobListing->experience_level,
            'salary_min' => $jobListing->salary_min,
            'salary_max' => $jobListing->salary_max,
            'is_salary_negotiable' => $jobListing->is_salary_negotiable,
            'as_per_companies_policy' => $jobListing->as_per_companies_policy,
            'description' => $truncated,
            'application_deadline' => $jobListing->application_deadline,
            'views_count' => $jobListing->views_count ?? 0,
            'applications_count' => $jobListing->applications_count ?? 0,
            'category' => $jobListing->category ? [
                'id' => $jobListing->category->id,
                'name' => $jobListing->category->name,
                'slug' => $jobListing->category->slug,
            ] : null,
            'locations' => $jobListing->locations->map(fn($location) => [
                'id' => $location->id,
                'name' => $location->name,
            ]),
            'employer' => $jobListing->employer ? [
                'id' => $jobListing->employer->id,
                'name' => $jobListing->employer->name,
                'email' => $jobListing->employer->email,
            ] : null,
        ];
    }

    /**
     * Format a public job detail for display.
     */
    private function formatPublicJobDetail(JobListing $jobListing, int $totalViews): array
    {
        return [
            'id' => $jobListing->id,
            'title' => $jobListing->title,
            'slug' => $jobListing->slug,
            'description' => $jobListing->description,
            'requirements' => $jobListing->requirements,
            'job_type' => $jobListing->job_type,
            'experience_level' => $jobListing->experience_level,
            'salary_min' => $jobListing->salary_min,
            'salary_max' => $jobListing->salary_max,
            'is_salary_negotiable' => $jobListing->is_salary_negotiable,
            'as_per_companies_policy' => $jobListing->as_per_companies_policy,
            'education_requirement' => $jobListing->education_requirement,
            'education_details' => $jobListing->education_details,
            'benefits' => $jobListing->benefits,
            'skills' => $jobListing->skills,
            'responsibilities' => $jobListing->responsibilities,
            'keywords' => $jobListing->keywords,
            'application_deadline' => $jobListing->application_deadline,
            'publish_at' => $jobListing->publish_at,
            'is_active' => $jobListing->is_active,
            'required_linkedin_link' => $jobListing->required_linkedin_link,
            'required_facebook_link' => $jobListing->required_facebook_link,
            'views_count' => $totalViews,
            'applications_count' => $jobListing->applications_count ?? 0,
            'created_at' => $jobListing->created_at,
            'updated_at' => $jobListing->updated_at,
            'category' => $jobListing->category ? [
                'id' => $jobListing->category->id,
                'name' => $jobListing->category->name,
                'slug' => $jobListing->category->slug,
            ] : null,
            'locations' => $jobListing->locations->map(fn($location) => [
                'id' => $location->id,
                'name' => $location->name,
            ]),
            'employer' => $jobListing->employer ? [
                'id' => $jobListing->employer->id,
                'name' => $jobListing->employer->name,
                'email' => $jobListing->employer->email,
            ] : null,
        ];
    }

    /**
     * Record a job view.
     */
    private function recordJobView(JobListing $jobListing): void
    {
        $ipAddress = request()->ip();
        $alreadyViewed = JobView::where('job_listing_id', $jobListing->id)
            ->where('ip_address', $ipAddress)
            ->exists();

        if (!$alreadyViewed) {
            JobView::recordView($jobListing->id, Auth::id(), $ipAddress);
            $jobListing->incrementViews();
            $jobListing->refresh();

            Log::info('Job view recorded', [
                'job_id' => $jobListing->id,
                'ip' => $ipAddress,
                'user_id' => Auth::id(),
            ]);
        }
    }

    /**
     * Calculate application statistics.
     */
    private function calculateApplicationStats(Collection $applications): array
    {
        return [
            'total' => $applications->count(),
            'pending' => $applications->where('status', 'pending')->count(),
            'shortlisted' => $applications->where('status', 'shortlisted')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
            'hired' => $applications->where('status', 'hired')->count(),
        ];
    }

    /**
     * Calculate average ATS score.
     */
    private function calculateAverageAtsScore(Collection $applications): ?float
    {
        $completedATS = $applications->filter(function ($app) {
            return $app->isAtsCompleted() && $app->ats_score && isset($app->ats_score['percentage']);
        });

        if ($completedATS->count() === 0) {
            return null;
        }

        $totalScore = $completedATS->sum(function ($app) {
            return $app->ats_score['percentage'] ?? 0;
        });

        return round($totalScore / $completedATS->count(), 2);
    }

    /**
     * Get related jobs.
     */
    private function getRelatedJobs(JobListing $jobListing): array
    {
        /** @var Collection<int, JobListing> $relatedJobs */
        $relatedJobs = JobListing::where('category_id', $jobListing->category_id)
            ->where('id', '!=', $jobListing->id)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations'])
            ->withCount(['applications', 'views'])
            ->limit(3)
            ->get();

        return $relatedJobs
            ->map(fn(JobListing $job) => $this->formatPublicJobListing($job))
            ->toArray();
    }
}
