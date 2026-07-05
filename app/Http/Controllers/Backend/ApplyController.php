<?php

namespace App\Http\Controllers\Backend;

// Inertia
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

// Models
use App\Models\JobListing;
use App\Models\Application;
use App\Models\ApplicantCv;
use App\Models\ApplicantProfile;
use App\Models\User;
// ATS Components
use App\Services\ATSService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ApplyController extends Controller
{
    protected AtsService $atsService;

    public function __construct(ATSService $atsService)
    {
        $this->atsService = $atsService;
    }


    /**
     * List all applications for the authenticated user (including soft-deleted)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Get all applications (active and soft-deleted) with pagination
        $applications = Application::withTrashed()
            ->where('user_id', $user->id)
            ->with(['jobListing', 'jobListing.employer'])
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($application) {
                // Extract ATS score percentage correctly
                $atsPercentage = null;
                if ($application->ats_score) {
                    if (is_array($application->ats_score)) {
                        $atsPercentage = $application->ats_score['percentage'] ?? null;
                    } elseif (is_string($application->ats_score)) {
                        $atsData = json_decode($application->ats_score, true);
                        $atsPercentage = $atsData['percentage'] ?? null;
                    }
                }

                // Also try the accessor method
                if (!$atsPercentage) {
                    $atsPercentage = $application->getAtsScorePercentageAttribute();
                }

                return [
                    'id' => $application->id,
                    'job_title' => $application->jobListing->title,
                    'job_slug' => $application->jobListing->slug,
                    'employer_name' => $application->jobListing->employer->name ?? 'Unknown',
                    'status' => $application->status,
                    'expected_salary' => $application->expected_salary,
                    'created_at' => $application->created_at,
                    'updated_at' => $application->updated_at,
                    'deleted_at' => $application->deleted_at,
                    'ats_score' => $atsPercentage,
                    'ats_calculation_status' => $application->ats_calculation_status,
                ];
            });

        // Calculate stats
        $stats = [
            'total' => Application::where('user_id', $user->id)->whereNull('deleted_at')->count(),
            'total_deleted' => Application::onlyTrashed()->where('user_id', $user->id)->count(),
            'pending' => Application::where('user_id', $user->id)->whereNull('deleted_at')->where('status', Application::STATUS_PENDING)->count(),
            'shortlisted' => Application::where('user_id', $user->id)->whereNull('deleted_at')->where('status', Application::STATUS_SHORTLISTED)->count(),
            'rejected' => Application::where('user_id', $user->id)->whereNull('deleted_at')->where('status', Application::STATUS_REJECTED)->count(),
            'hired' => Application::where('user_id', $user->id)->whereNull('deleted_at')->where('status', Application::STATUS_HIRED)->count(),
            'average_ats_score' => Application::where('user_id', $user->id)
                ->whereNull('deleted_at')
                ->whereNotNull('ats_score')
                ->where('ats_calculation_status', Application::ATS_COMPLETED)
                ->avg(DB::raw('JSON_EXTRACT(ats_score, "$.percentage")')) ?? 0,
        ];

        return Inertia::render('Backend/Apply/Index', [
            'applications' => $applications,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the application form for a specific job
     */
    public function create(string $slug)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $jobListing = JobListing::where('slug', $slug)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->firstOrFail();

        // Get or create applicant profile
        $applicantProfile = $user->applicantProfile;

        // If no profile exists, create a basic one
        if (!$applicantProfile) {
            $applicantProfile = ApplicantProfile::create([
                'user_id' => $user->id,
                'first_name' => explode(' ', $user->name)[0] ?? '',
                'last_name' => explode(' ', $user->name)[1] ?? '',
            ]);
        }

        // Get user's CVs
        $cvs = ApplicantCv::where('applicant_profile_id', $applicantProfile->id)
            ->where('status', 'active')
            ->orderBy('is_primary', 'desc')
            ->orderBy('order_position')
            ->get()
            ->map(function ($cv) {
                return [
                    'id' => $cv->id,
                    'original_name' => $cv->original_name,
                    'url' => $cv->url,
                    'is_primary' => $cv->is_primary,
                    'order_position' => $cv->order_position,
                ];
            });

        // Check if user has already applied (including soft deleted)
        $existingApplication = Application::withTrashed()
            ->where('user_id', $user->id)
            ->where('job_listing_id', $jobListing->id)
            ->first();

        if ($existingApplication && !$existingApplication->trashed()) {
            return redirect()->route('backend.apply.show', $existingApplication->id)
                ->with('error', 'You have already applied for this position.');
        }

        // If soft-deleted application exists, we'll handle it during store
        $hasSoftDeleted = $existingApplication && $existingApplication->trashed();

        return Inertia::render('Backend/Apply/Create', [
            'jobListing' => [
                'id' => $jobListing->id,
                'title' => $jobListing->title,
                'slug' => $jobListing->slug,
                'job_type' => $jobListing->job_type,
                'experience_level' => $jobListing->experience_level,
                'application_deadline' => $jobListing->application_deadline,
                'required_linkedin_link' => $jobListing->required_linkedin_link,
                'required_facebook_link' => $jobListing->required_facebook_link,
                'salary_min' => $jobListing->salary_min,
                'salary_max' => $jobListing->salary_max,
                'as_per_companies_policy' => $jobListing->as_per_companies_policy,
                'is_salary_negotiable' => $jobListing->is_salary_negotiable,
            ],
            'applicantProfile' => [
                'id' => $applicantProfile->id,
                'first_name' => $applicantProfile->first_name,
                'last_name' => $applicantProfile->last_name,
                'email' => $user->email,
                'phone' => $applicantProfile->phone,
                'experience_years' => $applicantProfile->experience_years,
                'current_job_title' => $applicantProfile->current_job_title,
                'social_links' => $applicantProfile->social_links ?? [],
            ],
            'cvs' => $cvs,
            'hasSoftDeleted' => $hasSoftDeleted,
        ]);
    }

    /**
     * Store a new application
     */
    public function store(Request $request, string $slug)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $jobListing = JobListing::where('slug', $slug)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->where('application_deadline', '>=', now())
            ->firstOrFail();

        // Check for existing application (including soft deleted)
        $existingApplication = Application::withTrashed()
            ->where('user_id', $user->id)
            ->where('job_listing_id', $jobListing->id)
            ->first();

        // Handle soft-deleted application - permanently remove it
        if ($existingApplication && $existingApplication->trashed()) {
            try {
                // Delete associated resume file if exists
                if ($existingApplication->resume_path && Storage::disk('public')->exists($existingApplication->resume_path)) {
                    Storage::disk('public')->delete($existingApplication->resume_path);
                }

                // Force delete the soft-deleted application
                $existingApplication->forceDelete();

                Log::info('Soft-deleted application removed for reapplication', [
                    'application_id' => $existingApplication->id,
                    'user_id' => $user->id,
                    'job_listing_id' => $jobListing->id
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to remove soft-deleted application', [
                    'application_id' => $existingApplication->id,
                    'error' => $e->getMessage()
                ]);
                return redirect()->back()->with('error', 'Unable to process your application. Please contact support.');
            }
        } elseif ($existingApplication) {
            // Active application exists
            return redirect()->back()->with('error', 'You have already applied for this position.');
        }

        // Validate based on job requirements
        $rules = [
            'cv_id' => 'required|exists:applicant_cvs,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'expected_salary' => 'nullable|numeric|min:0',
            'cover_letter' => 'nullable|string',
        ];

        // Add social link requirements if needed
        if ($jobListing->required_linkedin_link) {
            $rules['linkedin_link'] = 'required|url|max:255';
        }

        if ($jobListing->required_facebook_link) {
            $rules['facebook_link'] = 'required|url|max:255';
        }

        $validated = $request->validate($rules);

        // Get the CV
        $cv = ApplicantCv::findOrFail($validated['cv_id']);

        // Get applicant profile
        $applicantProfile = $user->applicantProfile;

        if (!$applicantProfile) {
            $applicantProfile = ApplicantProfile::create([
                'user_id' => $user->id,
                'first_name' => explode(' ', $validated['name'])[0] ?? '',
                'last_name' => explode(' ', $validated['name'])[1] ?? '',
                'phone' => $validated['phone'] ?? null,
            ]);
        } else {
            // Update profile with latest info
            $applicantProfile->update([
                'phone' => $validated['phone'] ?? $applicantProfile->phone,
            ]);
        }

        // Create the application
        try {
            $application = Application::create([
                'user_id' => $user->id,
                'job_listing_id' => $jobListing->id,
                'applicant_profile_id' => $applicantProfile->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'expected_salary' => $validated['expected_salary'] ?? null,
                'resume_path' => $cv->cv_path,
                'status' => Application::STATUS_PENDING,
                'linkedin_link' => $validated['linkedin_link'] ?? null,
                'facebook_link' => $validated['facebook_link'] ?? null,
                'ats_calculation_status' => Application::ATS_PENDING,
                'ats_attempt_count' => 0,
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle duplicate entry constraint violation
            if ($e->getCode() === '23000' && str_contains($e->getMessage(), 'applications_job_listing_id_user_id_unique')) {
                Log::warning('Duplicate application detected during creation', [
                    'user_id' => $user->id,
                    'job_listing_id' => $jobListing->id,
                ]);
                return redirect()->back()->with('error', 'You have already applied for this job. Your application is being processed.');
            }

            Log::error('Database error during application creation', [
                'user_id' => $user->id,
                'job_listing_id' => $jobListing->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Unable to submit application due to a system error. Please try again later.');
        }

        Log::info('New application submitted', [
            'application_id' => $application->id,
            'job_id' => $jobListing->id,
            'user_id' => $user->id,
        ]);

        // Calculate ATS score immediately (no queue)
        $atsCalculated = $this->calculateAtsInline($application);

        $message = 'Application submitted successfully!';
        if ($atsCalculated) {
            $message .= ' Your ATS score was calculated.';
        } else {
            $message .= ' ATS score calculation failed. You can retry from the application page.';
        }

        return redirect()->route('backend.apply.show', $application->id)
            ->with('success', $message);
    }

    /**
     * Calculate ATS score inline (synchronously)
     */
    private function calculateAtsInline(Application $application): bool
    {
        try {
            $application->load('jobListing');

            if (!$application->jobListing) {
                throw new \Exception('Job listing not found for ATS calculation');
            }

            $application->update(['ats_calculation_status' => Application::ATS_PROCESSING]);

            $result = $this->atsService->calculateScore($application, $application->jobListing);

            $application->update([
                'ats_score' => $result,
                'matched_keywords' => $result['matched_keywords'] ?? [],
                'missing_keywords' => $result['missing_keywords'] ?? [],
                'ats_calculation_status' => Application::ATS_COMPLETED,
                'ats_last_attempted_at' => now(),
                'ats_attempt_count' => ($application->ats_attempt_count ?? 0) + 1,
            ]);

            Log::info('ATS calculated inline successfully', [
                'application_id' => $application->id,
                'percentage' => $result['percentage'] ?? 0
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('ATS calculation failed inline: ' . $e->getMessage(), [
                'application_id' => $application->id
            ]);

            $this->markAtsFailed($application, $e->getMessage());
            return false;
        }
    }

    /**
     * Mark ATS calculation as failed
     */
    private function markAtsFailed(Application $application, string $errorMessage): void
    {
        $application->update([
            'ats_calculation_status' => Application::ATS_FAILED,
            'ats_score' => [
                'percentage' => 0,
                'error' => $errorMessage,
                'status' => 'failed',
                'analysis' => [
                    'level' => 'Error',
                    'message' => 'We are having trouble calculating the ATS score. Please try recalculating later.',
                    'color' => 'red',
                    'matched_count' => 0,
                    'missing_count' => 0,
                    'top_matched' => [],
                    'top_missing' => [],
                    'suggestions' => [
                        'Our system encountered an error while calculating your ATS score.',
                        'Please try uploading a different resume format (PDF, DOC, or DOCX).',
                        'Contact support if the issue persists.'
                    ]
                ]
            ],
            'ats_last_attempted_at' => now(),
        ]);
    }

    /**
     * Show a specific application (including soft-deleted ones)
     */
    public function show(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::withTrashed()
            ->with(['jobListing', 'jobListing.employer', 'applicantProfile'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Check if application is soft deleted
        $isDeleted = $application->trashed();

        // Get the CV URL
        $cvUrl = null;
        if ($application->resume_path) {
            $cvUrl = asset('storage/' . $application->resume_path);
        }

        // Get status timeline
        $statusTimeline = $application->statusTimelines()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($timeline) {
                return [
                    'status' => $timeline->status,
                    'notes' => $timeline->notes,
                    'created_at' => $timeline->created_at,
                ];
            });

        // Get ATS score percentage
        $atsPercentage = $application->getAtsScorePercentageAttribute();

        // Get ATS score details if available
        $atsDetails = $this->formatAtsDetails($application);

        // Get ATS calculation status for UI
        $atsStatus = [
            'status' => $application->ats_calculation_status,
            'can_recalculate' => $this->canRecalculateAts($application),
            'is_stuck' => $application->isAtsCalculationStuck(),
        ];

        // Add deleted_at to response
        $applicationData = [
            'id' => $application->id,
            'name' => $application->name,
            'email' => $application->email,
            'phone' => $application->phone,
            'expected_salary' => $application->expected_salary,
            'status' => $application->status,
            'created_at' => $application->created_at,
            'updated_at' => $application->updated_at,
            'linkedin_link' => $application->linkedin_link,
            'facebook_link' => $application->facebook_link,
            'employer_notes' => $application->employer_notes,
            'resume_url' => $cvUrl,
            'resume_name' => $application->resume_path ? basename($application->resume_path) : null,
            'ats_score' => $atsPercentage,
            'ats_calculation_status' => $application->ats_calculation_status,
        ];

        // Add deleted_at if soft deleted
        if ($isDeleted) {
            $applicationData['deleted_at'] = $application->deleted_at;
        }

        return Inertia::render('Backend/Apply/Show', [
            'application' => $applicationData,
            'jobListing' => [
                'id' => $application->jobListing->id,
                'title' => $application->jobListing->title,
                'slug' => $application->jobListing->slug,
                'job_type' => $application->jobListing->job_type,
                'experience_level' => $application->jobListing->experience_level,
                'description' => $application->jobListing->description,
                'employer' => $application->jobListing->employer ? [
                    'name' => $application->jobListing->employer->name,
                    'email' => $application->jobListing->employer->email,
                ] : null,
            ],
            'applicantProfile' => $application->applicantProfile ? [
                'id' => $application->applicantProfile->id,
                'first_name' => $application->applicantProfile->first_name,
                'last_name' => $application->applicantProfile->last_name,
                'phone' => $application->applicantProfile->phone,
                'experience_years' => $application->applicantProfile->experience_years,
                'current_job_title' => $application->applicantProfile->current_job_title,
            ] : null,
            'statusTimeline' => $statusTimeline,
            'atsDetails' => $atsDetails,
            'atsStatus' => $atsStatus,
            'isDeleted' => $isDeleted,
        ]);
    }

    /**
     * Format ATS details for frontend display
     */
    private function formatAtsDetails(?Application $application): ?array
    {
        if (!$application || !$application->isAtsCompleted() || !$application->ats_score) {
            return null;
        }

        $atsScore = $application->ats_score;

        return [
            'percentage' => $atsScore['percentage'] ?? 0,
            'matched_keywords' => $application->matched_keywords ?? ($atsScore['matched_keywords'] ?? []),
            'missing_keywords' => $application->missing_keywords ?? ($atsScore['missing_keywords'] ?? []),
            'matched_count' => $atsScore['matched_count'] ?? count($application->matched_keywords ?? []),
            'total_keywords' => $atsScore['total_keywords'] ?? 0,
            'extracted_skills' => $atsScore['extracted_skills'] ?? [],
            'extracted_experience_years' => $atsScore['extracted_experience_years'] ?? 0,
            'extracted_education' => $atsScore['extracted_education'] ?? 'Not specified',
            'analysis' => $atsScore['analysis'] ?? [
                'level' => 'N/A',
                'message' => 'Analysis not available',
                'color' => 'gray',
                'suggestions' => []
            ],
            'calculated_at' => $atsScore['calculated_at'] ?? null,
        ];
    }

    /**
     * Check if ATS can be recalculated
     */
    private function canRecalculateAts(Application $application): bool
    {
        // Cannot recalculate if status is processing and not stuck
        if ($application->ats_calculation_status === Application::ATS_PROCESSING) {
            return $application->isAtsCalculationStuck();
        }

        // Can recalculate if completed (to refresh) or failed
        return in_array($application->ats_calculation_status, [
            Application::ATS_COMPLETED,
            Application::ATS_FAILED
        ]);
    }

    /**
     * Recalculate ATS score for an application
     */
    public function recalculateAts(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::where('user_id', Auth::id())
            ->findOrFail($id);

        // Check if recalculation is allowed
        if (!$this->canRecalculateAts($application)) {
            return response()->json([
                'success' => false,
                'error' => 'ATS calculation is already in progress. Please wait.'
            ], 422);
        }

        try {
            Log::info('ATS recalculation requested (inline)', [
                'application_id' => $application->id
            ]);

            $inlineSuccess = $this->calculateAtsInline($application);

            if ($inlineSuccess) {
                $message = 'ATS score recalculated successfully!';
            } else {
                $message = 'ATS score recalculation encountered an error. Please try again later.';
            }

            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message
                ]);
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Failed to queue ATS recalculation: ' . $e->getMessage(), [
                'application_id' => $application->id
            ]);

            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to queue recalculation: ' . $e->getMessage()
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to queue recalculation.');
        }
    }

    /**
     * Show form to edit an application (only if pending)
     */
    public function edit(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::with(['jobListing', 'applicantProfile'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Only allow editing if status is pending
        if ($application->status !== Application::STATUS_PENDING) {
            return redirect()->route('backend.apply.show', $application->id)
                ->with('error', 'You cannot edit this application as it has already been reviewed.');
        }

        $applicantProfile = $application->applicantProfile ?? $user->applicantProfile;

        // Get user's CVs
        $cvs = [];
        $currentCvId = null;

        if ($applicantProfile) {
            $cvs = ApplicantCv::where('applicant_profile_id', $applicantProfile->id)
                ->where('status', 'active')
                ->orderBy('is_primary', 'desc')
                ->orderBy('order_position')
                ->get()
                ->map(function ($cv) {
                    return [
                        'id' => $cv->id,
                        'original_name' => $cv->original_name,
                        'url' => $cv->url,
                        'is_primary' => $cv->is_primary,
                        'order_position' => $cv->order_position,
                    ];
                });

            // Find the CV that matches the current application's resume_path
            foreach ($cvs as $cv) {
                $cvPath = $cv['url'] ? str_replace(asset('storage/'), '', $cv['url']) : '';
                if ($cvPath === $application->resume_path) {
                    $currentCvId = $cv['id'];
                    break;
                }
            }

            // If no match found by path, try to find by primary or first
            if (!$currentCvId && $cvs->isNotEmpty()) {
                $primaryCv = $cvs->firstWhere('is_primary', true);
                $currentCvId = $primaryCv ? $primaryCv['id'] : $cvs->first()['id'];
            }
        }

        // Get ATS score percentage
        $atsPercentage = $application->getAtsScorePercentageAttribute();

        return Inertia::render('Backend/Apply/Edit', [
            'application' => [
                'id' => $application->id,
                'name' => $application->name,
                'email' => $application->email,
                'phone' => $application->phone,
                'expected_salary' => $application->expected_salary,
                'linkedin_link' => $application->linkedin_link,
                'facebook_link' => $application->facebook_link,
                'resume_path' => $application->resume_path,
                'ats_calculation_status' => $application->ats_calculation_status,
                'ats_score' => $atsPercentage,
                'created_at' => $application->created_at,
            ],
            'jobListing' => [
                'id' => $application->jobListing->id,
                'title' => $application->jobListing->title,
                'slug' => $application->jobListing->slug,
                'job_type' => $application->jobListing->job_type,
                'experience_level' => $application->jobListing->experience_level,
                'salary_min' => $application->jobListing->salary_min,
                'salary_max' => $application->jobListing->salary_max,
                'as_per_companies_policy' => $application->jobListing->as_per_companies_policy,
                'is_salary_negotiable' => $application->jobListing->is_salary_negotiable,
                'required_linkedin_link' => $application->jobListing->required_linkedin_link,
                'required_facebook_link' => $application->jobListing->required_facebook_link,
                'application_deadline' => $application->jobListing->application_deadline,
                'employer' => $application->jobListing->employer ? [
                    'name' => $application->jobListing->employer->name,
                ] : null,
            ],
            'cvs' => $cvs,
            'currentCvId' => $currentCvId,
        ]);
    }

    /**
     * Update an existing application
     */
    public function update(Request $request, int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::where('user_id', Auth::id())
            ->findOrFail($id);

        // Only allow updating if status is pending
        if ($application->status !== Application::STATUS_PENDING) {
            return redirect()->route('backend.apply.show', $application->id)
                ->with('error', 'You cannot edit this application as it has already been reviewed.');
        }

        $jobListing = $application->jobListing;

        // Validation rules
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'expected_salary' => 'nullable|numeric|min:0',
            'cv_id' => 'required|exists:applicant_cvs,id',
        ];

        if ($jobListing->required_linkedin_link) {
            $rules['linkedin_link'] = 'nullable|url|max:255';
        }

        if ($jobListing->required_facebook_link) {
            $rules['facebook_link'] = 'nullable|url|max:255';
        }

        $validated = $request->validate($rules);

        // Get the CV
        $cv = ApplicantCv::findOrFail($validated['cv_id']);

        // Check if resume has changed
        $resumeChanged = $application->resume_path !== $cv->cv_path;

        // Update the application
        $application->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'expected_salary' => $validated['expected_salary'] ?? null,
            'resume_path' => $cv->cv_path,
            'linkedin_link' => $validated['linkedin_link'] ?? null,
            'facebook_link' => $validated['facebook_link'] ?? null,
        ]);

        // Update applicant profile with latest info
        if ($application->applicantProfile) {
            $application->applicantProfile->update([
                'phone' => $validated['phone'] ?? $application->applicantProfile->phone,
            ]);
        }

        // Reset ATS calculation status if resume changed
        if ($resumeChanged) {
            $application->update([
                'ats_calculation_status' => Application::ATS_PENDING,
                'ats_score' => null,
                'matched_keywords' => null,
                'missing_keywords' => null,
                'ats_attempt_count' => 0,
            ]);

            // Recalculate ATS score with new resume
            $this->calculateAtsInline($application);

            Log::info('ATS recalculated after resume change', [
                'application_id' => $application->id,
                'old_resume' => $application->getOriginal('resume_path'),
                'new_resume' => $cv->cv_path
            ]);
        }

        Log::info('Application updated', [
            'application_id' => $application->id,
            'user_id' => Auth::id(),
            'resume_changed' => $resumeChanged
        ]);

        return redirect()->route('backend.apply.show', $application->id)
            ->with('success', 'Application updated successfully!' . ($resumeChanged ? ' ATS score has been recalculated.' : ''));
    }

    /**
     * Get ATS status for an application (AJAX endpoint)
     */
    public function getAtsStatus(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'status' => $application->ats_calculation_status,
            'score' => $application->getAtsScorePercentageAttribute(),
            'can_recalculate' => $this->canRecalculateAts($application),
            'is_stuck' => $application->isAtsCalculationStuck(),
        ]);
    }

    /**
     * Withdraw/Cancel an application (Soft Delete) - Clear resume_path
     */
    public function destroy(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::where('user_id', Auth::id())
            ->findOrFail($id);

        // Only allow withdrawal if status is pending
        if ($application->status !== Application::STATUS_PENDING) {
            return redirect()->back()->with('error', 'You cannot withdraw this application as it has already been reviewed.');
        }

        // Clear the resume_path before soft deleting
        $application->update([
            'resume_path' => null,
        ]);

        // Soft delete the application
        $application->delete();

        Log::info('Application withdrawn (soft deleted - resume_path cleared)', [
            'application_id' => $application->id,
            'user_id' => Auth::id(),
        ]);

        return redirect()->route('backend.apply.index')
            ->with('success', 'Application withdrawn successfully.');
    }

    /**
     * Restore a soft-deleted application
     */
    public function restore(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::withTrashed()
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Check if application is actually soft deleted
        if (!$application->trashed()) {
            return redirect()->back()->with('error', 'This application is not deleted.');
        }

        // Restore the application
        $application->restore();

        Log::info('Application restored', [
            'application_id' => $application->id,
            'user_id' => Auth::id(),
            'job_listing_id' => $application->job_listing_id,
        ]);

        return redirect()->route('backend.apply.show', $application->id)
            ->with('success', 'Application restored successfully.');
    }

    /**
     * Permanently delete a soft-deleted application (Force Delete)
     */
    public function forceDelete(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $application = Application::withTrashed()
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Check if application is actually soft deleted
        if (!$application->trashed()) {
            return redirect()->back()->with('error', 'Please withdraw the application first before permanently deleting.');
        }

        try {
            // Delete associated resume file if exists            
            if ($application->resume_path && Storage::disk('public')->exists($application->resume_path)) {
                Storage::disk('public')->delete($application->resume_path);
            }

            // Force delete the application
            $application->forceDelete();

            Log::info('Application force deleted permanently', [
                'application_id' => $application->id,
                'user_id' => Auth::id(),
                'job_listing_id' => $application->job_listing_id,
                'resume_deleted' => true
            ]);

            return redirect()->route('backend.apply.index')
                ->with('success', 'Application permanently deleted.');
        } catch (\Exception $e) {
            Log::error('Failed to force delete application', [
                'application_id' => $application->id,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Failed to delete application. Please try again.');
        }
    }

    /**
     * List all soft-deleted applications for the authenticated user
     */
    public function trashed(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        $query = Application::onlyTrashed()
            ->where('user_id', $user->id)
            ->with(['jobListing', 'jobListing.employer'])
            ->orderBy('deleted_at', 'desc');

        // Search by job title
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('jobListing', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $applications = $query->paginate(10)->through(function ($application) {
            // Extract ATS score percentage correctly
            $atsPercentage = null;
            if ($application->ats_score) {
                if (is_array($application->ats_score)) {
                    $atsPercentage = $application->ats_score['percentage'] ?? null;
                } elseif (is_string($application->ats_score)) {
                    $atsData = json_decode($application->ats_score, true);
                    $atsPercentage = $atsData['percentage'] ?? null;
                }
            }

            // Also try the accessor method
            if (!$atsPercentage) {
                $atsPercentage = $application->getAtsScorePercentageAttribute();
            }

            return [
                'id' => $application->id,
                'job_title' => $application->jobListing->title,
                'job_slug' => $application->jobListing->slug,
                'employer_name' => $application->jobListing->employer->name ?? 'Unknown',
                'status' => $application->status,
                'expected_salary' => $application->expected_salary,
                'created_at' => $application->created_at,
                'deleted_at' => $application->deleted_at,
                'ats_score' => $atsPercentage,
                'ats_calculation_status' => $application->ats_calculation_status,
            ];
        });

        $stats = [
            'total_deleted' => Application::onlyTrashed()->where('user_id', $user->id)->count(),
        ];

        return Inertia::render('Backend/Apply/Index', [
            'applications' => $applications,
            'stats' => $stats,
            'filters' => $request->only(['search']),
            'showTrashed' => true,
        ]);
    }
}
