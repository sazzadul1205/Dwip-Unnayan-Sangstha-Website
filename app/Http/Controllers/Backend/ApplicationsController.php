<?php
// Controllers/Backend/ApplicationsController.php

namespace App\Http\Controllers\Backend;

// Controllers
use App\Http\Controllers\Controller;

// Mails
use App\Mail\ApplicationEmail;

// Models
use App\Models\Application;
use App\Models\JobCategory;
use App\Models\JobListing;
use App\Models\Location;
use App\Models\User;
// HTTP
use Illuminate\Http\Request;

// Collections
use Illuminate\Support\Collection;

// Facades
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

// For PDF
use setasign\Fpdi\Fpdi;

// For zip
use ZipArchive;

class ApplicationsController extends Controller
{
    /**
     * Display all applications from all jobs with comprehensive filtering
     */
    public function index(Request $request)
    {
        $query = Application::with([
            'jobListing' => function ($q) {
                $q->with(['category', 'locations']);
            },
            'applicantProfile.user',
            'statusTimelines'
        ]);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by job
        if ($request->filled('job_id')) {
            $query->where('job_listing_id', $request->job_id);
        }

        // Filter by job category
        if ($request->filled('category_id')) {
            $query->whereHas('jobListing', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        // Search by name, email, or phone
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Date filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('date_range')) {
            switch ($request->date_range) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', today()->subDay());
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('created_at', now()->month);
                    break;
                case 'last_month':
                    $query->whereMonth('created_at', now()->subMonth()->month);
                    break;
            }
        }

        // ATS score filters
        if ($request->filled('min_ats_score')) {
            $minScore = (int) $request->min_ats_score;
            $query->where(function ($q) use ($minScore) {
                $q->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") >= ?', [$minScore])
                    ->orWhereRaw('ats_score >= ?', [$minScore]);
            });
        }

        if ($request->filled('max_ats_score')) {
            $maxScore = (int) $request->max_ats_score;
            $query->where(function ($q) use ($maxScore) {
                $q->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") <= ?', [$maxScore])
                    ->orWhereRaw('ats_score <= ?', [$maxScore]);
            });
        }

        // Experience
        if ($request->filled('min_experience')) {
            $query->where('years_of_experience', '>=', (int) $request->min_experience);
        }

        if ($request->filled('max_experience')) {
            $query->where('years_of_experience', '<=', (int) $request->max_experience);
        }

        // Salary
        if ($request->filled('min_salary')) {
            $query->where('expected_salary', '>=', (int) $request->min_salary);
        }

        if ($request->filled('max_salary')) {
            $query->where('expected_salary', '<=', (int) $request->max_salary);
        }

        // Education
        if ($request->filled('education_level')) {
            $query->where('education_level', $request->education_level);
        }

        // Job type
        if ($request->filled('job_type')) {
            $query->whereHas('jobListing', function ($q) use ($request) {
                $q->where('job_type', $request->job_type);
            });
        }

        // Location
        if ($request->filled('location_id')) {
            $query->whereHas('jobListing.locations', function ($q) use ($request) {
                $q->where('locations.id', $request->location_id);
            });
        }

        // Trashed
        if ($request->filled('trashed') && $request->trashed === 'only') {
            $query->onlyTrashed();
        } elseif ($request->filled('trashed') && $request->trashed === 'with') {
            $query->withTrashed();
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        $allowedSortFields = [
            'created_at',
            'name',
            'email',
            'expected_salary',
            'years_of_experience',
            'status',
            'ats_score'
        ];

        if ($sortField === 'ats_score') {
            $query->orderByRaw(
                'COALESCE(JSON_EXTRACT(ats_score, "$.percentage"), CAST(ats_score AS UNSIGNED), 0) ' . $sortDirection
            );
        } elseif (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $applications = $query->paginate($request->get('per_page', 7))
            ->withQueryString();

        // ATS transformation
        $applications->getCollection()->transform(function ($application) {
            $atsScore = null;
            $atsPercentage = null;

            if ($application->ats_score) {
                if (is_array($application->ats_score)) {
                    $atsPercentage = $application->ats_score['percentage'] ?? $application->ats_score['total'] ?? null;
                } elseif (is_numeric($application->ats_score)) {
                    $atsPercentage = $application->ats_score;
                } elseif (is_string($application->ats_score)) {
                    $decoded = json_decode($application->ats_score, true);
                    if ($decoded) {
                        $atsPercentage = $decoded['percentage'] ?? $decoded['total'] ?? null;
                    }
                }
            }

            $application->calculated_ats_score = $atsPercentage;
            $application->ats_percentage = $atsPercentage;

            return $application;
        });

        // Related filter data (NO employer)
        $jobs = JobListing::where('is_active', true)->get(['id', 'title']);
        $categories = JobCategory::where('is_active', true)->get(['id', 'name']);
        $locations = Location::where('is_active', true)->get(['id', 'name']);
        $jobTypes = JobListing::$jobTypes;

        $educationLevels = [
            'high_school' => 'High School',
            'associate' => 'Associate Degree',
            'bachelor' => 'Bachelor\'s Degree',
            'master' => 'Master\'s Degree',
            'phd' => 'PhD',
            'other' => 'Other'
        ];

        // Status counts
        $statusCounts = [
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'shortlisted' => (clone $query)->where('status', 'shortlisted')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
            'hired' => (clone $query)->where('status', 'hired')->count(),
            'total' => (clone $query)->count(),
        ];

        $statusCounts['deleted'] = Application::onlyTrashed()->count();

        // Stats
        $atsStats = Application::selectRaw('
        MIN(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as min_ats,
        MAX(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as max_ats')->first();

        $salaryStats = Application::selectRaw('MIN(expected_salary) as min_salary, MAX(expected_salary) as max_salary')->first();

        $expStats = Application::selectRaw('MIN(years_of_experience) as min_exp, MAX(years_of_experience) as max_exp')->first();

        return inertia('Backend/Applications/Index', [
            'applications' => $applications,
            'jobs' => $jobs,
            'categories' => $categories,
            'locations' => $locations,
            'jobTypes' => $jobTypes,
            'educationLevels' => $educationLevels,
            'filters' => $request->only([
                'status',
                'job_id',
                'category_id',
                'search',
                'date_from',
                'date_to',
                'date_range',
                'min_ats_score',
                'max_ats_score',
                'min_experience',
                'max_experience',
                'min_salary',
                'max_salary',
                'education_level',
                'job_type',
                'location_id',
                'trashed',
                'sort',
                'direction',
                'per_page'
            ]),
            'statusCounts' => $statusCounts,
            'totalApplications' => Application::count(),
            'filterOptions' => [
                'ats' => [
                    'min' => $atsStats->min_ats ?? 0,
                    'max' => $atsStats->max_ats ?? 100,
                ],
                'salary' => [
                    'min' => $salaryStats->min_salary ?? 0,
                    'max' => $salaryStats->max_salary ?? 500000,
                ],
                'experience' => [
                    'min' => $expStats->min_exp ?? 0,
                    'max' => $expStats->max_exp ?? 30,
                ],
            ],
        ]);
    }

    /**
     * Display applications for a specific job with comprehensive filtering
     */
    public function jobApplications(Request $request, $jobId)
    {
        $job = JobListing::with('employer', 'category')->findOrFail($jobId);

        $query = Application::with(['applicantProfile.user', 'statusTimelines'])
            ->where('job_listing_id', $jobId);

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Search by name, email, or phone
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // ATS score range filters
        if ($request->filled('min_ats_score')) {
            $minScore = (int) $request->min_ats_score;
            $query->where(function ($q) use ($minScore) {
                $q->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") >= ?', [$minScore])
                    ->orWhereRaw('ats_score >= ?', [$minScore]);
            });
        }

        if ($request->filled('max_ats_score')) {
            $maxScore = (int) $request->max_ats_score;
            $query->where(function ($q) use ($maxScore) {
                $q->whereRaw('JSON_EXTRACT(ats_score, "$.percentage") <= ?', [$maxScore])
                    ->orWhereRaw('ats_score <= ?', [$maxScore]);
            });
        }

        // Experience range filters
        if ($request->filled('min_experience')) {
            $query->where('years_of_experience', '>=', (int) $request->min_experience);
        }

        if ($request->filled('max_experience')) {
            $query->where('years_of_experience', '<=', (int) $request->max_experience);
        }

        // Salary range filters
        if ($request->filled('min_salary')) {
            $query->where('expected_salary', '>=', (int) $request->min_salary);
        }

        if ($request->filled('max_salary')) {
            $query->where('expected_salary', '<=', (int) $request->max_salary);
        }

        // Education level filter
        if ($request->filled('education_level')) {
            $query->where('education_level', $request->education_level);
        }

        // Date filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('date_range')) {
            switch ($request->date_range) {
                case 'today':
                    $query->whereDate('created_at', today());
                    break;
                case 'yesterday':
                    $query->whereDate('created_at', today()->subDay());
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('created_at', now()->month);
                    break;
                case 'last_month':
                    $query->whereMonth('created_at', now()->subMonth()->month);
                    break;
            }
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');

        $allowedSortFields = [
            'created_at',
            'name',
            'email',
            'expected_salary',
            'years_of_experience',
            'status',
            'ats_score'
        ];

        if ($sortField === 'ats_score') {
            $query->orderByRaw(
                'COALESCE(JSON_EXTRACT(ats_score, "$.percentage"), CAST(ats_score AS UNSIGNED), 0) ' . $sortDirection
            );
        } elseif (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->get('per_page', 20);
        $applications = $query->paginate($perPage)->withQueryString();

        // Transform ATS scores
        $applications->getCollection()->transform(function ($application) {
            $atsScore = null;

            if ($application->ats_score) {
                if (is_array($application->ats_score)) {
                    $atsScore = $application->ats_score['percentage'] ?? $application->ats_score['total'] ?? null;
                } elseif (is_numeric($application->ats_score)) {
                    $atsScore = $application->ats_score;
                } elseif (is_string($application->ats_score)) {
                    $decoded = json_decode($application->ats_score, true);
                    if ($decoded) {
                        $atsScore = $decoded['percentage'] ?? $decoded['total'] ?? null;
                    }
                }
            }

            $application->calculated_ats_score = $atsScore;
            return $application;
        });

        // Status counts (respecting applied filters)
        $statusCountsQuery = clone $query;
        $statusCounts = [
            'pending' => (clone $statusCountsQuery)->where('status', 'pending')->count(),
            'shortlisted' => (clone $statusCountsQuery)->where('status', 'shortlisted')->count(),
            'rejected' => (clone $statusCountsQuery)->where('status', 'rejected')->count(),
            'hired' => (clone $statusCountsQuery)->where('status', 'hired')->count(),
        ];

        // Get filter options (min/max values for ranges)
        $filterOptionsQuery = Application::where('job_listing_id', $jobId);

        $atsStats = (clone $filterOptionsQuery)->selectRaw('
        MIN(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as min_ats,
        MAX(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as max_ats
    ')->first();

        $salaryStats = (clone $filterOptionsQuery)->selectRaw('
        MIN(expected_salary) as min_salary, 
        MAX(expected_salary) as max_salary
    ')->first();

        $expStats = (clone $filterOptionsQuery)->selectRaw('
        MIN(years_of_experience) as min_exp, 
        MAX(years_of_experience) as max_exp
    ')->first();

        return inertia('Backend/Applications/JobApplications', [
            'job' => $job,
            'applications' => $applications,
            'statusCounts' => $statusCounts,
            'filters' => $request->only([
                'status',
                'search',
                'min_ats_score',
                'max_ats_score',
                'min_experience',
                'max_experience',
                'min_salary',
                'max_salary',
                'education_level',
                'date_from',
                'date_to',
                'date_range',
                'sort',
                'direction',
                'per_page'
            ]),
            'filterOptions' => [
                'ats' => [
                    'min' => $atsStats->min_ats ?? 0,
                    'max' => $atsStats->max_ats ?? 100,
                ],
                'salary' => [
                    'min' => $salaryStats->min_salary ?? 0,
                    'max' => $salaryStats->max_salary ?? 500000,
                ],
                'experience' => [
                    'min' => $expStats->min_exp ?? 0,
                    'max' => $expStats->max_exp ?? 30,
                ],
            ],
        ]);
    }

    /**
     * Display single application details with full data
     */
    public function show(int $id)
    {
        $application = Application::with([
            'jobListing' => function ($q) {
                $q->with(['employer', 'category', 'locations']);
            },
            'applicantProfile' => function ($q) {
                $q->with([
                    'user',
                    'jobHistories' => function ($q) {
                        $q->orderBy('starting_year', 'desc');
                    },
                    'educationHistories' => function ($q) {
                        $q->orderBy('passing_year', 'desc');
                    },
                    'achievements',
                    'cvs' => function ($q) {
                        $q->orderBy('order_position');
                    }
                ]);
            },
            'statusTimelines' => function ($q) {
                $q->orderBy('created_at', 'desc');
            }
        ])->withTrashed()->findOrFail($id);

        // Extract ATS analysis data
        $atsAnalysis = null;
        if ($application->ats_score && isset($application->ats_score['analysis'])) {
            $atsAnalysis = $application->ats_score['analysis'];
        }

        return inertia('Backend/Applications/Show', [
            'application' => $application,
            'atsAnalysis' => $atsAnalysis
        ]);
    }

    /**
     * Update single application status
     */
    public function updateStatus(Request $request, int $id)
    {
        $request->validate([
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string'
        ]);

        $application = Application::findOrFail($id);
        $application->updateStatus($request->status, $request->notes);

        return back()->with('success', 'Application status updated successfully.');
    }

    /**
     * Bulk status update
     */
    public function bulkUpdateStatus(Request $request)
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string'
        ]);

        $applications = Application::whereIn('id', $request->application_ids)->get();

        DB::transaction(function () use ($applications, $request) {
            foreach ($applications as $application) {
                $application->updateStatus($request->status, $request->notes);
            }
        });

        return back()->with('success', count($applications) . ' applications updated successfully.');
    }

    /**
     * Delete a single application (soft delete)
     */
    public function destroy(int $id)
    {
        $application = Application::findOrFail($id);
        $application->delete();

        return back()->with('success', 'Application deleted successfully.');
    }

    /**
     * Bulk delete applications (soft delete)
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
        ]);

        $deleted = Application::whereIn('id', $request->application_ids)->delete();

        return back()->with('success', $deleted . ' applications deleted successfully.');
    }

    /**
     * Restore a deleted application
     */
    public function restore(int $id)
    {
        $application = Application::withTrashed()->findOrFail($id);
        $application->restore();

        return back()->with('success', 'Application restored successfully.');
    }

    /**
     * Bulk restore deleted applications
     */
    public function bulkRestore(Request $request)
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
        ]);

        $restored = Application::onlyTrashed()
            ->whereIn('id', $request->application_ids)
            ->restore();

        return back()->with('success', $restored . ' applications restored successfully.');
    }

    /**
     * Force delete application permanently
     */
    public function forceDelete(int $id)
    {
        $application = Application::withTrashed()->findOrFail($id);

        // Delete resume file if exists
        $resumePath = $application->getActualResumePath();
        if ($resumePath && Storage::disk('public')->exists($resumePath)) {
            Storage::disk('public')->delete($resumePath);
        }

        $application->forceDelete();

        return back()->with('success', 'Application permanently deleted.');
    }

    /**
     * Download single application resume/CV
     */
    public function downloadResume(int $id)
    {
        $application = Application::findOrFail($id);
        $resumePath = $application->getActualResumePath();

        if ($resumePath) {
            // Normalize stored paths (some older records may store URL-encoded paths or include `storage/` prefix)
            $resumePath = urldecode($resumePath);
            $resumePath = ltrim($resumePath, '/');
            if (str_starts_with($resumePath, 'storage/')) {
                $resumePath = substr($resumePath, strlen('storage/'));
            }
        }

        if (!$resumePath || !Storage::disk('public')->exists($resumePath)) {
            return back()->with('error', 'Resume file not found.');
        }

        // Get the extension from the actual file
        $extension = pathinfo($resumePath, PATHINFO_EXTENSION);

        // Sanitize the applicant's name for use as a filename
        $applicantName = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $application->name);
        $applicantName = str_replace(' ', '_', trim($applicantName));

        // Create the filename using the applicant's name
        $originalName = 'Resume_' . $applicantName . '.' . $extension;

        // Return file download response with a clean filename
        $fullPath = Storage::disk('public')->path($resumePath);
        return response()->download($fullPath, $originalName);
    }

    /**
     * Bulk download resumes as merged PDF (Simple Version)
     */
    public function bulkDownloadResumes(Request $request)
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id'
        ]);

        $applications = Application::whereIn('id', $request->application_ids)->get();

        if ($applications->isEmpty()) {
            return back()->with('error', 'No applications selected.');
        }

        // Collect all valid resume paths
        $resumeFiles = [];
        $downloadedCount = 0;

        foreach ($applications as $application) {
            $resumePath = $application->getActualResumePath();

            if ($resumePath) {
                // Normalize stored paths
                $resumePath = urldecode($resumePath);
                $resumePath = ltrim($resumePath, '/');
                if (str_starts_with($resumePath, 'storage/')) {
                    $resumePath = substr($resumePath, strlen('storage/'));
                }
            }

            if ($resumePath && Storage::disk('public')->exists($resumePath)) {
                $fullPath = Storage::disk('public')->path($resumePath);

                // Create a unique temporary copy with applicant name
                $safeName = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $application->name);
                $safeName = str_replace(' ', '_', trim($safeName));

                $resumeFiles[] = [
                    'path' => $fullPath,
                    'name' => $safeName,
                    'applicant_name' => $application->name,
                ];
                $downloadedCount++;
            }
        }

        if ($downloadedCount === 0) {
            return back()->with('error', 'No resume files found to download.');
        }

        // If there's only one file, just download it directly
        if ($downloadedCount === 1) {
            $file = $resumeFiles[0];
            $extension = pathinfo($file['path'], PATHINFO_EXTENSION);
            $filename = 'Resume_' . $file['name'] . '.' . $extension;

            return response()->download($file['path'], $filename);
        }

        // Create temp directory if not exists
        $tempDir = storage_path('app/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        // Generate output filename
        $jobTitle = $applications->first()->jobListing->title ?? 'Job';
        $jobTitle = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $jobTitle);
        $jobTitle = str_replace(' ', '_', trim($jobTitle));
        $timestamp = date('Y-m-d_His');
        $mergedFilename = 'Resumes_' . $jobTitle . '_' . $timestamp . '.pdf';
        $mergedPath = $tempDir . '/' . $mergedFilename;

        try {
            // Try using FPDI first (if installed)
            if (class_exists('\setasign\Fpdi\Fpdi')) {
                return $this->mergeWithFpdi($resumeFiles, $mergedPath, $mergedFilename);
            }

            // Try using Ghostscript
            $gsCommand = $this->getGhostscriptCommand($resumeFiles, $mergedPath);
            if ($gsCommand) {
                exec($gsCommand, $output, $returnCode);
                if ($returnCode === 0 && file_exists($mergedPath)) {
                    $this->cleanupOldTempFiles($tempDir, 3600);
                    return response()->download($mergedPath, $mergedFilename)->deleteFileAfterSend(true);
                }
            }

            // Try using PDFTK
            $pdftkCommand = $this->getPdftkCommand($resumeFiles, $mergedPath);
            if ($pdftkCommand) {
                exec($pdftkCommand, $output, $returnCode);
                if ($returnCode === 0 && file_exists($mergedPath)) {
                    $this->cleanupOldTempFiles($tempDir, 3600);
                    return response()->download($mergedPath, $mergedFilename)->deleteFileAfterSend(true);
                }
            }

            // Fallback to ZIP if no PDF merger available
            return $this->createZipFallback($resumeFiles, $jobTitle, $timestamp);
        } catch (\Exception $e) {
            Log::error('Failed to merge PDFs: ' . $e->getMessage());

            // Final fallback to ZIP
            return $this->createZipFallback($resumeFiles, $jobTitle, $timestamp);
        }
    }

    /**
     * Merge PDFs using FPDI
     */
    private function mergeWithFpdi(array $resumeFiles, string $mergedPath, string $mergedFilename)
    {
        $pdf = new Fpdi();

        foreach ($resumeFiles as $file) {
            if (strtolower(pathinfo($file['path'], PATHINFO_EXTENSION)) === 'pdf') {
                try {
                    $pageCount = $pdf->setSourceFile($file['path']);

                    for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                        $templateId = $pdf->importPage($pageNo);
                        $size = $pdf->getTemplateSize($templateId);

                        $orientation = $size['width'] > $size['height'] ? 'L' : 'P';
                        $pdf->AddPage($orientation, [$size['width'], $size['height']]);
                        $pdf->useTemplate($templateId);

                        if ($pageNo === 1) {
                            $pdf->SetFont('Helvetica', 'B', 10);
                            $pdf->SetTextColor(100, 100, 100);
                            $pdf->SetXY(10, 5);
                            $pdf->Cell(0, 10, 'Resume: ' . $file['applicant_name'], 0, 0, 'L');
                        }
                    }
                } catch (\Exception $e) {
                    Log::warning(
                        'Failed to merge PDF for ' . ($file['applicant_name'] ?? 'unknown') . ': ' . $e->getMessage()
                    );
                    continue;
                }
            }
        }

        $pdf->Output('F', $mergedPath);

        $tempDir = storage_path('app/temp');
        $this->cleanupOldTempFiles($tempDir, 3600);

        return response()
            ->download($mergedPath, $mergedFilename)
            ->deleteFileAfterSend(true);
    }

    /**
     * Get Ghostscript merge command
     */
    private function getGhostscriptCommand(array $resumeFiles, string $outputPath): ?string
    {
        // Check if ghostscript is available
        $gsPath = $this->findExecutable('gs');
        if (!$gsPath) return null;

        $inputFiles = implode(' ', array_map(function ($file) {
            return '"' . $file['path'] . '"';
        }, $resumeFiles));

        return "$gsPath -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=\"$outputPath\" $inputFiles";
    }

    /**
     * Get PDFTK merge command
     */
    private function getPdftkCommand(array $resumeFiles, string $outputPath): ?string
    {
        // Check if pdftk is available
        $pdftkPath = $this->findExecutable('pdftk');
        if (!$pdftkPath) return null;

        $inputFiles = implode(' ', array_map(function ($file) {
            return '"' . $file['path'] . '"';
        }, $resumeFiles));

        return "$pdftkPath $inputFiles cat output \"$outputPath\"";
    }

    /**
     * Find executable path
     */
    private function findExecutable(string $command): ?string
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $paths = [
                "C:\\Program Files\\gs\\gs*\\bin\\gswin64c.exe",
                "C:\\Program Files (x86)\\gs\\gs*\\bin\\gswin32c.exe",
                "C:\\Program Files (x86)\\PDFtk\\bin\\pdftk.exe",
                "C:\\Program Files\\PDFtk\\bin\\pdftk.exe",
            ];

            foreach ($paths as $pattern) {
                $matches = glob($pattern);
                if (!empty($matches)) {
                    return $matches[0]; // no quotes here
                }
            }

            exec("where $command 2>NUL", $output, $returnCode);
            if ($returnCode === 0 && !empty($output[0])) {
                return trim($output[0]);
            }
        } else {
            exec("which $command 2>/dev/null", $output, $returnCode);
            if ($returnCode === 0 && !empty($output[0])) {
                return trim($output[0]);
            }
        }

        return null;
    }

    /**
     * Create ZIP fallback
     */
    private function createZipFallback(array $resumeFiles, string $jobTitle, string $timestamp)
    {
        $zipFileName = 'Resumes_' . $jobTitle . '_' . $timestamp . '.zip';
        $tempDir = storage_path('app/temp');
        $zipPath = $tempDir . '/' . $zipFileName;

        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return back()->with('error', 'Could not create ZIP file for download.');
        }

        foreach ($resumeFiles as $index => $file) {
            if (!isset($file['path']) || !file_exists($file['path'])) {
                continue;
            }

            $extension = pathinfo($file['path'], PATHINFO_EXTENSION);

            $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $file['name']);
            $filename = sprintf('%02d_%s.%s', $index + 1, $safeName, $extension);

            $zip->addFile($file['path'], $filename);
        }

        $zip->close();

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    /**
     * Clean up old temporary files
     */
    private function cleanupOldTempFiles(string $directory, int $maxAge = 3600): void
    {
        if (!is_dir($directory)) {
            return;
        }

        $files = glob($directory . '/*');
        $now = time();

        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file) >= $maxAge)) {
                unlink($file);
            }
        }
    }

    /**
     * Send email to single applicant with template
     */
    public function sendEmail(Request $request, int $id)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $application = Application::with(['jobListing', 'applicantProfile'])->findOrFail($id);

        // Get the recipient email - check multiple possible fields
        $recipientEmail = $application->email ?? $application->applicantProfile?->email ?? $application->user?->email;

        if (!$recipientEmail) {
            return response()->json([
                'success' => false,
                'message' => 'No email address found for this applicant.'
            ], 400);
        }

        $jobTitle = $application->jobListing->title ?? null;
        $companyName = $application->jobListing->employer->name ?? config('app.name');

        try {
            Mail::to($recipientEmail)->send(new ApplicationEmail(
                $request->subject,
                $request->content,
                $application->name,
                $jobTitle,
                $companyName,
                $application->id
            ));

            return response()->json([
                'success' => true,
                'message' => 'Email sent successfully to ' . $application->name
            ]);
        } catch (\Exception $e) {
            Log::error('Email sending failed: ' . $e->getMessage(), [
                'application_id' => $id,
                'recipient' => $recipientEmail
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send bulk emails to multiple applicants with template
     */
    public function sendBulkEmail(Request $request)
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $applications = Application::with(['jobListing', 'applicantProfile'])
            ->whereIn('id', $request->application_ids)
            ->get();

        if ($applications->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No applications found.'
            ], 404);
        }

        $successCount = 0;
        $failedCount = 0;
        $failedEmails = [];

        foreach ($applications as $application) {
            try {
                $recipientEmail = $application->email ?? $application->applicantProfile?->email ?? $application->user?->email;

                if (!$recipientEmail) {
                    $failedCount++;
                    $failedEmails[] = $application->name . ' (No email address)';
                    continue;
                }

                $jobTitle = $application->jobListing->title ?? null;
                $companyName = $application->jobListing->employer->name ?? config('app.name');

                Mail::to($recipientEmail)->send(new ApplicationEmail(
                    $request->subject,
                    $request->content,
                    $application->name,
                    $jobTitle,
                    $companyName,
                    $application->id
                ));
                $successCount++;
            } catch (\Exception $e) {
                $failedCount++;
                $failedEmails[] = $application->email ?? $application->name;
                Log::error('Bulk email failed for application ' . $application->id . ': ' . $e->getMessage());
            }
        }

        if ($failedCount > 0) {
            return response()->json([
                'success' => true,
                'message' => "Sent to {$successCount} applicant(s). Failed: {$failedCount}",
                'failed_emails' => $failedEmails
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Email sent successfully to {$successCount} applicant(s)."
        ]);
    }

    /**
     * Download applications as CSV with filters
     */
    public function exportApplications(Request $request, $jobId = null)
    {
        $request->validate([
            'status' => 'nullable|in:pending,shortlisted,rejected,hired',
            'search' => 'nullable|string',
            'format' => 'required|in:csv,xlsx',
        ]);

        $status = $request->status;
        $search = $request->search;
        $format = $request->format;

        // Build query
        $query = Application::with(['jobListing.employer', 'applicantProfile']);

        if ($jobId) {
            $query->where('job_listing_id', $jobId);
            $job = JobListing::find($jobId);
            $filename = $job ? $this->sanitizeFilename($job->title) : 'job_applications';
        } else {
            $filename = 'all_applications';
        }

        // Apply filters
        if ($status) {
            $query->where('status', $status);
            $filename .= '_' . $status;
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
            $filename .= '_filtered';
        }

        $applications = $query->orderBy('created_at', 'desc')->get();

        if ($applications->isEmpty()) {
            return back()->with('error', 'No applications found to export.');
        }

        $timestamp = date('Y-m-d_His');
        $filename .= "_{$timestamp}";

        // Prepare CSV data
        $csvData = $this->prepareExportData($applications);

        // Create CSV file
        $output = fopen('php://temp', 'w');

        // Add UTF-8 BOM for Excel compatibility
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // Add headers
        fputcsv($output, array_keys($csvData[0]));

        // Add data rows
        foreach ($csvData as $row) {
            fputcsv($output, $row);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        // For XLSX format, we'll just send as CSV but with .xlsx extension
        // (Excel can open CSV files, but we'll note that it's CSV format)
        $extension = $format === 'xlsx' ? 'xlsx' : 'csv';
        $contentType = $format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';

        return response($csvContent, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => "attachment; filename=\"{$filename}.{$extension}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Export single application data
     */
    public function exportSingleApplication(Request $request, int $id)
    {
        $request->validate([
            'format' => 'required|in:csv,xlsx',
        ]);

        $application = Application::with([
            'jobListing.employer',
            'jobListing.category',
            'jobListing.locations',
            'applicantProfile.user',
            'applicantProfile.jobHistories' => function ($q) {
                $q->orderBy('starting_year', 'desc');
            },
            'applicantProfile.educationHistories' => function ($q) {
                $q->orderBy('passing_year', 'desc');
            },
            'applicantProfile.achievements',
            'statusTimelines'
        ])->findOrFail($id);

        $format = $request->format;
        $filename = "application_{$application->id}_" . $this->sanitizeFilename($application->name) . "_" . date('Y-m-d_His');

        // Prepare detailed export data
        $exportData = $this->prepareSingleApplicationExport($application);

        // Create CSV
        $output = fopen('php://temp', 'w');

        // Add UTF-8 BOM
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        // Write data sections
        foreach ($exportData as $section => $data) {
            // Add section header
            fputcsv($output, [strtoupper($section)]);
            fputcsv($output, []); // Empty line

            if (!empty($data) && is_array($data)) {
                // Check if it's associative or indexed
                if (isset($data[0]) && is_array($data[0])) {
                    // Multiple rows (like work history)
                    if (!empty($data)) {
                        // Add headers from first item
                        fputcsv($output, array_keys($data[0]));
                        // Add data rows
                        foreach ($data as $row) {
                            fputcsv($output, $row);
                        }
                    }
                } else {
                    // Single row data
                    fputcsv($output, array_keys($data));
                    fputcsv($output, array_values($data));
                }
            }

            fputcsv($output, []); // Empty line between sections
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        $extension = $format === 'xlsx' ? 'xlsx' : 'csv';
        $contentType = $format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';

        return response($csvContent, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => "attachment; filename=\"{$filename}.{$extension}\"",
        ]);
    }

    /**
     * Recalculate ATS score for an application
     */
    public function recalculateAts(int $id)
    {
        $application = Application::with('jobListing')->findOrFail($id);

        if (!$application->jobListing) {
            $message = 'Associated job listing not found';

            if (request()->header('X-Inertia')) {
                return redirect()->back()->with('error', $message);
            }

            return response()->json([
                'message' => $message
            ], 404);
        }

        try {
            // Use the model helper so status and metadata are updated consistently.
            $application->recalculateAtsScoreInline();

            if (request()->header('X-Inertia')) {
                return redirect()->back()->with('success', 'ATS score recalculated successfully');
            }

            return response()->json([
                'message' => 'ATS score recalculated successfully',
                'ats_score' => $application->ats_score,
                'ats_calculation_status' => $application->ats_calculation_status,
            ]);
        } catch (\Exception $e) {
            Log::error('Error recalculating ATS score: ' . $e->getMessage(), [
                'application_id' => $id
            ]);

            $message = 'Failed to recalculate ATS score: ' . $e->getMessage();

            if (request()->header('X-Inertia')) {
                return redirect()->back()->with('error', $message);
            }

            return response()->json([
                'message' => $message
            ], 500);
        }
    }

    /**
     * Prepare export data for multiple applications
     */
    private function prepareExportData(Collection $applications)
    {
        $exportData = [];

        foreach ($applications as $app) {
            // Get ATS score
            $atsScore = 'N/A';
            if ($app->ats_score) {
                if (is_array($app->ats_score) && isset($app->ats_score['percentage'])) {
                    $atsScore = $app->ats_score['percentage'] . '%';
                } elseif (is_numeric($app->ats_score)) {
                    $atsScore = $app->ats_score . '%';
                }
            }

            $exportData[] = [
                'Application ID' => $app->id,
                'Name' => $app->name,
                'Email' => $app->email,
                'Phone' => $app->phone ?? 'N/A',
                'Status' => ucfirst($app->status),
                'Applied Date' => $app->created_at ? $app->created_at->format('Y-m-d H:i:s') : 'N/A',
                'Job Title' => $app->jobListing->title ?? 'N/A',
                'Company' => $app->jobListing->employer->name ?? 'N/A',
                'Expected Salary (BDT)' => $app->expected_salary ? number_format($app->expected_salary, 0) : 'N/A',
                'Years of Experience' => $app->years_of_experience ?? 'N/A',
                'ATS Score' => $atsScore,
                'Education Level' => $app->education_level ?? 'N/A',
                'Current Location' => $app->current_location ?? 'N/A',
                'Current Salary (BDT)' => $app->current_salary ? number_format($app->current_salary, 0) : 'N/A',
                'Notice Period (Days)' => $app->notice_period_days ?? 'N/A',
                'LinkedIn URL' => $app->linkedin_url ?? 'N/A',
                'Portfolio URL' => $app->portfolio_url ?? 'N/A',
            ];
        }

        return $exportData;
    }

    /**
     * Prepare detailed single application export
     */
    private function prepareSingleApplicationExport(Application $application): array
    {
        // Get ATS analysis
        $atsAnalysis = 'N/A';
        if ($application->ats_score) {
            if (is_array($application->ats_score)) {
                if (isset($application->ats_score['analysis'])) {
                    $atsAnalysis = substr(str_replace(["\n", "\r"], ' ', json_encode($application->ats_score['analysis'])), 0, 500);
                } elseif (isset($application->ats_score['percentage'])) {
                    $atsAnalysis = "Score: {$application->ats_score['percentage']}%";
                    if (isset($application->ats_score['feedback'])) {
                        $atsAnalysis .= " - Feedback: " . substr($application->ats_score['feedback'], 0, 200);
                    }
                }
            }
        }

        $data = [
            'APPLICATION DETAILS' => [
                'Application ID' => $application->id,
                'Name' => $application->name,
                'Email' => $application->email,
                'Phone' => $application->phone ?? 'N/A',
                'Status' => ucfirst($application->status),
                'Applied Date' => $application->created_at ? $application->created_at->format('Y-m-d H:i:s') : 'N/A',
                'Last Updated' => $application->updated_at ? $application->updated_at->format('Y-m-d H:i:s') : 'N/A',
                'Expected Salary (BDT)' => $application->expected_salary ? number_format($application->expected_salary, 0) : 'N/A',
                'Years of Experience' => $application->years_of_experience ?? 'N/A',
                'Education Level' => $application->education_level ?? 'N/A',
                'Current Location' => $application->current_location ?? 'N/A',
                'Current Salary (BDT)' => $application->current_salary ? number_format($application->current_salary, 0) : 'N/A',
                'Notice Period (Days)' => $application->notice_period_days ?? 'N/A',
                'LinkedIn URL' => $application->linkedin_url ?? 'N/A',
                'Portfolio URL' => $application->portfolio_url ?? 'N/A',
                'ATS Analysis' => $atsAnalysis,
            ],
            'JOB DETAILS' => [
                'Job Title' => $application->jobListing->title ?? 'N/A',
                'Company Name' => $application->jobListing->employer->name ?? 'N/A',
                'Category' => $application->jobListing->category->name ?? 'N/A',
                'Job Type' => $application->jobListing->job_type ?? 'N/A',
                'Min Salary (BDT)' => $application->jobListing->salary_min ? number_format($application->jobListing->salary_min, 0) : 'N/A',
                'Max Salary (BDT)' => $application->jobListing->salary_max ? number_format($application->jobListing->salary_max, 0) : 'N/A',
                'Locations' => $application->jobListing->locations ? $application->jobListing->locations->pluck('name')->implode(', ') : 'N/A',
                'Job Posted Date' => $application->jobListing->created_at ? $application->jobListing->created_at->format('Y-m-d') : 'N/A',
                'Job Deadline' => $application->jobListing->application_deadline ? $application->jobListing->application_deadline->format('Y-m-d') : 'N/A',
            ],
            'WORK HISTORY' => [],
            'EDUCATION' => [],
            'ACHIEVEMENTS' => [],
            'STATUS TIMELINE' => [],
        ];

        // Add work history
        if ($application->applicantProfile && $application->applicantProfile->jobHistories) {
            foreach ($application->applicantProfile->jobHistories as $job) {
                $data['WORK HISTORY'][] = [
                    'Company' => $job->company_name,
                    'Position' => $job->position,
                    'Start Year' => $job->starting_year,
                    'End Year' => $job->ending_year ?? 'Present',
                    'Current Job' => $job->is_current ? 'Yes' : 'No',
                ];
            }
        }

        // Add education
        if ($application->applicantProfile && $application->applicantProfile->educationHistories) {
            foreach ($application->applicantProfile->educationHistories as $edu) {
                $data['EDUCATION'][] = [
                    'Degree' => $edu->degree,
                    'Institution' => $edu->institution_name,
                    'Passing Year' => $edu->passing_year,
                ];
            }
        }

        // Add achievements
        if ($application->applicantProfile && $application->applicantProfile->achievements) {
            foreach ($application->applicantProfile->achievements as $achievement) {
                $data['ACHIEVEMENTS'][] = [
                    'Title' => $achievement->achievement_name,
                    'Description' => substr(str_replace(["\n", "\r"], ' ', $achievement->achievement_details ?? ''), 0, 200),
                ];
            }
        }

        // Add status timeline
        if ($application->statusTimelines) {
            foreach ($application->statusTimelines as $timeline) {
                $data['STATUS TIMELINE'][] = [
                    'Status' => ucfirst($timeline->status),
                    'Notes' => $timeline->notes ?? 'N/A',
                    'Date' => $timeline->created_at ? $timeline->created_at->format('Y-m-d H:i:s') : 'N/A',
                ];
            }
        }

        return $data;
    }

    /**
     * Sanitize filename for export
     */
    private function sanitizeFilename(string $filename): string
    {
        $filename = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $filename);
        $filename = str_replace(' ', '_', trim($filename));
        $filename = preg_replace('/_+/', '_', $filename);
        $filename = trim($filename, '_');

        return substr($filename, 0, 100) ?: 'file';
    }
}
