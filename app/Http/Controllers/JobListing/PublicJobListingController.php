<?php
// app/Http/Controllers/JobListing/PublicJobListingController.php

namespace App\Http\Controllers\JobListing;

// Inertia
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

// Models
use App\Models\JobView;
use App\Models\Location;
use App\Models\JobListing;
use App\Models\JobCategory;


class PublicJobListingController extends Controller
{
    /**
     * Display public job listings for applicants
     * Only shows active, non-deleted jobs with valid deadlines
     * Fully queryable with filters and sorting
     */
    public function index(Request $request)
    {
        // Public access - no permission check needed
        // But we check if user is logged in for personalized features
        $user = Auth::user();

        // Base query - only active, non-deleted jobs with upcoming deadlines
        $query = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations', 'employer'])
            ->withCount([
                'applications',
                'views'
            ]);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($cat) use ($search) {
                        $cat->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('locations', function ($loc) use ($search) {
                        $loc->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Category filter (by slug)
        if ($request->filled('category')) {
            $query->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category);
            });
        }

        // Location filter (by id)
        if ($request->filled('location')) {
            $query->whereHas('locations', function ($q) use ($request) {
                $q->where('locations.id', $request->location);
            });
        }

        // Job type filter
        if ($request->filled('job_type')) {
            $query->where('job_type', $request->job_type);
        }

        // Experience level filter
        if ($request->filled('experience_level')) {
            $query->where('experience_level', $request->experience_level);
        }

        // Salary range filters
        if ($request->filled('salary_min')) {
            $query->where('salary_max', '>=', $request->salary_min);
        }
        if ($request->filled('salary_max')) {
            $query->where('salary_min', '<=', $request->salary_max);
        }

        // Sorting
        $sort = $request->get('sort', 'latest');
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

        $jobListings = $query->paginate(12)->through(function ($jobListing) {
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
                'description' => strip_tags(substr($jobListing->description, 0, 150)) . (strlen(strip_tags($jobListing->description)) > 150 ? '...' : ''),
                'application_deadline' => $jobListing->application_deadline,
                'views_count' => $jobListing->views_count ?? 0,
                'applications_count' => $jobListing->applications_count ?? 0,
                'category' => $jobListing->category ? [
                    'id' => $jobListing->category->id,
                    'name' => $jobListing->category->name,
                    'slug' => $jobListing->category->slug,
                ] : null,
                'locations' => $jobListing->locations->map(function ($location) {
                    return [
                        'id' => $location->id,
                        'name' => $location->name,
                    ];
                }),
                'employer' => $jobListing->employer ? [
                    'id' => $jobListing->employer->id,
                    'name' => $jobListing->employer->name,
                    'email' => $jobListing->employer->email,
                ] : null,
            ];
        })->withQueryString();

        // Get categories with counts - ONLY categories that have active jobs
        $categories = JobCategory::whereHas('jobListings', function ($query) {
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
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'job_listings_count' => $category->job_listings_count,
                ];
            });

        // Get locations with counts - ONLY locations that have active jobs
        $locations = Location::whereHas('jobListings', function ($query) {
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
            ->map(function ($location) {
                return [
                    'id' => $location->id,
                    'name' => $location->name,
                    'job_listings_count' => $location->job_listings_count,
                ];
            });

        // Get unique job types that actually have jobs
        $jobTypes = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->distinct()
            ->pluck('job_type')
            ->toArray();

        // Get unique experience levels that actually have jobs
        $experienceLevels = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->distinct()
            ->pluck('experience_level')
            ->toArray();

        // Get salary range for filtering
        $salaryStats = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->selectRaw('MIN(COALESCE(salary_min, salary_max)) as min_salary, MAX(COALESCE(salary_max, salary_min)) as max_salary')
            ->first();

        // Get statistics for the header
        $totalJobs = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->count();

        $totalViews = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->sum('views_count');

        $totalApplications = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->withCount('applications')
            ->get()
            ->sum('applications_count');

        return Inertia::render('Backend/PublicJobListing/Index', [
            'jobListings' => $jobListings,
            'categories' => $categories,
            'locations' => $locations,
            'jobTypes' => $jobTypes,
            'experienceLevels' => $experienceLevels,
            'salaryRange' => [
                'min' => (int)($salaryStats->min_salary ?? 0),
                'max' => (int)($salaryStats->max_salary ?? 1000000),
            ],
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
            'stats' => [
                'total_jobs' => $totalJobs,
                'total_views' => $totalViews,
                'total_applications' => $totalApplications,
            ]
        ]);
    }

    /**
     * Display a single job listing and register a view
     */
    public function show(string $slug)
    {
        // Public access - no permission check needed
        $user = Auth::user();

        $jobListing = JobListing::where('slug', $slug)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations', 'employer'])
            ->withCount([
                'applications',
                'views'
            ])
            ->firstOrFail();

        // Record view with IP-based uniqueness
        $ipAddress = request()->ip();
        $alreadyViewed = JobView::where('job_listing_id', $jobListing->id)
            ->where('ip_address', $ipAddress)
            ->exists();

        if (!$alreadyViewed) {
            JobView::recordView($jobListing->id, Auth::id(), $ipAddress);
            $jobListing->incrementViews();
            $jobListing->refresh();
        }

        // Get total views count
        $totalViews = $jobListing->views()->count();

        // Check if current user has already applied
        $hasApplied = false;
        $existingApplication = null;

        if (Auth::check()) {
            $existingApplication = $jobListing->applications()
                ->where('user_id', Auth::id())
                ->first();
            $hasApplied = !is_null($existingApplication);
        }

        // Get application statistics for this job
        $applications = $jobListing->applications()->get();
        $applicationStats = [
            'total' => $applications->count(),
            'pending' => $applications->where('status', 'pending')->count(),
            'shortlisted' => $applications->where('status', 'shortlisted')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
            'hired' => $applications->where('status', 'hired')->count(),
        ];

        // Calculate average ATS score
        $completedATS = $applications->filter(function ($app) {
            return $app->isAtsCompleted() && $app->ats_score && isset($app->ats_score['percentage']);
        });

        $averageAtsScore = null;
        if ($completedATS->count() > 0) {
            $totalScore = $completedATS->sum(function ($app) {
                return $app->ats_score['percentage'] ?? 0;
            });
            $averageAtsScore = round($totalScore / $completedATS->count(), 2);
        }

        // Get related jobs (same category) with view and application counts
        $relatedJobs = JobListing::where('category_id', $jobListing->category_id)
            ->where('id', '!=', $jobListing->id)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations'])
            ->withCount(['applications', 'views'])
            ->limit(3)
            ->get()
            ->map(function ($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'slug' => $job->slug,
                    'job_type' => $job->job_type,
                    'salary_min' => $job->salary_min,
                    'salary_max' => $job->salary_max,
                    'is_salary_negotiable' => $job->is_salary_negotiable,
                    'as_per_companies_policy' => $job->as_per_companies_policy,
                    'application_deadline' => $job->application_deadline,
                    'views_count' => $job->views_count ?? 0,
                    'applications_count' => $job->applications_count ?? 0,
                    'category' => $job->category ? [
                        'id' => $job->category->id,
                        'name' => $job->category->name,
                        'slug' => $job->category->slug,
                    ] : null,
                    'locations' => $job->locations->map(function ($location) {
                        return [
                            'id' => $location->id,
                            'name' => $location->name,
                        ];
                    }),
                ];
            });

        return Inertia::render('Backend/PublicJobListing/Show', [
            'jobListing' => [
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
                'locations' => $jobListing->locations->map(function ($location) {
                    return [
                        'id' => $location->id,
                        'name' => $location->name,
                    ];
                }),
                'employer' => $jobListing->employer ? [
                    'id' => $jobListing->employer->id,
                    'name' => $jobListing->employer->name,
                    'email' => $jobListing->employer->email,
                ] : null,
            ],
            'userData' => Auth::user(),
            'hasApplied' => $hasApplied,
            'existingApplication' => $existingApplication,
            'relatedJobs' => $relatedJobs,
            'applicationStats' => $applicationStats,
            'averageAtsScore' => $averageAtsScore,
        ]);
    }

    /**
     * Get popular jobs based on views
     */
    public function popular()
    {
        // Public API endpoint - no strict permission needed
        // But we can add optional authentication check if needed

        $popularJobs = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations'])
            ->withCount(['applications', 'views'])
            ->orderBy('views_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'slug' => $job->slug,
                    'job_type' => $job->job_type,
                    'salary_min' => $job->salary_min,
                    'salary_max' => $job->salary_max,
                    'views_count' => $job->views_count ?? 0,
                    'applications_count' => $job->applications_count ?? 0,
                    'category' => $job->category ? $job->category->name : null,
                    'locations' => $job->locations->pluck('name')->toArray(),
                ];
            });

        return response()->json($popularJobs);
    }

    /**
     * Get trending jobs based on recent applications
     */
    public function trending()
    {
        // Public API endpoint - no strict permission needed

        $trendingJobs = JobListing::where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->with(['category', 'locations'])
            ->withCount(['applications', 'views'])
            ->orderBy('applications_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'slug' => $job->slug,
                    'job_type' => $job->job_type,
                    'salary_min' => $job->salary_min,
                    'salary_max' => $job->salary_max,
                    'views_count' => $job->views_count ?? 0,
                    'applications_count' => $job->applications_count ?? 0,
                    'category' => $job->category ? $job->category->name : null,
                    'locations' => $job->locations->pluck('name')->toArray(),
                ];
            });

        return response()->json($trendingJobs);
    }
}
