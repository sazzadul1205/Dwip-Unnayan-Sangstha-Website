<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\JobListing;
use App\Services\ATSService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ATSController extends Controller
{
    /**
     * Display ATS dashboard with applications overview
     */
    public function dashboard(Request $request): Response
    {
        // Status counts
        $statusCounts = [
            'pending' => Application::where('status', 'pending')->count(),
            'shortlisted' => Application::where('status', 'shortlisted')->count(),
            'rejected' => Application::where('status', 'rejected')->count(),
            'hired' => Application::where('status', 'hired')->count(),
            'total' => Application::count(),
        ];

        // ATS Stats
        $atsStats = Application::selectRaw('
            AVG(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as avg_ats,
            MIN(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as min_ats,
            MAX(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as max_ats
        ')->first();

        // Recent applications
        $recentApplications = Application::with(['jobListing', 'applicantProfile'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'name' => $app->name,
                    'email' => $app->email,
                    'job_title' => $app->jobListing?->title ?? 'N/A',
                    'status' => $app->status,
                    'ats_score' => $app->ats_score_percentage ?? 0,
                    'created_at' => $app->created_at->diffForHumans(),
                ];
            });

        // Job listings with application counts
        $jobsWithApps = JobListing::withCount('applications')
            ->where('is_active', true)
            ->orderByDesc('applications_count')
            ->limit(5)
            ->get(['id', 'title', 'is_active']);

        return Inertia::render('ATS/Dashboard', [
            'statusCounts' => $statusCounts,
            'atsStats' => [
                'avg' => round($atsStats->avg_ats ?? 0, 2),
                'min' => $atsStats->min_ats ?? 0,
                'max' => $atsStats->max_ats ?? 0,
            ],
            'recentApplications' => $recentApplications,
            'topJobs' => $jobsWithApps,
        ]);
    }

    /**
     * Display all applications with filtering
     */
    public function applications(Request $request): Response
    {
        $query = Application::with([
            'jobListing' => fn($q) => $q->with(['category', 'locations']),
            'applicantProfile.user',
            'statusTimelines',
        ]);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('job_id')) {
            $query->where('job_listing_id', $request->job_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('min_ats_score')) {
            $query->whereRaw('CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED) >= ?', [$request->min_ats_score]);
        }

        $perPage = $request->input('per_page', 15);
        $applications = $query->paginate($perPage)->withQueryString();

        // Transform for frontend
        $applications->getCollection()->transform(function ($app) {
            return [
                'id' => $app->id,
                'name' => $app->name,
                'email' => $app->email,
                'phone' => $app->phone,
                'job' => [
                    'id' => $app->jobListing?->id,
                    'title' => $app->jobListing?->title,
                    'category' => $app->jobListing?->category?->name,
                ],
                'status' => $app->status,
                'ats_score' => $app->ats_score_percentage ?? 0,
                'matched_keywords' => $app->matched_keywords ?? [],
                'missing_keywords' => $app->missing_keywords ?? [],
                'experience_years' => $app->years_of_experience,
                'education_level' => $app->education_level,
                'expected_salary' => $app->expected_salary,
                'created_at' => $app->created_at->format('Y-m-d H:i'),
                'can_update' => !in_array($app->status, ['hired', 'rejected']),
            ];
        });

        // Filter options
        $jobs = JobListing::where('is_active', true)->get(['id', 'title']);
        $statuses = Application::$statuses;

        return Inertia::render('ATS/Applications/Index', [
            'applications' => $applications,
            'filters' => $request->only(['status', 'job_id', 'search', 'min_ats_score', 'per_page']),
            'jobs' => $jobs,
            'statuses' => $statuses,
            'statusCounts' => [
                'pending' => Application::where('status', 'pending')->count(),
                'shortlisted' => Application::where('status', 'shortlisted')->count(),
                'rejected' => Application::where('status', 'rejected')->count(),
                'hired' => Application::where('status', 'hired')->count(),
            ],
        ]);
    }

    /**
     * Show single application details
     */
    public function showApplication(int $id): Response
    {
        $application = Application::with([
            'jobListing' => fn($q) => $q->with(['employer', 'category', 'locations']),
            'applicantProfile' => fn($q) => $q->with([
                'user',
                'jobHistories',
                'educationHistories',
                'achievements',
                'cvs',
            ]),
            'statusTimelines' => fn($q) => $q->orderBy('created_at', 'desc'),
        ])->findOrFail($id);

        $atsAnalysis = $application->ats_score['analysis'] ?? null;

        return Inertia::render('ATS/Applications/Show', [
            'application' => $application,
            'atsAnalysis' => $atsAnalysis,
        ]);
    }

    /**
     * Update application status
     */
    public function updateStatus(Request $request, int $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string|max:1000',
        ]);

        $application = Application::findOrFail($id);
        $oldStatus = $application->status;
        
        $application->updateStatus($validated['status'], $validated['notes']);

        return back()->with('success', "Application status updated from {$oldStatus} to {$validated['status']}.");
    }

    /**
     * Bulk update application statuses
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'application_ids' => 'required|array|min:1',
            'application_ids.*' => 'exists:applications,id',
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string|max:1000',
        ]);

        $updated = Application::whereIn('id', $validated['application_ids'])
            ->each(function ($app) use ($validated) {
                $app->updateStatus($validated['status'], $validated['notes']);
            });

        return back()->with('success', count($validated['application_ids']) . ' applications updated successfully.');
    }

    /**
     * Recalculate ATS score for an application
     */
    public function recalculateAtsScore(int $id)
    {
        $application = Application::findOrFail($id);
        
        try {
            $success = $application->recalculateAtsScoreInline();
            
            if ($success) {
                return back()->with('success', 'ATS score recalculated successfully.');
            }
            
            return back()->with('error', 'Failed to recalculate ATS score.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error: ' . $e->getMessage());
        }
    }

    /**
     * Display job listings
     */
    public function jobs(): Response
    {
        $jobs = JobListing::with(['category', 'locations'])
            ->withCount('applications')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('ATS/Jobs/Index', [
            'jobs' => $jobs,
        ]);
    }

    /**
     * Show applications for a specific job
     */
    public function jobApplications(int $jobId, Request $request): Response
    {
        $job = JobListing::findOrFail($jobId);

        $query = Application::with([
            'applicantProfile.user',
            'statusTimelines',
        ])->where('job_listing_id', $jobId);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->orderBy('created_at', 'desc')->paginate(20);

        $statusCounts = [
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'shortlisted' => (clone $query)->where('status', 'shortlisted')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'hired' => (clone $query)->where('status', 'hired')->count(),
        ];

        return Inertia::render('ATS/Jobs/Applications', [
            'job' => $job,
            'applications' => $applications,
            'statusCounts' => $statusCounts,
            'filters' => $request->only(['status']),
        ]);
    }
}
