<?php
// app/Http/Controllers/JobListing/JobListingController.php

namespace App\Http\Controllers\JobListing;

// Inertia
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\Application;
// Models
use App\Models\User;
use App\Models\Location;
use App\Models\JobListing;
use App\Models\JobCategory;
use App\Models\JobView;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class JobListingController extends Controller
{
    /**
     * ==========================================
     * PUBLIC METHODS (No permission checks)
     * ==========================================
     */

    /**
     * Display public job listings for applicants
     * Only shows active, non-deleted jobs with valid deadlines
     * Fully queryable with filters and sorting
     */
    public function publicIndex(Request $request)
    {
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
     * Display a single public job listing and register a view
     */
    public function publicShow(string $slug)
    {
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
     * Get popular jobs based on views (Public API)
     */
    public function publicPopular()
    {
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
     * Get trending jobs based on recent applications (Public API)
     */
    public function publicTrending()
    {
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

    /**
     * ==========================================
     * ADMIN METHODS (With permission checks)
     * ==========================================
     */

    /**
     * Display a listing of job listings with filtering and pagination (Admin)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to view job listings
        if (!$user->hasPermission('job_listings.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view job listings.');
        }

        // Start query with relationships
        $query = JobListing::withTrashed()
            ->with(['category', 'locations', 'employer'])
            ->withCount([
                'applications' => function ($q) {
                    $q->withTrashed(); // Include trashed applications in count
                },
                'views'
            ]);

        // Search by title or description
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filter by status (active/inactive)
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($request->status === 'trashed') {
                $query->onlyTrashed();
            }
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by job type
        if ($request->filled('job_type')) {
            $query->where('job_type', $request->job_type);
        }

        // Filter by experience level
        if ($request->filled('experience_level')) {
            $query->where('experience_level', $request->experience_level);
        }

        // Filter by location (many-to-many relationship)
        if ($request->filled('location_id')) {
            $query->whereHas('locations', function ($q) use ($request) {
                $q->where('locations.id', $request->location_id);
            });
        }

        // Filter by employer
        if ($request->filled('employer_id')) {
            $query->where('user_id', $request->employer_id);
        }

        // Filter by date range (created_at)
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Filter by deadline range
        if ($request->filled('deadline_from')) {
            $query->whereDate('application_deadline', '>=', $request->deadline_from);
        }
        if ($request->filled('deadline_to')) {
            $query->whereDate('application_deadline', '<=', $request->deadline_to);
        }

        // Filter by publish date range
        if ($request->filled('publish_from')) {
            $query->whereDate('publish_at', '>=', $request->publish_from);
        }
        if ($request->filled('publish_to')) {
            $query->whereDate('publish_at', '<=', $request->publish_to);
        }

        // Filter by salary range
        if ($request->filled('salary_min_filter')) {
            $query->where(function ($q) use ($request) {
                $q->where('salary_min', '>=', $request->salary_min_filter)
                    ->orWhere('salary_max', '>=', $request->salary_min_filter);
            });
        }
        if ($request->filled('salary_max_filter')) {
            $query->where('salary_max', '<=', $request->salary_max_filter);
        }

        // Filter jobs with/without applications
        if ($request->filled('has_applications')) {
            if ($request->has_applications === 'yes') {
                $query->has('applications');
            } elseif ($request->has_applications === 'no') {
                $query->doesntHave('applications');
            }
        }

        // Filter by minimum application count
        if ($request->filled('min_applications')) {
            $query->has('applications', '>=', $request->min_applications);
        }

        // Filter expired jobs
        if ($request->filled('expired')) {
            if ($request->expired === 'yes') {
                $query->where('application_deadline', '<', now());
            } elseif ($request->expired === 'no') {
                $query->where(function ($q) {
                    $q->whereNull('application_deadline')
                        ->orWhere('application_deadline', '>=', now());
                });
            }
        }

        // Filter published status
        if ($request->filled('published')) {
            if ($request->published === 'yes') {
                $query->where(function ($q) {
                    $q->whereNull('publish_at')
                        ->orWhere('publish_at', '<=', now());
                });
            } elseif ($request->published === 'no') {
                $query->whereNotNull('publish_at')
                    ->where('publish_at', '>', now());
            }
        }

        // Sorting
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        $allowedSortFields = ['id', 'title', 'created_at', 'updated_at', 'application_deadline', 'publish_at', 'is_active', 'views_count'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Pagination
        $perPage = $request->input('per_page', 7);
        $jobListings = $query->paginate($perPage)->through(function ($jobListing) {
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
                'description' => $jobListing->description,
                'requirements' => $jobListing->requirements,
                'application_deadline' => $jobListing->application_deadline,
                'publish_at' => $jobListing->publish_at,
                'is_active' => $jobListing->is_active,
                'created_at' => $jobListing->created_at,
                'updated_at' => $jobListing->updated_at,
                'deleted_at' => $jobListing->deleted_at,
                'views_count' => $jobListing->views_count ?? 0,
                'applications_count' => $jobListing->applications_count ?? 0,
                'views_count_total' => $jobListing->views()->count(),
                'category' => $jobListing->category,
                'locations' => $jobListing->locations,
                'employer' => $jobListing->employer,
            ];
        })->withQueryString();

        // Get filter options data for the frontend
        $filterOptions = [
            'categories' => JobCategory::active()->orderBy('name')->get(['id', 'name']),
            'job_types' => JobListing::$jobTypes,
            'experience_levels' => JobListing::$experienceLevels,
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
            'employers' => User::query()
                ->whereHas('roles', function ($q) {
                    $q->whereIn('slug', ['employer-admin', 'hr-manager', 'recruiter']);
                })
                ->orderBy('name')
                ->get(['id', 'name']),
        ];

        return Inertia::render('Backend/JobListings/Index', [
            'jobListings' => $jobListings,
            'activeJobs' => JobListing::where('is_active', true)->count(),
            'inactiveJobs' => JobListing::where('is_active', false)->count(),
            'deletedJobs' => JobListing::onlyTrashed()->count(),
            'totalViews' => JobListing::withCount('views')->get()->sum('views_count'),
            'totalJobs' => JobListing::withTrashed()->count(),
            'filters' => $request->all([
                'search',
                'status',
                'category_id',
                'job_type',
                'experience_level',
                'location_id',
                'employer_id',
                'date_from',
                'date_to',
                'deadline_from',
                'deadline_to',
                'publish_from',
                'publish_to',
                'sort_field',
                'sort_direction',
                'per_page',
                'has_applications',
                'min_applications',
                'expired',
                'published',
                'salary_min_filter',
                'salary_max_filter'
            ]),
            'filterOptions' => $filterOptions,
        ]);
    }

    /**
     * Show the form for creating a new job listing
     */
    public function create()
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.create')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to create job listings.');
        }

        $categories = JobCategory::active()->orderBy('name')->get();
        $locations = Location::active()->orderBy('name')->get();

        return Inertia::render('Backend/JobListings/Create', [
            'categories' => $categories,
            'locations' => $locations
        ]);
    }

    /**
     * Store a newly created job listing
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.store')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to create job listings.');
        }

        $validated = $request->validate([
            'title' => 'required|string|min:5|max:255',
            'category_id' => 'required|exists:job_categories,id',
            'location_ids' => 'required|array|min:1',
            'location_ids.*' => 'exists:locations,id',
            'job_type' => 'required|string|in:' . implode(',', JobListing::$jobTypes),
            'experience_level' => 'required|string|in:' . implode(',', JobListing::$experienceLevels),
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'is_salary_negotiable' => 'boolean',
            'as_per_companies_policy' => 'boolean',
            'education_requirement' => 'nullable|string|max:255',
            'education_details' => 'nullable|string|max:255',
            'application_deadline' => 'required|date|after_or_equal:today',
            'publish_at' => 'nullable|date|after_or_equal:today',
            'description' => 'required|string|min:50',
            'requirements' => 'required|string|min:50',
            'benefits' => 'nullable|array',
            'skills' => 'required|array|min:1',
            'responsibilities' => 'required|array|min:1',
            'keywords' => 'nullable|array',
            'is_active' => 'boolean',
            'required_linkedin_link' => 'boolean',
            'required_facebook_link' => 'boolean',
        ]);

        $data = [
            'title' => $validated['title'],
            'category_id' => $validated['category_id'],
            'job_type' => $validated['job_type'],
            'experience_level' => $validated['experience_level'],
            'salary_min' => $validated['salary_min'] ?? null,
            'salary_max' => $validated['salary_max'] ?? null,
            'is_salary_negotiable' => $validated['is_salary_negotiable'] ?? false,
            'as_per_companies_policy' => $validated['as_per_companies_policy'] ?? false,
            'education_requirement' => $validated['education_requirement'] ?? null,
            'education_details' => $validated['education_details'] ?? null,
            'application_deadline' => $validated['application_deadline'],
            'publish_at' => $validated['publish_at'] ?? null,
            'description' => $validated['description'],
            'requirements' => $validated['requirements'],
            'benefits' => $validated['benefits'] ?? [],
            'skills' => $validated['skills'],
            'responsibilities' => $validated['responsibilities'],
            'keywords' => $validated['keywords'] ?? [],
            'required_linkedin_link' => $validated['required_linkedin_link'] ?? false,
            'required_facebook_link' => $validated['required_facebook_link'] ?? false,
            'user_id' => Auth::id(),
            'views_count' => 0,
        ];

        $data['slug'] = $this->generateUniqueSlug($data['title']);
        $data['is_active'] = $this->determineInitialStatus($data);

        $jobListing = JobListing::create($data);

        if (isset($validated['location_ids']) && is_array($validated['location_ids'])) {
            $jobListing->locations()->sync($validated['location_ids']);
        }

        Log::info('Job listing created', [
            'job_id' => $jobListing->id,
            'title' => $jobListing->title,
            'user_id' => Auth::id()
        ]);

        return redirect()->route('backend.listing.index')
            ->with('success', 'Job listing created successfully');
    }

    /**
     * Display the specified job listing (Admin)
     */
    public function show(JobListing $jobListing)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.show')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view job details.');
        }

        $ipAddress = request()->ip();
        $alreadyViewed = JobView::where('job_listing_id', $jobListing->id)
            ->where('ip_address', $ipAddress)
            ->exists();

        if (!$alreadyViewed) {
            $jobListing->incrementViews();
            JobView::recordView(
                $jobListing->id,
                Auth::id(),
                $ipAddress
            );
        }

        $jobListing->load(['category', 'locations', 'employer']);

        $applications = $jobListing->applications()
            ->withTrashed()
            ->with(['user', 'applicantProfile'])
            ->latest()
            ->get();

        $applicationStats = [
            'total' => $applications->count(),
            'pending' => $applications->where('status', 'pending')->count(),
            'shortlisted' => $applications->where('status', 'shortlisted')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
            'hired' => $applications->where('status', 'hired')->count(),
        ];

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

        $recentApplications = $jobListing->applications()
            ->withTrashed()
            ->with(['user', 'applicantProfile'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($application) {
                return [
                    'id' => $application->id,
                    'name' => $application->name ?? $application->user?->name ?? 'N/A',
                    'email' => $application->email ?? $application->user?->email ?? 'N/A',
                    'status' => $application->status,
                    'ats_score' => $application->isAtsCompleted() && $application->ats_score
                        ? ($application->ats_score['percentage'] ?? null)
                        : null,
                    'created_at' => $application->created_at,
                ];
            });

        $totalViews = $jobListing->views()->count();

        return Inertia::render('Backend/JobListings/Show', [
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
                'created_at' => $jobListing->created_at,
                'updated_at' => $jobListing->updated_at,
                'deleted_at' => $jobListing->deleted_at,
                'category' => $jobListing->category,
                'locations' => $jobListing->locations,
                'employer' => $jobListing->employer,
            ],
            'applicationStats' => $applicationStats,
            'averageAtsScore' => $averageAtsScore,
            'recentApplications' => $recentApplications,
            'totalViews' => $totalViews,
        ]);
    }

    /**
     * Show the form for editing the specified job listing
     */
    public function edit(JobListing $jobListing)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.edit')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to edit job listings.');
        }

        $categories = JobCategory::active()->orderBy('name')->get();
        $locations = Location::active()->orderBy('name')->get();

        $jobListing->load('locations');
        $locationIds = $jobListing->locations->pluck('id')->toArray();

        $formData = [
            'id' => $jobListing->id,
            'title' => $jobListing->title,
            'category_id' => $jobListing->category_id,
            'location_ids' => $locationIds,
            'job_type' => $jobListing->job_type,
            'experience_level' => $jobListing->experience_level,
            'salary_min' => $jobListing->salary_min,
            'salary_max' => $jobListing->salary_max,
            'is_salary_negotiable' => $jobListing->is_salary_negotiable,
            'as_per_companies_policy' => $jobListing->as_per_companies_policy,
            'education_requirement' => $jobListing->education_requirement,
            'education_details' => $jobListing->education_details,
            'application_deadline' => $jobListing->application_deadline ? $jobListing->application_deadline->format('Y-m-d') : null,
            'publish_at' => $jobListing->publish_at ? $jobListing->publish_at->format('Y-m-d') : null,
            'description' => $jobListing->description,
            'requirements' => $jobListing->requirements,
            'benefits' => $jobListing->benefits ?? [],
            'skills' => $jobListing->skills ?? [],
            'responsibilities' => $jobListing->responsibilities ?? [],
            'keywords' => $jobListing->keywords ?? [],
            'is_active' => $jobListing->is_active,
            'required_linkedin_link' => $jobListing->required_linkedin_link,
            'required_facebook_link' => $jobListing->required_facebook_link,
        ];

        return Inertia::render('Backend/JobListings/Edit', [
            'jobListing' => $formData,
            'categories' => $categories,
            'locations' => $locations,
        ]);
    }

    /**
     * Update the specified job listing
     */
    public function update(Request $request, JobListing $jobListing)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.update')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to update job listings.');
        }

        $validated = $request->validate([
            'title' => 'required|string|min:5|max:255',
            'category_id' => 'required|exists:job_categories,id',
            'location_ids' => 'required|array|min:1',
            'location_ids.*' => 'exists:locations,id',
            'job_type' => 'required|string|in:' . implode(',', JobListing::$jobTypes),
            'experience_level' => 'required|string|in:' . implode(',', JobListing::$experienceLevels),
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'is_salary_negotiable' => 'boolean',
            'as_per_companies_policy' => 'boolean',
            'education_requirement' => 'nullable|string|max:255',
            'education_details' => 'nullable|string|max:255',
            'application_deadline' => 'required|date',
            'publish_at' => 'nullable|date',
            'description' => 'required|string|min:50',
            'requirements' => 'required|string|min:50',
            'benefits' => 'nullable|array',
            'skills' => 'required|array|min:1',
            'responsibilities' => 'required|array|min:1',
            'keywords' => 'nullable|array',
            'is_active' => 'boolean',
            'required_linkedin_link' => 'boolean',
            'required_facebook_link' => 'boolean',
        ]);

        $data = [
            'title' => $validated['title'],
            'category_id' => $validated['category_id'],
            'job_type' => $validated['job_type'],
            'experience_level' => $validated['experience_level'],
            'salary_min' => $validated['salary_min'] ?? null,
            'salary_max' => $validated['salary_max'] ?? null,
            'is_salary_negotiable' => $validated['is_salary_negotiable'] ?? false,
            'as_per_companies_policy' => $validated['as_per_companies_policy'] ?? false,
            'education_requirement' => $validated['education_requirement'] ?? null,
            'education_details' => $validated['education_details'] ?? null,
            'application_deadline' => $validated['application_deadline'],
            'publish_at' => $validated['publish_at'] ?? null,
            'description' => $validated['description'],
            'requirements' => $validated['requirements'],
            'benefits' => $validated['benefits'] ?? [],
            'skills' => $validated['skills'],
            'responsibilities' => $validated['responsibilities'],
            'keywords' => $validated['keywords'] ?? [],
            'required_linkedin_link' => $validated['required_linkedin_link'] ?? false,
            'required_facebook_link' => $validated['required_facebook_link'] ?? false,
        ];

        if ($jobListing->title !== $data['title']) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], $jobListing->id);
        }

        if (!isset($validated['is_active'])) {
            $data['is_active'] = $this->determineStatusFromDates($data, $jobListing);
        } else {
            $data['is_active'] = $validated['is_active'];
        }

        $jobListing->update($data);

        if (isset($validated['location_ids']) && is_array($validated['location_ids'])) {
            $jobListing->locations()->sync($validated['location_ids']);
        }

        Log::info('Job listing updated', [
            'job_id' => $jobListing->id,
            'title' => $jobListing->title,
            'user_id' => Auth::id()
        ]);

        return redirect()->route('backend.listing.index')
            ->with('success', 'Job listing updated successfully');
    }

    /**
     * Remove the specified job listing (soft delete) - WITH applications
     */
    public function destroy(JobListing $jobListing)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.destroy')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to delete job listings.');
        }

        DB::beginTransaction();

        try {
            $applicationsCount = $jobListing->applications()->count();

            if ($applicationsCount > 0) {
                $jobListing->applications()->delete();
                Log::info('Job listing and associated applications soft deleted', [
                    'job_id' => $jobListing->id,
                    'job_title' => $jobListing->title,
                    'applications_count' => $applicationsCount,
                    'deleted_by' => Auth::id()
                ]);
            }

            $jobListing->delete();

            DB::commit();

            return redirect()->route('backend.listing.index')
                ->with('success', "Job listing and {$applicationsCount} associated application(s) moved to trash.");
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to delete job listing with applications', [
                'job_id' => $jobListing->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->route('backend.listing.index')
                ->with('error', 'Failed to delete job listing: ' . $e->getMessage());
        }
    }

    /**
     * Toggle active status
     */
    public function toggleActive(JobListing $jobListing)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.toggle_active')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to change job status.');
        }

        $newStatus = !$jobListing->is_active;
        $jobListing->update(['is_active' => $newStatus]);
        $status = $newStatus ? 'activated' : 'deactivated';

        Log::info('Job listing status toggled', [
            'job_id' => $jobListing->id,
            'new_status' => $newStatus,
            'user_id' => Auth::id()
        ]);

        return back()->with('success', "Job listing {$status} successfully");
    }

    /**
     * Display applications for a job listing
     */
    public function applications(JobListing $jobListing)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.applications')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view applications.');
        }

        $applications = $jobListing->applications()
            ->withTrashed()
            ->with(['user', 'applicantProfile'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $stats = [
            'total' => $jobListing->applications()->withTrashed()->count(),
            'pending' => $jobListing->applications()->withTrashed()->where('status', 'pending')->count(),
            'shortlisted' => $jobListing->applications()->withTrashed()->where('status', 'shortlisted')->count(),
            'rejected' => $jobListing->applications()->withTrashed()->where('status', 'rejected')->count(),
            'hired' => $jobListing->applications()->withTrashed()->where('status', 'hired')->count(),
        ];

        return Inertia::render('Backend/JobListings/Applications', [
            'jobListing' => $jobListing,
            'applications' => $applications,
            'stats' => $stats,
        ]);
    }

    /**
     * Update all job listing statuses based on dates
     */
    public function updateJobStatuses()
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.update_statuses')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $now = Carbon::now();

        Log::info('Running job status update at ' . $now);

        $activated = JobListing::where('is_active', false)
            ->whereNotNull('publish_at')
            ->where('publish_at', '<=', $now)
            ->update(['is_active' => true]);

        $deactivated = JobListing::where('is_active', true)
            ->whereNotNull('application_deadline')
            ->where('application_deadline', '<', $now)
            ->update(['is_active' => false]);

        Log::info("Job status update completed: {$activated} activated, {$deactivated} deactivated");

        return ['activated' => $activated, 'deactivated' => $deactivated];
    }

    /**
     * Restore a soft-deleted job listing and its applications
     */
    public function restore(int $id)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.restore')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to restore job listings.');
        }

        $jobListing = JobListing::withTrashed()->findOrFail($id);

        if (!$jobListing->trashed()) {
            return redirect()->route('backend.listing.index')
                ->with('error', 'This job listing is not in trash.');
        }

        DB::beginTransaction();

        try {
            $jobListing->restore();

            $restoredApplications = Application::onlyTrashed()
                ->where('job_listing_id', $jobListing->id)
                ->restore();

            DB::commit();

            Log::info('Job listing and applications restored', [
                'job_id' => $jobListing->id,
                'title' => $jobListing->title,
                'applications_restored' => $restoredApplications,
                'restored_by' => Auth::id()
            ]);

            return redirect()->route('backend.listing.index')
                ->with('success', "Job listing and {$restoredApplications} application(s) restored successfully.");
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to restore job listing', [
                'job_id' => $jobListing->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->route('backend.listing.index')
                ->with('error', 'Failed to restore job listing: ' . $e->getMessage());
        }
    }

    /**
     * Permanently delete a soft-deleted job listing and all related data
     */
    public function forceDelete(int $id)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.force_delete')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to permanently delete job listings.');
        }

        $jobListing = JobListing::withTrashed()->findOrFail($id);

        if (!$jobListing->trashed()) {
            return redirect()->route('backend.listing.index')
                ->with('error', 'Only trashed job listings can be permanently deleted.');
        }

        DB::beginTransaction();

        try {
            $applications = Application::withTrashed()
                ->where('job_listing_id', $jobListing->id)
                ->get();

            foreach ($applications as $application) {
                $resumePath = $application->getActualResumePath();
                if ($resumePath && Storage::disk('public')->exists($resumePath)) {
                    Storage::disk('public')->delete($resumePath);
                    Log::info('Resume file deleted', [
                        'application_id' => $application->id,
                        'resume_path' => $resumePath
                    ]);
                }

                $application->forceDelete();
            }

            $jobListing->locations()->detach();
            $jobListing->forceDelete();

            DB::commit();

            Log::info('Job listing permanently deleted', [
                'job_id' => $jobListing->id,
                'title' => $jobListing->title,
                'applications_deleted' => $applications->count(),
                'deleted_by' => Auth::id()
            ]);

            return redirect()->route('backend.listing.index')
                ->with('success', "Job listing and {$applications->count()} application(s) permanently deleted.");
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to force delete job listing', [
                'job_id' => $jobListing->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->route('backend.listing.index')
                ->with('error', 'Failed to permanently delete job listing: ' . $e->getMessage());
        }
    }

    /**
     * Bulk activate job listings
     */
    public function bulkActivate(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.bulk_activate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk activate jobs.');
        }

        $validated = $request->validate([
            'job_ids' => 'required|array',
            'job_ids.*' => 'exists:job_listings,id'
        ]);

        $count = JobListing::whereIn('id', $validated['job_ids'])
            ->whereNull('deleted_at')
            ->update(['is_active' => true]);

        return redirect()->back()->with('success', "{$count} job listing(s) activated successfully.");
    }

    /**
     * Bulk deactivate job listings
     */
    public function bulkDeactivate(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.bulk_deactivate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk deactivate jobs.');
        }

        $validated = $request->validate([
            'job_ids' => 'required|array',
            'job_ids.*' => 'exists:job_listings,id'
        ]);

        $count = JobListing::whereIn('id', $validated['job_ids'])
            ->whereNull('deleted_at')
            ->update(['is_active' => false]);

        return redirect()->back()->with('success', "{$count} job listing(s) deactivated successfully.");
    }

    /**
     * Bulk delete job listings (soft delete)
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete jobs.');
        }

        $validated = $request->validate([
            'job_ids' => 'required|array',
            'job_ids.*' => 'exists:job_listings,id'
        ]);

        $jobsWithApplications = JobListing::whereIn('id', $validated['job_ids'])
            ->whereHas('applications')
            ->count();

        if ($jobsWithApplications > 0) {
            return redirect()->back()
                ->with('error', "{$jobsWithApplications} job listing(s) have applications and cannot be deleted. Please deactivate them instead.");
        }

        $count = JobListing::whereIn('id', $validated['job_ids'])
            ->whereNull('deleted_at')
            ->delete();

        Log::info('Bulk job listing delete', [
            'job_ids' => $validated['job_ids'],
            'count' => $count,
            'user_id' => Auth::id()
        ]);

        return redirect()->back()->with('success', "{$count} job listing(s) moved to trash.");
    }

    /**
     * Display statistics dashboard for job listings
     */
    public function statistics(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('job_listings.statistics')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view statistics.');
        }

        // Get date range filter
        $dateRange = $request->get('date_range', 'all');
        $startDate = $this->getStartDateFromRange($dateRange);

        // ==========================================
        // JOB LISTINGS STATISTICS
        // ==========================================

        $totalJobsQuery = JobListing::query();
        $activeJobsQuery = JobListing::where('is_active', true)->whereNull('deleted_at');
        $inactiveJobsQuery = JobListing::where('is_active', false)->whereNull('deleted_at');
        $trashedJobsQuery = JobListing::onlyTrashed();

        $jobsByType = JobListing::select('job_type', DB::raw('count(*) as total'))
            ->whereNull('deleted_at')
            ->groupBy('job_type')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => ucfirst(str_replace('-', ' ', $item->job_type)),
                    'value' => $item->total,
                    'color' => $this->getColorForJobType($item->job_type)
                ];
            });

        $jobsByExperience = JobListing::select('experience_level', DB::raw('count(*) as total'))
            ->whereNull('deleted_at')
            ->groupBy('experience_level')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => ucfirst(str_replace('-', ' ', $item->experience_level)),
                    'value' => $item->total,
                    'color' => $this->getColorForExperienceLevel($item->experience_level)
                ];
            });

        $jobsByCategory = JobCategory::withCount(['jobListings' => function ($query) {
            $query->whereNull('deleted_at');
        }])
            ->orderBy('job_listings_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($category) {
                return [
                    'name' => $category->name,
                    'value' => $category->job_listings_count,
                    'color' => $this->getRandomColor($category->id)
                ];
            });

        $jobsByLocation = Location::withCount(['jobListings' => function ($query) {
            $query->whereNull('deleted_at');
        }])
            ->orderBy('job_listings_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($location) {
                return [
                    'name' => $location->name,
                    'value' => $location->job_listings_count,
                    'color' => $this->getRandomColor($location->id)
                ];
            });

        $monthlyJobs = JobListing::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('count(*) as total')
        )
            ->whereNull('deleted_at')
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get()
            ->map(function ($item) {
                $date = Carbon::createFromDate($item->year, $item->month, 1);
                return [
                    'month' => $date->format('M Y'),
                    'total' => $item->total
                ];
            });

        // ==========================================
        // APPLICATIONS STATISTICS
        // ==========================================

        $totalApplicationsQuery = Application::query();
        $pendingApplicationsQuery = Application::where('status', 'pending');
        $shortlistedApplicationsQuery = Application::where('status', 'shortlisted');
        $rejectedApplicationsQuery = Application::where('status', 'rejected');
        $hiredApplicationsQuery = Application::where('status', 'hired');

        if ($startDate) {
            $totalApplicationsQuery->where('created_at', '>=', $startDate);
            $pendingApplicationsQuery->where('created_at', '>=', $startDate);
            $shortlistedApplicationsQuery->where('created_at', '>=', $startDate);
            $rejectedApplicationsQuery->where('created_at', '>=', $startDate);
            $hiredApplicationsQuery->where('created_at', '>=', $startDate);

            $totalJobsQuery->where('created_at', '>=', $startDate);
            $activeJobsQuery->where('created_at', '>=', $startDate);
            $inactiveJobsQuery->where('created_at', '>=', $startDate);
            $trashedJobsQuery->where('deleted_at', '>=', $startDate);
        }

        $applicationsByStatus = [
            [
                'name' => 'Pending',
                'value' => $pendingApplicationsQuery->count(),
                'color' => '#f59e0b'
            ],
            [
                'name' => 'Shortlisted',
                'value' => $shortlistedApplicationsQuery->count(),
                'color' => '#3b82f6'
            ],
            [
                'name' => 'Rejected',
                'value' => $rejectedApplicationsQuery->count(),
                'color' => '#ef4444'
            ],
            [
                'name' => 'Hired',
                'value' => $hiredApplicationsQuery->count(),
                'color' => '#10b981'
            ]
        ];

        $monthlyApplications = Application::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('count(*) as total')
        )
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get()
            ->map(function ($item) {
                $date = Carbon::createFromDate($item->year, $item->month, 1);
                return [
                    'month' => $date->format('M Y'),
                    'total' => $item->total
                ];
            });

        $applicationsByJob = JobListing::withCount('applications')
            ->orderBy('applications_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($job) {
                return [
                    'title' => Str::limit($job->title, 30),
                    'count' => $job->applications_count,
                    'color' => $this->getRandomColor($job->id)
                ];
            });

        $atsScoreByJobType = JobListing::select('job_type', DB::raw('AVG(JSON_EXTRACT(ats_score, "$.percentage")) as avg_score'))
            ->join('applications', 'job_listings.id', '=', 'applications.job_listing_id')
            ->whereNotNull('applications.ats_score')
            ->whereNull('job_listings.deleted_at')
            ->groupBy('job_type')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => ucfirst(str_replace('-', ' ', $item->job_type)),
                    'score' => round($item->avg_score ?? 0, 2)
                ];
            });

        // ==========================================
        // EMPLOYER STATISTICS
        // ==========================================

        $topEmployers = User::query()
            ->whereHas('roles', function ($q) {
                $q->whereIn('slug', ['employer-admin', 'hr-manager', 'recruiter']);
            })
            ->withCount(['jobListings' => function ($query) {
                $query->whereNull('deleted_at');
            }])
            ->orderBy('job_listings_count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($employer) {
                return [
                    'name' => $employer->name,
                    'job_count' => $employer->job_listings_count,
                    'avatar' => $employer->google_avatar ?? null
                ];
            });

        $topEmployersByApplications = User::query()
            ->whereHas('roles', function ($q) {
                $q->whereIn('slug', ['employer-admin', 'hr-manager', 'recruiter']);
            })
            ->withCount(['jobListings' => function ($query) {
                $query->withCount('applications');
            }])
            ->get()
            ->map(function ($employer) {
                $applicationCount = $employer->jobListings->sum('applications_count');
                return [
                    'name' => $employer->name,
                    'application_count' => $applicationCount
                ];
            })
            ->sortByDesc('application_count')
            ->take(10)
            ->values();

        // ==========================================
        // SUMMARY STATISTICS
        // ==========================================

        $summary = [
            'total_jobs' => $totalJobsQuery->count(),
            'active_jobs' => $activeJobsQuery->count(),
            'inactive_jobs' => $inactiveJobsQuery->count(),
            'trashed_jobs' => $trashedJobsQuery->count(),
            'total_applications' => $totalApplicationsQuery->count(),
            'pending_applications' => $pendingApplicationsQuery->count(),
            'shortlisted_applications' => $shortlistedApplicationsQuery->count(),
            'rejected_applications' => $rejectedApplicationsQuery->count(),
            'hired_applications' => $hiredApplicationsQuery->count(),
            'conversion_rate' => $this->calculateConversionRate($totalApplicationsQuery->count(), $hiredApplicationsQuery->count()),
        ];

        $previousStartDate = $startDate ? Carbon::parse($startDate)->subDays($this->getDateRangeDays($dateRange)) : null;
        $previousSummary = $this->getPreviousPeriodStats($previousStartDate, $dateRange);

        $trends = [
            'total_jobs' => $this->calculateTrend($previousSummary['total_jobs'], $summary['total_jobs']),
            'total_applications' => $this->calculateTrend($previousSummary['total_applications'], $summary['total_applications']),
            'conversion_rate' => $this->calculateTrend($previousSummary['conversion_rate'], $summary['conversion_rate']),
        ];

        return Inertia::render('Backend/Statistics/Index', [
            'summary' => $summary,
            'trends' => $trends,
            'jobsByType' => $jobsByType,
            'jobsByExperience' => $jobsByExperience,
            'jobsByCategory' => $jobsByCategory,
            'jobsByLocation' => $jobsByLocation,
            'monthlyJobs' => $monthlyJobs,
            'applicationsByStatus' => $applicationsByStatus,
            'monthlyApplications' => $monthlyApplications,
            'applicationsByJob' => $applicationsByJob,
            'atsScoreByJobType' => $atsScoreByJobType,
            'topEmployers' => $topEmployers,
            'topEmployersByApplications' => $topEmployersByApplications,
            'dateRange' => $dateRange,
            'filters' => $request->only(['date_range']),
        ]);
    }

    /**
     * ==========================================
     * HELPER METHODS (Shared)
     * ==========================================
     */

    /**
     * Get start date based on date range
     */
    protected function getStartDateFromRange(string $dateRange)
    {
        switch ($dateRange) {
            case 'today':
                return now()->startOfDay();
            case 'week':
                return now()->subDays(7);
            case 'month':
                return now()->subMonth();
            case 'year':
                return now()->subYear();
            default:
                return null;
        }
    }

    /**
     * Get number of days for a date range
     */
    protected function getDateRangeDays(string $dateRange)
    {
        switch ($dateRange) {
            case 'today':
                return 1;
            case 'week':
                return 7;
            case 'month':
                return 30;
            case 'year':
                return 365;
            default:
                return 30;
        }
    }

    /**
     * Get previous period stats
     */
    protected function getPreviousPeriodStats(?Carbon $previousStartDate, string $dateRange): array
    {
        if (!$previousStartDate) {
            return [
                'total_jobs' => 0,
                'total_applications' => 0,
                'conversion_rate' => 0,
            ];
        }

        $days = $this->getDateRangeDays($dateRange);
        $previousEndDate = $previousStartDate->copy()->addDays($days);

        return [
            'total_jobs' => JobListing::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count(),
            'total_applications' => Application::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count(),
            'conversion_rate' => $this->calculateConversionRate(
                Application::whereBetween('created_at', [$previousStartDate, $previousEndDate])->count(),
                Application::where('status', 'hired')->whereBetween('created_at', [$previousStartDate, $previousEndDate])->count()
            ),
        ];
    }

    /**
     * Calculate conversion rate (hired / total applications)
     */
    protected function calculateConversionRate(int|float $totalApplications, int|float $hiredApplications)
    {
        if ($totalApplications == 0) {
            return 0;
        }
        return round(($hiredApplications / $totalApplications) * 100, 2);
    }

    /**
     * Calculate trend percentage
     */
    protected function calculateTrend(int|float $previous, int|float $current)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }
        return round((($current - $previous) / $previous) * 100, 2);
    }

    /**
     * Get color for job type
     */
    protected function getColorForJobType(string $jobType)
    {
        $colors = [
            'full-time' => '#3b82f6',
            'part-time' => '#f59e0b',
            'contract' => '#ef4444',
            'internship' => '#10b981',
            'remote' => '#8b5cf6',
            'hybrid' => '#ec4899',
        ];

        return $colors[$jobType] ?? '#6b7280';
    }

    /**
     * Get color for experience level
     */
    protected function getColorForExperienceLevel(string $level)
    {
        $colors = [
            'entry' => '#10b981',
            'junior' => '#3b82f6',
            'mid-level' => '#f59e0b',
            'senior' => '#ef4444',
            'lead' => '#8b5cf6',
            'executive' => '#ec4899',
        ];

        return $colors[$level] ?? '#6b7280';
    }

    /**
     * Get random color based on ID
     */
    protected function getRandomColor(int $id)
    {
        $colors = [
            '#3b82f6',
            '#ef4444',
            '#10b981',
            '#f59e0b',
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
            '#6366f1',
            '#14b8a6',
            '#f97316',
            '#d946ef',
            '#0ea5e9',
            '#eab308',
            '#22c55e',
            '#a855f7'
        ];

        return $colors[$id % count($colors)];
    }

    /**
     * Generate a unique slug for a job listing
     */
    protected function generateUniqueSlug(string $title, $excludeId = null)
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        $query = JobListing::where('slug', $slug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        while ($query->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $query = JobListing::where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
            $counter++;
        }

        return $slug;
    }

    /**
     * Determine initial status when creating a new job
     */
    protected function determineInitialStatus(array $data)
    {
        $now = Carbon::now();

        if (isset($data['is_active'])) {
            return filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        if (isset($data['application_deadline']) && $data['application_deadline']) {
            $deadline = Carbon::parse($data['application_deadline']);
            if ($deadline < $now) {
                return false;
            }
        }

        if (isset($data['publish_at']) && $data['publish_at']) {
            $publishDate = Carbon::parse($data['publish_at']);
            if ($publishDate > $now) {
                return false;
            }
        }

        return true;
    }

    /**
     * Determine status from dates when updating a job
     */
    protected function determineStatusFromDates(array $data, JobListing $existingJob)
    {
        $now = Carbon::now();

        $deadline = isset($data['application_deadline']) && $data['application_deadline']
            ? Carbon::parse($data['application_deadline'])
            : ($existingJob->application_deadline ? Carbon::parse($existingJob->application_deadline) : null);

        $publishDate = isset($data['publish_at']) && $data['publish_at']
            ? Carbon::parse($data['publish_at'])
            : ($existingJob->publish_at ? Carbon::parse($existingJob->publish_at) : null);

        if ($deadline && $deadline < $now) {
            return false;
        }

        if ($publishDate && $publishDate > $now) {
            return false;
        }

        return true;
    }
}
