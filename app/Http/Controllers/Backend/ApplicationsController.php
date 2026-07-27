<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Mail\ApplicationEmail;
use App\Models\Application;
use App\Models\JobCategory;
use App\Models\JobListing;
use App\Models\Location;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use setasign\Fpdi\Fpdi;
use ZipArchive;

class ApplicationsController extends Controller
{
    /**
     * Cache duration in seconds (2 minutes).
     */
    protected int $cacheDuration = 120;

    /**
     * Rate limit max attempts per hour.
     */
    protected int $rateLimitAttempts = 10;

    /**
     * Display all applications from all jobs with comprehensive filtering.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view applications.');
        }

        $cacheKey = 'applications_index_' . md5(json_encode($request->query()));

        $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($request) {
            $query = Application::with([
                'jobListing' => fn($q) => $q->with(['category', 'locations']),
                'applicantProfile.user',
                'statusTimelines',
            ]);

            $this->applyFilters($query, $request);
            $this->applySorting($query, $request);

            $perPage = $request->input('per_page', 7);
            $applications = $query->paginate($perPage)->withQueryString();

            // Transform ATS scores
            $applications->getCollection()->transform(function ($application) {
                return $this->transformAtsScore($application);
            });

            // Related filter data
            $jobs = JobListing::where('is_active', true)->get(['id', 'title']);
            $categories = JobCategory::where('is_active', true)->get(['id', 'name']);
            $locations = Location::where('is_active', true)->get(['id', 'name']);
            $jobTypes = JobListing::$jobTypes;

            $educationLevels = [
                'high_school' => 'High School',
                'associate' => 'Associate Degree',
                'bachelor' => "Bachelor's Degree",
                'master' => "Master's Degree",
                'phd' => 'PhD',
                'other' => 'Other',
            ];

            // Status counts (respecting filters)
            $statusCountsQuery = clone $query;
            $statusCounts = [
                'pending' => (clone $statusCountsQuery)->where('status', 'pending')->count(),
                'shortlisted' => (clone $statusCountsQuery)->where('status', 'shortlisted')->count(),
                'rejected' => (clone $statusCountsQuery)->where('status', 'rejected')->count(),
                'hired' => (clone $statusCountsQuery)->where('status', 'hired')->count(),
                'total' => (clone $statusCountsQuery)->count(),
            ];
            $statusCounts['deleted'] = Application::onlyTrashed()->count();

            // Stats
            $atsStats = Application::selectRaw('
                MIN(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as min_ats,
                MAX(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as max_ats
            ')->first();

            $salaryStats = Application::selectRaw('MIN(expected_salary) as min_salary, MAX(expected_salary) as max_salary')->first();
            $expStats = Application::selectRaw('MIN(years_of_experience) as min_exp, MAX(years_of_experience) as max_exp')->first();

            return [
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
                    'per_page',
                ]),
                'statusCounts' => $statusCounts,
                'totalApplications' => Application::count(),
                'filterOptions' => [
                    'ats' => ['min' => $atsStats->min_ats ?? 0, 'max' => $atsStats->max_ats ?? 100],
                    'salary' => ['min' => $salaryStats->min_salary ?? 0, 'max' => $salaryStats->max_salary ?? 500000],
                    'experience' => ['min' => $expStats->min_exp ?? 0, 'max' => $expStats->max_exp ?? 30],
                ],
            ];
        });

        return Inertia::render('Backend/Applications/Index', $data);
    }

    /**
     * Display applications for a specific job with comprehensive filtering.
     */
    public function jobApplications(Request $request, int $jobId): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.job_applications')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view job applications.');
        }

        $cacheKey = 'applications_job_' . $jobId . '_' . md5(json_encode($request->query()));

        $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($request, $jobId) {
            $job = JobListing::withTrashed()->with('employer', 'category')->findOrFail($jobId);

            $query = Application::withTrashed()
                ->with(['applicantProfile.user', 'statusTimelines'])
                ->where('job_listing_id', $jobId);

            $this->applyJobFilters($query, $request);
            $this->applySorting($query, $request);

            $perPage = $request->input('per_page', 20);
            $applications = $query->paginate($perPage)->withQueryString();

            $applications->getCollection()->transform(function ($application) {
                return $this->transformAtsScore($application);
            });

            $statusCountsQuery = clone $query;
            $statusCounts = [
                'pending' => (clone $statusCountsQuery)->where('status', 'pending')->count(),
                'shortlisted' => (clone $statusCountsQuery)->where('status', 'shortlisted')->count(),
                'rejected' => (clone $statusCountsQuery)->where('status', 'rejected')->count(),
                'hired' => (clone $statusCountsQuery)->where('status', 'hired')->count(),
            ];

            $filterOptionsQuery = Application::withTrashed()->where('job_listing_id', $jobId);
            $atsStats = (clone $filterOptionsQuery)->selectRaw('
                MIN(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as min_ats,
                MAX(CAST(JSON_EXTRACT(ats_score, "$.percentage") AS UNSIGNED)) as max_ats
            ')->first();

            $salaryStats = (clone $filterOptionsQuery)->selectRaw('
                MIN(expected_salary) as min_salary, MAX(expected_salary) as max_salary
            ')->first();

            $expStats = (clone $filterOptionsQuery)->selectRaw('
                MIN(years_of_experience) as min_exp, MAX(years_of_experience) as max_exp
            ')->first();

            return [
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
                    'per_page',
                ]),
                'filterOptions' => [
                    'ats' => ['min' => $atsStats->min_ats ?? 0, 'max' => $atsStats->max_ats ?? 100],
                    'salary' => ['min' => $salaryStats->min_salary ?? 0, 'max' => $salaryStats->max_salary ?? 500000],
                    'experience' => ['min' => $expStats->min_exp ?? 0, 'max' => $expStats->max_exp ?? 30],
                ],
            ];
        });

        return Inertia::render('Backend/Applications/JobApplications', $data);
    }

    /**
     * Display single application details with full data.
     */
    public function show(int $id): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.show')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view application details.');
        }

        $application = Application::with([
            'jobListing' => fn($q) => $q->with(['employer', 'category', 'locations']),
            'applicantProfile' => fn($q) => $q->with([
                'user',
                'jobHistories' => fn($q) => $q->orderBy('starting_year', 'desc'),
                'educationHistories' => fn($q) => $q->orderBy('passing_year', 'desc'),
                'achievements',
                'cvs' => fn($q) => $q->orderBy('order_position'),
            ]),
            'statusTimelines' => fn($q) => $q->orderBy('created_at', 'desc'),
        ])->withTrashed()->findOrFail($id);

        $atsAnalysis = null;
        if ($application->ats_score && isset($application->ats_score['analysis'])) {
            $atsAnalysis = $application->ats_score['analysis'];
        }

        return Inertia::render('Backend/Applications/Show', [
            'application' => $application,
            'atsAnalysis' => $atsAnalysis,
        ]);
    }

    /**
     * Update single application status – with rate limiting.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.status.update')) {
            return redirect()->back()->with('error', 'You do not have permission to update application status.');
        }

        $this->checkRateLimit('application_status_update', $user->id);

        $validated = $request->validate([
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string',
        ]);

        $application = Application::findOrFail($id);
        $oldStatus = $application->status;

        $application->updateStatus($validated['status'], $validated['notes']);

        RateLimiter::clear($this->getThrottleKey('application_status_update', $user->id));
        $this->clearCache();

        SimpleLogger::applications(
            "Application #{$application->id} status changed: {$oldStatus} → {$validated['status']}",
            [
                'application_id' => $application->id,
                'applicant_name' => $application->name,
                'applicant_email' => $application->email,
                'job_title' => $application->jobListing?->title ?? 'N/A',
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'updated_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', 'Application status updated successfully.');
    }

    /**
     * Bulk status update – with rate limiting.
     */
    public function bulkUpdateStatus(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.bulk_status.update')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk update application status.');
        }

        $this->checkRateLimit('application_bulk_status_update', $user->id);

        $validated = $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
            'status' => 'required|in:pending,shortlisted,rejected,hired',
            'notes' => 'nullable|string',
        ]);

        $applications = Application::whereIn('id', $validated['application_ids'])->get();

        DB::transaction(function () use ($applications, $validated) {
            foreach ($applications as $application) {
                $application->updateStatus($validated['status'], $validated['notes']);
            }
        });

        RateLimiter::clear($this->getThrottleKey('application_bulk_status_update', $user->id));
        $this->clearCache();

        SimpleLogger::applications(
            "Bulk status update: {$applications->count()} applications → {$validated['status']}",
            [
                'application_ids' => $validated['application_ids'],
                'count' => $applications->count(),
                'new_status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', count($applications) . ' applications updated successfully.');
    }

    /**
     * Delete a single application (soft delete) – with rate limiting.
     */
    public function destroy(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.destroy')) {
            return redirect()->back()->with('error', 'You do not have permission to delete applications.');
        }

        $this->checkRateLimit('application_delete', $user->id);

        $application = Application::findOrFail($id);

        SimpleLogger::applications(
            "Application deleted: #{$application->id} - {$application->name}",
            [
                'application_id' => $application->id,
                'applicant_name' => $application->name,
                'applicant_email' => $application->email,
                'job_title' => $application->jobListing?->title ?? 'N/A',
                'status' => $application->status,
                'deleted_by' => $user->email,
                'ip' => request()->ip(),
            ]
        );

        $application->delete();

        RateLimiter::clear($this->getThrottleKey('application_delete', $user->id));
        $this->clearCache();

        return back()->with('success', 'Application deleted successfully.');
    }

    /**
     * Bulk delete applications (soft delete) – with rate limiting.
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete applications.');
        }

        $this->checkRateLimit('application_bulk_delete', $user->id);

        $validated = $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
        ]);

        $deleted = Application::whereIn('id', $validated['application_ids'])->delete();

        RateLimiter::clear($this->getThrottleKey('application_bulk_delete', $user->id));
        $this->clearCache();

        SimpleLogger::applications(
            "Bulk deleted {$deleted} applications",
            [
                'application_ids' => $validated['application_ids'],
                'count' => $deleted,
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', $deleted . ' applications deleted successfully.');
    }

    /**
     * Restore a deleted application – with rate limiting.
     */
    public function restore(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore applications.');
        }

        $this->checkRateLimit('application_restore', $user->id);

        $application = Application::withTrashed()->findOrFail($id);

        SimpleLogger::applications(
            "Application restored: #{$application->id} - {$application->name}",
            [
                'application_id' => $application->id,
                'applicant_name' => $application->name,
                'applicant_email' => $application->email,
                'job_title' => $application->jobListing?->title ?? 'N/A',
                'restored_by' => $user->email,
                'ip' => request()->ip(),
            ]
        );

        $application->restore();

        RateLimiter::clear($this->getThrottleKey('application_restore', $user->id));
        $this->clearCache();

        return back()->with('success', 'Application restored successfully.');
    }

    /**
     * Bulk restore deleted applications – with rate limiting.
     */
    public function bulkRestore(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore applications.');
        }

        $this->checkRateLimit('application_bulk_restore', $user->id);

        $validated = $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
        ]);

        $restored = Application::onlyTrashed()
            ->whereIn('id', $validated['application_ids'])
            ->restore();

        RateLimiter::clear($this->getThrottleKey('application_bulk_restore', $user->id));
        $this->clearCache();

        return back()->with('success', $restored . ' applications restored successfully.');
    }

    /**
     * Force delete application permanently – with rate limiting.
     */
    public function forceDelete(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete applications.');
        }

        $this->checkRateLimit('application_force_delete', $user->id);

        $application = Application::withTrashed()->findOrFail($id);

        SimpleLogger::applications(
            "Application permanently deleted: #{$application->id} - {$application->name}",
            [
                'application_id' => $application->id,
                'applicant_name' => $application->name,
                'applicant_email' => $application->email,
                'job_title' => $application->jobListing?->title ?? 'N/A',
                'status' => $application->status,
                'deleted_by' => $user->email,
                'ip' => request()->ip(),
            ]
        );

        $resumePath = $application->getActualResumePath();
        if ($resumePath && Storage::disk('public')->exists($resumePath)) {
            Storage::disk('public')->delete($resumePath);
        }

        $application->forceDelete();

        RateLimiter::clear($this->getThrottleKey('application_force_delete', $user->id));
        $this->clearCache();

        return back()->with('success', 'Application permanently deleted.');
    }

    /**
     * Download single application resume/CV.
     */
    public function downloadResume(int $id): \Symfony\Component\HttpFoundation\BinaryFileResponse|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.download_resume')) {
            return redirect()->back()->with('error', 'You do not have permission to download resumes.');
        }

        $application = Application::findOrFail($id);
        $resumePath = $this->normalizeResumePath($application->getActualResumePath());

        if (!$resumePath || !Storage::disk('public')->exists($resumePath)) {
            return back()->with('error', 'Resume file not found.');
        }

        $extension = pathinfo($resumePath, PATHINFO_EXTENSION);
        $applicantName = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $application->name);
        $applicantName = str_replace(' ', '_', trim($applicantName));
        $originalName = 'Resume_' . $applicantName . '.' . $extension;

        $fullPath = Storage::disk('public')->path($resumePath);
        return response()->download($fullPath, $originalName);
    }

    /**
     * Bulk download resumes as merged PDF or ZIP.
     */
    public function bulkDownloadResumes(Request $request): \Symfony\Component\HttpFoundation\BinaryFileResponse|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.bulk_download_resumes')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk download resumes.');
        }

        $validated = $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
        ]);

        $applications = Application::whereIn('id', $validated['application_ids'])->get();

        if ($applications->isEmpty()) {
            return back()->with('error', 'No applications selected.');
        }

        $resumeFiles = [];
        foreach ($applications as $application) {
            $path = $this->normalizeResumePath($application->getActualResumePath());
            if ($path && Storage::disk('public')->exists($path)) {
                $fullPath = Storage::disk('public')->path($path);
                $safeName = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $application->name);
                $safeName = str_replace(' ', '_', trim($safeName));
                $resumeFiles[] = [
                    'path' => $fullPath,
                    'name' => $safeName,
                    'applicant_name' => $application->name,
                ];
            }
        }

        if (empty($resumeFiles)) {
            return back()->with('error', 'No resume files found to download.');
        }

        if (count($resumeFiles) === 1) {
            $file = $resumeFiles[0];
            $extension = pathinfo($file['path'], PATHINFO_EXTENSION);
            $filename = 'Resume_' . $file['name'] . '.' . $extension;
            return response()->download($file['path'], $filename);
        }

        $tempDir = storage_path('app/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $jobTitle = $applications->first()->jobListing?->title ?? 'Job';
        $jobTitle = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $jobTitle);
        $jobTitle = str_replace(' ', '_', trim($jobTitle));
        $timestamp = date('Y-m-d_His');
        $mergedFilename = 'Resumes_' . $jobTitle . '_' . $timestamp . '.pdf';
        $mergedPath = $tempDir . '/' . $mergedFilename;

        try {
            if (class_exists('\setasign\Fpdi\Fpdi')) {
                return $this->mergeWithFpdi($resumeFiles, $mergedPath, $mergedFilename);
            }

            $gsCommand = $this->getGhostscriptCommand($resumeFiles, $mergedPath);
            if ($gsCommand) {
                exec($gsCommand, $output, $returnCode);
                if ($returnCode === 0 && file_exists($mergedPath)) {
                    $this->cleanupOldTempFiles($tempDir, 3600);
                    return response()->download($mergedPath, $mergedFilename)->deleteFileAfterSend(true);
                }
            }

            $pdftkCommand = $this->getPdftkCommand($resumeFiles, $mergedPath);
            if ($pdftkCommand) {
                exec($pdftkCommand, $output, $returnCode);
                if ($returnCode === 0 && file_exists($mergedPath)) {
                    $this->cleanupOldTempFiles($tempDir, 3600);
                    return response()->download($mergedPath, $mergedFilename)->deleteFileAfterSend(true);
                }
            }

            return $this->createZipFallback($resumeFiles, $jobTitle, $timestamp);
        } catch (\Exception $e) {
            Log::error('Failed to merge PDFs: ' . $e->getMessage());
            return $this->createZipFallback($resumeFiles, $jobTitle, $timestamp);
        }
    }

    /**
     * Send email to single applicant – with rate limiting.
     */
    public function sendEmail(Request $request, int $id): JsonResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.email.send')) {
            return response()->json(['error' => 'You do not have permission to send emails.'], 403);
        }

        $this->checkRateLimit('application_send_email', $user->id);

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $application = Application::with(['jobListing', 'applicantProfile'])->findOrFail($id);

        $recipientEmail = $application->email
            ?? $application->applicantProfile?->email
            ?? $application->user?->email;

        if (!$recipientEmail) {
            return response()->json([
                'success' => false,
                'message' => 'No email address found for this applicant.',
            ], 400);
        }

        $jobTitle = $application->jobListing?->title ?? null;
        $companyName = $application->jobListing?->employer?->name ?? config('app.name');

        try {
            Mail::to($recipientEmail)->send(new ApplicationEmail(
                $validated['subject'],
                $validated['content'],
                $application->name,
                $jobTitle,
                $companyName,
                $application->id
            ));

            RateLimiter::clear($this->getThrottleKey('application_send_email', $user->id));

            SimpleLogger::applications(
                "Email sent to applicant: {$application->name}",
                [
                    'application_id' => $application->id,
                    'applicant_name' => $application->name,
                    'applicant_email' => $recipientEmail,
                    'subject' => $validated['subject'],
                    'job_title' => $jobTitle,
                    'sent_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Email sent successfully to ' . $application->name,
            ]);
        } catch (\Exception $e) {
            Log::error('Email sending failed: ' . $e->getMessage(), [
                'application_id' => $id,
                'recipient' => $recipientEmail,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send bulk emails to multiple applicants – with rate limiting.
     */
    public function sendBulkEmail(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.bulk_email.send')) {
            return back()->with('error', 'You do not have permission to send bulk emails.');
        }

        $this->checkRateLimit('application_send_bulk_email', $user->id);

        $validator = Validator::make($request->all(), [
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:applications,id',
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Get validated data using input() to avoid property access warnings
        $ids = $request->input('ids', []);
        $subject = $request->input('subject', '');
        $content = $request->input('content', '');

        $applications = Application::whereIn('id', $ids)->get();

        if ($applications->isEmpty()) {
            return back()->with('error', 'No applications selected.');
        }

        $sentCount = 0;
        $failedCount = 0;
        $failedEmails = [];

        foreach ($applications as $application) {
            $recipientEmail = $application->email ?? $application->user?->email ?? null;
            if (!$recipientEmail) {
                $failedCount++;
                $failedEmails[] = "Application #{$application->id} (no email)";
                continue;
            }

            try {
                Mail::to($recipientEmail)->send(new ApplicationEmail(
                    $subject,
                    $content,
                    $application->name,
                    $application->jobListing?->title ?? 'N/A',
                    $application->jobListing?->employer?->name ?? config('app.name'),
                    $application->id
                ));
                $sentCount++;
            } catch (\Exception $e) {
                Log::error('Failed to send bulk email to applicant: ' . $e->getMessage(), [
                    'application_id' => $application->id,
                    'email' => $recipientEmail,
                ]);
                $failedCount++;
                $failedEmails[] = $recipientEmail;
            }
        }

        RateLimiter::clear($this->getThrottleKey('application_send_bulk_email', $user->id));

        SimpleLogger::applications(
            "Bulk email sent to {$sentCount} applicants",
            [
                'subject' => $subject,
                'total_sent' => $sentCount,
                'total_failed' => $failedCount,
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        $message = "Emails sent: {$sentCount}";
        if ($failedCount > 0) {
            $message .= ", Failed: {$failedCount}";
            if (!empty($failedEmails)) {
                $message .= " (Failed emails: " . implode(', ', $failedEmails) . ")";
            }
        }

        return back()->with('success', $message);
    }

    /**
     * Export applications as CSV – with rate limiting.
     */
    public function exportApplications(Request $request, ?int $jobId = null): \Symfony\Component\HttpFoundation\Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.export')) {
            return redirect()->back()->with('error', 'You do not have permission to export applications.');
        }

        $this->checkRateLimit('application_export', $user->id);

        $validated = $request->validate([
            'status' => 'nullable|in:pending,shortlisted,rejected,hired',
            'search' => 'nullable|string',
            'format' => 'required|in:csv,xlsx',
        ]);

        $query = Application::with(['jobListing.employer', 'applicantProfile']);

        if ($jobId) {
            $query->where('job_listing_id', $jobId);
            $job = JobListing::find($jobId);
            $filename = $job ? $this->sanitizeFilename($job->title) : 'job_applications';
        } else {
            $filename = 'all_applications';
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
            $filename .= '_' . $validated['status'];
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];
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

        RateLimiter::clear($this->getThrottleKey('application_export', $user->id));

        $timestamp = date('Y-m-d_His');
        $filename .= "_{$timestamp}";

        $csvData = $this->prepareExportData($applications);

        $output = fopen('php://temp', 'w');
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($output, array_keys($csvData[0]));

        foreach ($csvData as $row) {
            fputcsv($output, $row);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        $extension = $validated['format'] === 'xlsx' ? 'xlsx' : 'csv';
        $contentType = $validated['format'] === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';

        return response($csvContent, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => "attachment; filename=\"{$filename}.{$extension}\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Export single application – with rate limiting.
     */
    public function exportSingleApplication(Request $request, int $id): \Symfony\Component\HttpFoundation\Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.export_single')) {
            return redirect()->back()->with('error', 'You do not have permission to export application.');
        }

        $this->checkRateLimit('application_export_single', $user->id);

        $validated = $request->validate([
            'format' => 'required|in:csv,xlsx',
        ]);

        $application = Application::with([
            'jobListing.employer',
            'jobListing.category',
            'jobListing.locations',
            'applicantProfile.user',
            'applicantProfile.jobHistories' => fn($q) => $q->orderBy('starting_year', 'desc'),
            'applicantProfile.educationHistories' => fn($q) => $q->orderBy('passing_year', 'desc'),
            'applicantProfile.achievements',
            'statusTimelines',
        ])->findOrFail($id);

        RateLimiter::clear($this->getThrottleKey('application_export_single', $user->id));

        $filename = "application_{$application->id}_" . $this->sanitizeFilename($application->name) . "_" . date('Y-m-d_His');

        $exportData = $this->prepareSingleApplicationExport($application);

        $output = fopen('php://temp', 'w');
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        foreach ($exportData as $section => $data) {
            fputcsv($output, [strtoupper($section)]);
            fputcsv($output, []);

            if (!empty($data) && is_array($data)) {
                if (isset($data[0]) && is_array($data[0])) {
                    if (!empty($data)) {
                        fputcsv($output, array_keys($data[0]));
                        foreach ($data as $row) {
                            fputcsv($output, $row);
                        }
                    }
                } else {
                    fputcsv($output, array_keys($data));
                    fputcsv($output, array_values($data));
                }
            }
            fputcsv($output, []);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        $extension = $validated['format'] === 'xlsx' ? 'xlsx' : 'csv';
        $contentType = $validated['format'] === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv';

        return response($csvContent, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => "attachment; filename=\"{$filename}.{$extension}\"",
        ]);
    }

    /**
     * Recalculate ATS score – with rate limiting.
     */
    public function recalculateAts(int $id): RedirectResponse|JsonResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('applications.recalculate_ats')) {
            if (request()->header('X-Inertia')) {
                return redirect()->back()->with('error', 'You do not have permission to recalculate ATS scores.');
            }
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $this->checkRateLimit('application_recalculate_ats', $user->id);

        $application = Application::with('jobListing')->findOrFail($id);

        if (!$application->jobListing) {
            $message = 'Associated job listing not found';
            if (request()->header('X-Inertia')) {
                return redirect()->back()->with('error', $message);
            }
            return response()->json(['message' => $message], 404);
        }

        try {
            $oldScore = $application->ats_score['percentage'] ?? 'N/A';
            $application->recalculateAtsScoreInline();
            $newScore = $application->ats_score['percentage'] ?? 'N/A';

            RateLimiter::clear($this->getThrottleKey('application_recalculate_ats', $user->id));
            $this->clearCache();

            SimpleLogger::ats(
                "ATS recalculated for application #{$application->id}",
                [
                    'application_id' => $application->id,
                    'applicant_name' => $application->name,
                    'job_title' => $application->jobListing->title,
                    'old_score' => $oldScore,
                    'new_score' => $newScore,
                    'calculated_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            if (request()->header('X-Inertia')) {
                return redirect()->back()->with('success', 'ATS score recalculated successfully');
            }

            return response()->json([
                'message' => 'ATS score recalculated successfully',
                'ats_score' => $application->ats_score,
                'ats_calculation_status' => $application->ats_calculation_status,
            ]);
        } catch (\Exception $e) {
            Log::error('Error recalculating ATS score: ' . $e->getMessage(), ['application_id' => $id]);

            SimpleLogger::ats(
                "ATS recalculation failed for application #{$application->id}",
                [
                    'application_id' => $application->id,
                    'error' => $e->getMessage(),
                    'attempted_by' => $user->email,
                ]
            );

            $message = 'Failed to recalculate ATS score: ' . $e->getMessage();
            if (request()->header('X-Inertia')) {
                return redirect()->back()->with('error', $message);
            }
            return response()->json(['message' => $message], 500);
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
     * Check rate limit for admin actions.
     */
    private function checkRateLimit(string $action, int $userId, int $maxAttempts = 10, int $decaySeconds = 3600): void
    {
        $key = $this->getThrottleKey($action, $userId);
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
            throw ValidationException::withMessages([
                'rate_limit' => 'Too many attempts. Please wait a moment.',
            ]);
        }
        RateLimiter::hit($key, $decaySeconds);
    }

    /**
     * Get throttle key.
     */
    private function getThrottleKey(string $action, int $userId): string
    {
        return "applications_{$action}|{$userId}";
    }

    /**
     * Clear application cache keys.
     */
    private function clearCache(): void
    {
        Cache::forget('applications_index_*');
        Cache::forget('applications_job_*');
    }

    /**
     * Apply filters to index query.
     */
    private function applyFilters(\Illuminate\Database\Eloquent\Builder  $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('job_id')) {
            $query->where('job_listing_id', $request->job_id);
        }

        if ($request->filled('category_id')) {
            $query->whereHas('jobListing', fn($q) => $q->where('category_id', $request->category_id));
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

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

        if ($request->filled('min_experience')) {
            $query->where('years_of_experience', '>=', (int) $request->min_experience);
        }

        if ($request->filled('max_experience')) {
            $query->where('years_of_experience', '<=', (int) $request->max_experience);
        }

        if ($request->filled('min_salary')) {
            $query->where('expected_salary', '>=', (int) $request->min_salary);
        }

        if ($request->filled('max_salary')) {
            $query->where('expected_salary', '<=', (int) $request->max_salary);
        }

        if ($request->filled('education_level')) {
            $query->where('education_level', $request->education_level);
        }

        if ($request->filled('job_type')) {
            $query->whereHas('jobListing', fn($q) => $q->where('job_type', $request->job_type));
        }

        if ($request->filled('location_id')) {
            $query->whereHas('jobListing.locations', fn($q) => $q->where('locations.id', $request->location_id));
        }

        if ($request->filled('trashed')) {
            if ($request->trashed === 'only') {
                $query->onlyTrashed();
            } elseif ($request->trashed === 'with') {
                $query->withTrashed();
            }
        }
    }

    /**
     * Apply filters for job applications.
     */
    private function applyJobFilters(\Illuminate\Database\Eloquent\Builder $query, Request $request): void
    {
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

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

        if ($request->filled('min_experience')) {
            $query->where('years_of_experience', '>=', (int) $request->min_experience);
        }

        if ($request->filled('max_experience')) {
            $query->where('years_of_experience', '<=', (int) $request->max_experience);
        }

        if ($request->filled('min_salary')) {
            $query->where('expected_salary', '>=', (int) $request->min_salary);
        }

        if ($request->filled('max_salary')) {
            $query->where('expected_salary', '<=', (int) $request->max_salary);
        }

        if ($request->filled('education_level')) {
            $query->where('education_level', $request->education_level);
        }

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
    }

    /**
     * Apply sorting to query.
     */
    private function applySorting(\Illuminate\Database\Eloquent\Builder $query, Request $request): void
    {
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');

        $allowedSortFields = [
            'created_at',
            'name',
            'email',
            'expected_salary',
            'years_of_experience',
            'status',
            'ats_score',
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
    }

    /**
     * Transform ATS score for display.
     */
    private function transformAtsScore(Application $application): Application
    {
        $atsPercentage = null;

        /** @var string|array|int|float|null $atsScore */
        $atsScore = $application->ats_score;

        if (is_array($atsScore)) {
            $atsPercentage = $atsScore['percentage'] ?? $atsScore['total'] ?? null;
        } elseif (is_numeric($atsScore)) {
            $atsPercentage = (float) $atsScore;
        } elseif (is_string($atsScore)) {
            $decoded = json_decode($atsScore, true);
            if (is_array($decoded)) {
                $atsPercentage = $decoded['percentage'] ?? $decoded['total'] ?? null;
            }
        }

        $application->calculated_ats_score = $atsPercentage;
        $application->ats_percentage = $atsPercentage;

        return $application;
    }

    /**
     * Normalize resume path.
     */
    private function normalizeResumePath(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        $path = urldecode($path);
        $path = ltrim($path, '/');

        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        return $path;
    }

    /**
     * Sanitize filename for export.
     */
    private function sanitizeFilename(string $filename): string
    {
        $filename = preg_replace('/[^a-zA-Z0-9\s_-]/', '', $filename);
        $filename = str_replace(' ', '_', trim($filename));
        $filename = preg_replace('/_+/', '_', $filename);
        $filename = trim($filename, '_');

        return substr($filename, 0, 100) ?: 'file';
    }

    /**
     * Prepare export data for multiple applications.
     */
    private function prepareExportData(Collection $applications): array
    {
        $exportData = [];

        foreach ($applications as $app) {
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
                'Job Title' => $app->jobListing?->title ?? 'N/A',
                'Company' => $app->jobListing?->employer?->name ?? 'N/A',
                'Expected Salary (BDT)' => $app->jobListing?->expected_salary ? number_format((float) $app->jobListing?->expected_salary, 0) : 'N/A',
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
     * Prepare detailed single application export.
     */
    private function prepareSingleApplicationExport(Application $application): array
    {
        $atsAnalysis = 'N/A';
        if ($application->ats_score) {
            if (is_array($application->ats_score)) {
                if (isset($application->ats_score['analysis'])) {
                    $atsAnalysis = substr(
                        str_replace(["\n", "\r"], ' ', json_encode($application->ats_score['analysis'])),
                        0,
                        500
                    );
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
                'Expected Salary (BDT)' => $application->expected_salary ? number_format((float) $application->expected_salary, 0) : 'N/A',
                'Years of Experience' => $application->years_of_experience ?? 'N/A',
                'Education Level' => $application->education_level ?? 'N/A',
                'Current Location' => $application->current_location ?? 'N/A',
                'Current Salary (BDT)' => $application->current_salary ? number_format((float) $application->current_salary, 0) : 'N/A',
                'Notice Period (Days)' => $application->notice_period_days ?? 'N/A',
                'LinkedIn URL' => $application->linkedin_url ?? 'N/A',
                'Portfolio URL' => $application->portfolio_url ?? 'N/A',
                'ATS Analysis' => $atsAnalysis,
            ],
            'JOB DETAILS' => [
                'Job Title' => $application->jobListing?->title ?? 'N/A',
                'Company Name' => $application->jobListing?->employer?->name ?? 'N/A',
                'Category' => $application->jobListing?->category?->name ?? 'N/A',
                'Job Type' => $application->jobListing?->job_type ?? 'N/A',
                'Min Salary (BDT)' => $application->jobListing?->salary_min ? number_format($application->jobListing->salary_min, 0) : 'N/A',
                'Max Salary (BDT)' => $application->jobListing?->salary_max ? number_format($application->jobListing->salary_max, 0) : 'N/A',
                'Locations' => $application->jobListing?->locations ? $application->jobListing->locations->pluck('name')->implode(', ') : 'N/A',
                'Job Posted Date' => $application->jobListing?->created_at ? $application->jobListing->created_at->format('Y-m-d') : 'N/A',
                'Job Deadline' => $application->jobListing?->application_deadline ? $application->jobListing->application_deadline->format('Y-m-d') : 'N/A',
            ],
            'WORK HISTORY' => [],
            'EDUCATION' => [],
            'ACHIEVEMENTS' => [],
            'STATUS TIMELINE' => [],
        ];

        if ($application->applicantProfile) {
            foreach ($application->applicantProfile->jobHistories ?? [] as $job) {
                $data['WORK HISTORY'][] = [
                    'Company' => $job->company_name,
                    'Position' => $job->position,
                    'Start Year' => $job->starting_year,
                    'End Year' => $job->ending_year ?? 'Present',
                    'Current Job' => $job->is_current ? 'Yes' : 'No',
                ];
            }

            foreach ($application->applicantProfile->educationHistories ?? [] as $edu) {
                $data['EDUCATION'][] = [
                    'Degree' => $edu->degree,
                    'Institution' => $edu->institution_name,
                    'Passing Year' => $edu->passing_year,
                ];
            }

            foreach ($application->applicantProfile->achievements ?? [] as $achievement) {
                $data['ACHIEVEMENTS'][] = [
                    'Title' => $achievement->achievement_name,
                    'Description' => substr(str_replace(["\n", "\r"], ' ', $achievement->achievement_details ?? ''), 0, 200),
                ];
            }
        }

        foreach ($application->statusTimelines ?? [] as $timeline) {
            $data['STATUS TIMELINE'][] = [
                'Status' => ucfirst($timeline->status),
                'Notes' => $timeline->notes ?? 'N/A',
                'Date' => $timeline->created_at ? $timeline->created_at->format('Y-m-d H:i:s') : 'N/A',
            ];
        }

        return $data;
    }

    // ==========================================
    // PDF MERGE HELPERS (unchanged)
    // ==========================================

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
                    Log::warning('Failed to merge PDF for ' . ($file['applicant_name'] ?? 'unknown') . ': ' . $e->getMessage());
                    continue;
                }
            }
        }

        $pdf->Output('F', $mergedPath);

        $tempDir = storage_path('app/temp');
        $this->cleanupOldTempFiles($tempDir, 3600);

        return response()->download($mergedPath, $mergedFilename)->deleteFileAfterSend(true);
    }

    private function getGhostscriptCommand(array $resumeFiles, string $outputPath): ?string
    {
        $gsPath = $this->findExecutable('gs');
        if (!$gsPath) {
            return null;
        }

        $inputFiles = implode(' ', array_map(fn($file) => '"' . $file['path'] . '"', $resumeFiles));
        return "$gsPath -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=\"$outputPath\" $inputFiles";
    }

    private function getPdftkCommand(array $resumeFiles, string $outputPath): ?string
    {
        $pdftkPath = $this->findExecutable('pdftk');
        if (!$pdftkPath) {
            return null;
        }

        $inputFiles = implode(' ', array_map(fn($file) => '"' . $file['path'] . '"', $resumeFiles));
        return "$pdftkPath $inputFiles cat output \"$outputPath\"";
    }

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
                    return $matches[0];
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
}
