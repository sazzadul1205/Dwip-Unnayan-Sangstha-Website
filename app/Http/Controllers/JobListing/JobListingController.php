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

class JobListingController extends Controller
{
    /**
     * Display a listing of job listings with filtering and pagination
     */
    public function index(Request $request)
    {
        // Start query with relationships
        $query = JobListing::withTrashed()
            ->with(['category', 'locations', 'employer'])
            ->withCount([
                'applications',
                'views' // Add views count
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

        // Allowed sort fields to prevent SQL injection
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
            'employers' => User::where('role', 'employer')->get(['id', 'name']),
        ];

        return Inertia::render('Backend/JobListings/Index', [
            'jobListings' => $jobListings,
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
        // Validate the request
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

        // Prepare data for creation
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

        // Generate unique slug (model will auto-generate, but we can override)
        $data['slug'] = $this->generateUniqueSlug($data['title']);

        // Determine initial status
        $data['is_active'] = $this->determineInitialStatus($data);

        // Create the job listing
        $jobListing = JobListing::create($data);

        // Handle locations relationship (many-to-many)
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
     * Display the specified job listing
     */
    public function show(JobListing $jobListing)
    {
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

        // Load relationships
        $jobListing->load(['category', 'locations', 'employer']);

        // Get application stats with ATS scores
        $applications = $jobListing->applications()
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

        // Calculate average ATS score (only for completed ATS calculations)
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

        // Get recent applications with ATS scores (limit 10 for show page)
        $recentApplications = $jobListing->applications()
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

        // Get total views count
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
        $categories = JobCategory::active()->orderBy('name')->get();
        $locations = Location::active()->orderBy('name')->get();

        // Get current location IDs for the job listing
        $jobListing->load('locations');
        $locationIds = $jobListing->locations->pluck('id')->toArray();

        // Prepare form data with all fields
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
        // Validate the request
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

        // Prepare data for update
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

        // Update slug if title changed
        if ($jobListing->title !== $data['title']) {
            $data['slug'] = $this->generateUniqueSlug($data['title'], $jobListing->id);
        }

        // Apply automatic status update based on dates if is_active is not explicitly set
        if (!isset($validated['is_active'])) {
            $data['is_active'] = $this->determineStatusFromDates($data, $jobListing);
        } else {
            $data['is_active'] = $validated['is_active'];
        }

        $jobListing->update($data);

        // Handle locations relationship (many-to-many)
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
     * Remove the specified job listing (soft delete)
     */
    public function destroy(JobListing $jobListing)
    {
        // Check if there are applications before deleting
        $applicationsCount = $jobListing->applications()->count();

        if ($applicationsCount > 0) {
            return redirect()->route('backend.listing.index')
                ->with('error', "Cannot delete job listing with {$applicationsCount} existing application(s). Consider deactivating it instead.");
        }

        $jobListing->delete();

        Log::info('Job listing deleted', [
            'job_id' => $jobListing->id,
            'title' => $jobListing->title,
            'user_id' => Auth::id()
        ]);

        return redirect()->route('backend.listing.index')
            ->with('success', 'Job listing moved to trash');
    }

    /**
     * Toggle active status
     */
    public function toggleActive(JobListing $jobListing)
    {
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
        $applications = $jobListing->applications()
            ->with(['user', 'applicantProfile'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $stats = [
            'total' => $jobListing->applications()->count(),
            'pending' => $jobListing->applications()->where('status', 'pending')->count(),
            'shortlisted' => $jobListing->applications()->where('status', 'shortlisted')->count(),
            'rejected' => $jobListing->applications()->where('status', 'rejected')->count(),
            'hired' => $jobListing->applications()->where('status', 'hired')->count(),
        ];

        return Inertia::render('Backend/JobListings/Applications', [
            'jobListing' => $jobListing,
            'applications' => $applications,
            'stats' => $stats,
        ]);
    }

    /**
     * Update all job listing statuses based on dates
     * This can be called via a scheduled task or manually
     */
    public function updateJobStatuses()
    {
        $now = Carbon::now();

        Log::info('Running job status update at ' . $now);

        // Auto-activate jobs that have reached their publish date
        $activated = JobListing::where('is_active', false)
            ->whereNotNull('publish_at')
            ->where('publish_at', '<=', $now)
            ->update(['is_active' => true]);

        // Auto-deactivate jobs that have passed their application deadline
        $deactivated = JobListing::where('is_active', true)
            ->whereNotNull('application_deadline')
            ->where('application_deadline', '<', $now)
            ->update(['is_active' => false]);

        Log::info("Job status update completed: {$activated} activated, {$deactivated} deactivated");

        return ['activated' => $activated, 'deactivated' => $deactivated];
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

        // If is_active is explicitly set in the request, use that
        if (isset($data['is_active'])) {
            return filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        // Check if there's an application deadline that's already passed
        if (isset($data['application_deadline']) && $data['application_deadline']) {
            $deadline = Carbon::parse($data['application_deadline']);
            if ($deadline < $now) {
                return false; // Job is already expired
            }
        }

        // Check publish date
        if (isset($data['publish_at']) && $data['publish_at']) {
            $publishDate = Carbon::parse($data['publish_at']);

            // If publish date is in the future, keep inactive until it arrives
            if ($publishDate > $now) {
                return false;
            }
        }

        // Default to active
        return true;
    }

    /**
     * Determine status from dates when updating a job
     */
    protected function determineStatusFromDates(array $data, JobListing $existingJob)
    {
        $now = Carbon::now();

        // Use new deadline if provided, otherwise use existing
        $deadline = isset($data['application_deadline']) && $data['application_deadline']
            ? Carbon::parse($data['application_deadline'])
            : ($existingJob->application_deadline ? Carbon::parse($existingJob->application_deadline) : null);

        // Use new publish date if provided, otherwise use existing
        $publishDate = isset($data['publish_at']) && $data['publish_at']
            ? Carbon::parse($data['publish_at'])
            : ($existingJob->publish_at ? Carbon::parse($existingJob->publish_at) : null);

        // Check if deadline is passed
        if ($deadline && $deadline < $now) {
            return false;
        }

        // Check if publish date is in the future
        if ($publishDate && $publishDate > $now) {
            return false;
        }

        // Default to active
        return true;
    }

    /**
     * Restore a soft-deleted job listing
     */
    public function restore(int $id)
    {
        $jobListing = JobListing::withTrashed()->findOrFail($id);

        // Check if it's actually soft-deleted
        if (!$jobListing->trashed()) {
            return redirect()->route('backend.listing.index')
                ->with('error', 'This job listing is not in trash.');
        }

        // Check if restore is valid based on dates
        $now = Carbon::now();
        if ($jobListing->application_deadline && $jobListing->application_deadline < $now) {
            return redirect()->route('backend.listing.index')
                ->with('error', 'Cannot restore job because the application deadline has passed.');
        }

        $jobListing->restore();

        Log::info('Job listing restored', [
            'job_id' => $jobListing->id,
            'title' => $jobListing->title,
            'user_id' => Auth::id()
        ]);

        return redirect()->route('backend.listing.index')
            ->with('success', 'Job listing restored successfully.');
    }

    /**
     * Permanently delete a soft-deleted job listing
     */
    public function forceDelete(int $id)
    {
        $jobListing = JobListing::withTrashed()->findOrFail($id);

        if (!$jobListing->trashed()) {
            return redirect()->route('backend.listing.index')
                ->with('error', 'Only trashed job listings can be permanently deleted.');
        }

        // Detach locations before force deleting
        $jobListing->locations()->detach();

        $jobListing->forceDelete();

        Log::info('Job listing permanently deleted', [
            'job_id' => $jobListing->id,
            'title' => $jobListing->title,
            'user_id' => Auth::id()
        ]);

        return redirect()->route('backend.listing.index')
            ->with('success', 'Job listing permanently deleted.');
    }

    /**
     * Bulk activate job listings
     */
    public function bulkActivate(Request $request)
    {
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
        $validated = $request->validate([
            'job_ids' => 'required|array',
            'job_ids.*' => 'exists:job_listings,id'
        ]);

        // Check if any jobs have applications
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
        // Get date range filter
        $dateRange = $request->get('date_range', 'all');
        $startDate = $this->getStartDateFromRange($dateRange);

        // ==========================================
        // JOB LISTINGS STATISTICS
        // ==========================================

        // Total jobs query
        $totalJobsQuery = JobListing::query();
        $activeJobsQuery = JobListing::where('is_active', true)->whereNull('deleted_at');
        $inactiveJobsQuery = JobListing::where('is_active', false)->whereNull('deleted_at');
        $trashedJobsQuery = JobListing::onlyTrashed();

        // Jobs by type
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

        // Jobs by experience level
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

        // Jobs by category (top 10)
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

        // Jobs by location (top 10)
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

        // Monthly job creation trend (last 12 months)
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

        // Total applications
        $totalApplicationsQuery = Application::query();
        $pendingApplicationsQuery = Application::where('status', 'pending');
        $shortlistedApplicationsQuery = Application::where('status', 'shortlisted');
        $rejectedApplicationsQuery = Application::where('status', 'rejected');
        $hiredApplicationsQuery = Application::where('status', 'hired');

        // Apply date filter if set
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

        // Applications by status
        $applicationsByStatus = [
            [
                'name' => 'Pending',
                'value' => $pendingApplicationsQuery->count(),
                'color' => '#f59e0b' // Amber
            ],
            [
                'name' => 'Shortlisted',
                'value' => $shortlistedApplicationsQuery->count(),
                'color' => '#3b82f6' // Blue
            ],
            [
                'name' => 'Rejected',
                'value' => $rejectedApplicationsQuery->count(),
                'color' => '#ef4444' // Red
            ],
            [
                'name' => 'Hired',
                'value' => $hiredApplicationsQuery->count(),
                'color' => '#10b981' // Green
            ]
        ];

        // Monthly application trend (last 12 months)
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

        // Applications by job (top 10)
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

        // Average ATS score by job type
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

        // Top employers by job count
        $topEmployers = User::where('role', 'employer')
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

        // Top employers by application count
        $topEmployersByApplications = User::where('role', 'employer')
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

        // Calculate percentage changes (compared to previous period)
        $previousStartDate = $startDate ? Carbon::parse($startDate)->subDays($this->getDateRangeDays($dateRange)) : null;
        $previousSummary = $this->getPreviousPeriodStats($previousStartDate, $dateRange);

        // Calculate trends
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
     * Get statistics from previous period
     */
    protected function getPreviousPeriodStats(?Carbon $previousStartDate, string $dateRange)
    {
        if (!$previousStartDate) {
            return [
                'total_jobs' => 0,
                'total_applications' => 0,
                'conversion_rate' => 0,
            ];
        }

        $previousEndDate = $previousStartDate->copy()->addDays($this->getDateRangeDays($dateRange));

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
}
