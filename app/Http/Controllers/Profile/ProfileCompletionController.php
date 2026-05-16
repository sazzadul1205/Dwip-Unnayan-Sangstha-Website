<?php
// app/Http/Controllers/Profile/ProfileCompletionController.php

namespace App\Http\Controllers\Profile;

// inertia
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

// models
use App\Models\JobHistory;
use App\Models\Achievement;
use App\Models\ApplicantCv;
use App\Models\ApplicantProfile;
use App\Models\EducationHistory;
use App\Models\User;

class ProfileCompletionController extends Controller
{

    // middleware
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Show the profile completion page.
     */
    public function show(): Response|RedirectResponse
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check if user has permission to complete profile (job seekers only)
        if (!$user->hasPermission('profile_completion.show')) {
            return redirect()->route('dashboard')
                ->with('error', 'You do not have permission to access profile completion.');
        }

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        if ($profile && method_exists($profile, 'isComplete') && $profile->isComplete()) {
            return redirect()->route('dashboard');
        }

        $profileData = null;
        if ($profile) {
            $profile->load([
                'cvs' => function ($query) {
                    $query->select([
                        'id',
                        'applicant_profile_id',
                        'original_name',
                        'status',
                        'is_primary',
                        'order_position',
                        'created_at',
                        'cv_path',
                    ])->orderBy('order_position');
                },
                'jobHistories' => function ($query) {
                    $query->select([
                        'id',
                        'applicant_profile_id',
                        'company_name',
                        'position',
                        'starting_year',
                        'ending_year',
                        'is_current',
                    ])->orderBy('starting_year', 'desc');
                },
                'educationHistories' => function ($query) {
                    $query->select([
                        'id',
                        'applicant_profile_id',
                        'institution_name',
                        'degree',
                        'passing_year',
                    ])->orderBy('passing_year', 'desc');
                },
                'achievements' => function ($query) {
                    $query->select([
                        'id',
                        'applicant_profile_id',
                        'achievement_name',
                        'achievement_details',
                    ])->orderBy('created_at', 'desc');
                },
            ]);

            $profileData = [
                'id' => $profile->id,
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'birth_date' => $profile->birth_date?->format('Y-m-d'),
                'gender' => $profile->gender,
                'blood_type' => $profile->blood_type,
                'phone' => $profile->phone,
                'address' => $profile->address,
                'social_links' => $profile->social_links ?? [],
                'experience_years' => $profile->experience_years,
                'current_job_title' => $profile->current_job_title,
                'photo_path' => $profile->photo_path ?? null,
                'cvs' => $profile->cvs->map(function ($cv) {
                    return [
                        'id' => $cv->id,
                        'original_name' => $cv->original_name,
                        'status' => $cv->status,
                        'is_primary' => $cv->is_primary,
                        'order_position' => $cv->order_position,
                        'upload_date' => $cv->created_at?->toISOString(),
                        'cv_path' => $cv->cv_path,
                    ];
                })->values(),
                'job_histories' => $profile->jobHistories->map(function ($job) {
                    return [
                        'id' => $job->id,
                        'company_name' => $job->company_name,
                        'position' => $job->position,
                        'starting_year' => $job->starting_year,
                        'ending_year' => $job->ending_year,
                        'is_current' => $job->is_current,
                    ];
                })->values(),
                'education_histories' => $profile->educationHistories->map(function ($edu) {
                    return [
                        'id' => $edu->id,
                        'institution_name' => $edu->institution_name,
                        'degree' => $edu->degree,
                        'passing_year' => $edu->passing_year,
                    ];
                })->values(),
                'achievements' => $profile->achievements->map(function ($ach) {
                    return [
                        'id' => $ach->id,
                        'achievement_name' => $ach->achievement_name,
                        'achievement_details' => $ach->achievement_details,
                    ];
                })->values(),
            ];
        }

        return Inertia::render('auth/completeProfile', [
            'applicantProfile' => $profileData,
        ]);
    }

    /**
     * Store or update profile
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to complete profile
        if (!$user->hasPermission('profile_completion.store')) {
            return redirect()->route('dashboard')
                ->with('error', 'You do not have permission to complete profile.');
        }

        $validated = $request->validate([
            // Basic Info
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:3',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',

            // Professional Info
            'experience_years' => 'nullable|integer|min:0|max:60',
            'current_job_title' => 'nullable|string|max:255',
            'social_links' => 'nullable|array',

            // CVs
            'cvs' => 'nullable|array',
            'cvs.*.id' => 'nullable|exists:applicant_cvs,id',
            'cvs.*.file' => 'nullable|file|mimetypes:application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document|max:5120',
            'cvs.*.original_name' => 'nullable|string',
            'cvs.*.is_primary' => 'nullable|boolean',
            'cvs.*.order_position' => 'nullable|integer',
            'cvs.*.to_delete' => 'nullable|boolean',

            // Job History
            'job_histories' => 'nullable|array|max:' . JobHistory::MAX_ENTRIES_PER_PROFILE,
            'job_histories.*.id' => 'nullable|integer',
            'job_histories.*.company_name' => 'required|string|max:255',
            'job_histories.*.position' => 'required|string|max:255',
            'job_histories.*.starting_year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'job_histories.*.ending_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'job_histories.*.is_current' => 'nullable|boolean',
            'job_histories.*.to_delete' => 'nullable|boolean',

            // Education
            'education_histories' => 'nullable|array|max:' . EducationHistory::MAX_ENTRIES_PER_PROFILE,
            'education_histories.*.id' => 'nullable|integer',
            'education_histories.*.institution_name' => 'required|string|max:255',
            'education_histories.*.degree' => 'required|string|max:255',
            'education_histories.*.passing_year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'education_histories.*.to_delete' => 'nullable|boolean',

            // Achievements
            'achievements' => 'nullable|array|max:' . Achievement::MAX_ACHIEVEMENTS_PER_PROFILE,
            'achievements.*.id' => 'nullable|integer',
            'achievements.*.achievement_name' => 'required|string|max:255',
            'achievements.*.achievement_details' => 'nullable|string',
            'achievements.*.to_delete' => 'nullable|boolean',
        ]);

        try {
            DB::transaction(function () use ($validated, $user) {
                // Handle photo upload first
                $photoPath = null;
                if (isset($validated['photo']) && $validated['photo'] instanceof UploadedFile) {
                    $photoPath = $this->handlePhotoUpload($validated['photo'], $user->id);
                }

                $profileData = [
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'birth_date' => $validated['birth_date'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'blood_type' => $validated['blood_type'] ?? null,
                    'phone' => $validated['phone'],
                    'address' => $validated['address'] ?? null,
                    'social_links' => $validated['social_links'] ?? [],
                    'experience_years' => $validated['experience_years'] ?? null,
                    'current_job_title' => $validated['current_job_title'] ?? null,
                ];

                $profile = ApplicantProfile::updateOrCreate(
                    ['user_id' => $user->id],
                    $profileData
                );

                // Update photo separately if provided
                if ($photoPath) {
                    if ($profile->photo_path && Storage::disk('public')->exists($profile->photo_path)) {
                        Storage::disk('public')->delete($profile->photo_path);
                    }
                    $profile->photo_path = $photoPath;
                    $profile->save();
                }

                if (!empty($validated['cvs'])) {
                    $this->handleCVs($profile->id, $validated['cvs']);
                }

                if (!empty($validated['job_histories'])) {
                    $this->handleJobHistories($profile->id, $validated['job_histories']);
                }

                if (!empty($validated['education_histories'])) {
                    $this->handleEducationHistories($profile->id, $validated['education_histories']);
                }

                if (!empty($validated['achievements'])) {
                    $this->handleAchievements($profile->id, $validated['achievements']);
                }

                $this->activatePendingCvs($profile->id);
            });

            return redirect()->route('dashboard')->with('success', 'Profile completed successfully!');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Throwable $e) {
            Log::error('Profile completion failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'error' => 'Failed to save profile. Please try again. ' . $e->getMessage()
            ])->withInput();
        }
    }

    /**
     * Handle photo upload
     */
    private function handlePhotoUpload(UploadedFile $photo, int $userId): string
    {
        $fileName = 'profile_' . $userId . '_' . time() . '.' . $photo->getClientOriginalExtension();
        $path = $photo->storeAs('profile_photos', $fileName, 'public');
        return $path;
    }

    /**
     * Upload profile photo (separate endpoint)
     */
    public function uploadPhoto(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profile_completion.upload_photo')) {
            return response()->json(['error' => 'You do not have permission to upload photo.'], 403);
        }

        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $profile = ApplicantProfile::firstOrCreate(
            ['user_id' => $user->id],
            $this->placeholderProfileData($user)
        );

        if ($profile->photo_path && Storage::disk('public')->exists($profile->photo_path)) {
            Storage::disk('public')->delete($profile->photo_path);
        }

        $fileName = 'profile_' . $user->id . '_' . time() . '.' . $request->file('photo')->getClientOriginalExtension();
        $path = $request->file('photo')->storeAs('profile_photos', $fileName, 'public');

        $profile->photo_path = $path;
        $profile->save();

        return response()->json([
            'success' => true,
            'photo_url' => asset('storage/' . $path),
            'photo_path' => $path,
            'message' => 'Photo uploaded successfully'
        ]);
    }

    /**
     * Delete profile photo
     */
    public function deletePhoto(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profile_completion.delete_photo')) {
            return response()->json(['error' => 'You do not have permission to delete photo.'], 403);
        }

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        if ($profile && $profile->photo_path) {
            if (Storage::disk('public')->exists($profile->photo_path)) {
                Storage::disk('public')->delete($profile->photo_path);
            }
            $profile->photo_path = null;
            $profile->save();

            return response()->json([
                'success' => true,
                'message' => 'Photo deleted successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No photo found to delete'
        ], 404);
    }

    /**
     * Handle CVs
     * Save uploaded CVs as pending by default
     */
    private function handleCVs(int $profileId, array $cvs): void
    {
        $activeCount = ApplicantCv::where('applicant_profile_id', $profileId)
            ->where('status', 'active')
            ->count();

        foreach ($cvs as $index => $cvData) {
            // Delete CV
            if (!empty($cvData['to_delete']) && isset($cvData['id'])) {
                $cv = ApplicantCv::where('id', $cvData['id'])
                    ->where('applicant_profile_id', $profileId)
                    ->first();

                if ($cv) {
                    if ($cv->cv_path && Storage::disk('public')->exists($cv->cv_path)) {
                        Storage::disk('public')->delete($cv->cv_path);
                    }
                    $cv->forceDelete();
                    $activeCount--;
                }
                continue;
            }

            // Update existing CV
            if (isset($cvData['id'])) {
                $updatePayload = [];
                if (array_key_exists('is_primary', $cvData)) {
                    $updatePayload['is_primary'] = (bool) $cvData['is_primary'];
                }
                if (array_key_exists('order_position', $cvData) && $cvData['order_position'] !== null) {
                    $updatePayload['order_position'] = $cvData['order_position'];
                }

                if (!empty($updatePayload)) {
                    ApplicantCv::where('id', $cvData['id'])
                        ->where('applicant_profile_id', $profileId)
                        ->update($updatePayload);
                }
                continue;
            }

            // Upload new CV
            if (isset($cvData['file']) && $cvData['file'] instanceof UploadedFile) {
                if ($activeCount >= ApplicantCv::MAX_CVS_PER_PROFILE) {
                    throw ValidationException::withMessages([
                        'cvs' => sprintf('Maximum %d active CVs allowed.', ApplicantCv::MAX_CVS_PER_PROFILE)
                    ]);
                }

                $path = $cvData['file']->store("cvs/{$profileId}", 'public');
                $isPrimary = !empty($cvData['is_primary']);

                $cv = ApplicantCv::create([
                    'applicant_profile_id' => $profileId,
                    'cv_path' => $path,
                    'original_name' => $cvData['original_name'] ?? $cvData['file']->getClientOriginalName(),
                    'order_position' => $cvData['order_position'] ?? $activeCount,
                    'is_primary' => $activeCount === 0 ? true : $isPrimary,
                    'status' => 'pending',
                ]);

                if ($activeCount === 0) {
                    $cv->is_primary = true;
                    $cv->save();
                }
                $activeCount++;
            }
        }

        ApplicantCv::reorderCvs($profileId);
    }

    /**
     * Upload a CV immediately and mark it as pending until profile completion.
     */
    public function uploadCv(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user->hasPermission('profile_completion.upload_cv')) {
            return response()->json(['error' => 'You do not have permission to upload CV.'], 403);
        }

        $validated = $request->validate([
            'cv' => 'required|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $profile = ApplicantProfile::firstOrCreate(
            ['user_id' => $user->id],
            $this->placeholderProfileData($user)
        );

        if (ApplicantCv::hasReachedMaxEntries($profile->id, true)) {
            return response()->json([
                'message' => sprintf('Maximum %d CVs reached.', ApplicantCv::MAX_CVS_PER_PROFILE),
            ], 422);
        }

        $path = $validated['cv']->store("cvs/{$profile->id}", 'public');

        $maxPosition = ApplicantCv::where('applicant_profile_id', $profile->id)
            ->max('order_position');
        $nextPosition = is_null($maxPosition) ? 0 : $maxPosition + 1;

        $cv = ApplicantCv::create([
            'applicant_profile_id' => $profile->id,
            'cv_path' => $path,
            'original_name' => $validated['cv']->getClientOriginalName(),
            'order_position' => $nextPosition,
            'is_primary' => false,
            'status' => 'pending',
        ]);

        return response()->json([
            'id' => $cv->id,
            'original_name' => $cv->original_name,
            'size' => $validated['cv']->getSize(),
            'type' => $validated['cv']->getMimeType(),
            'url' => asset('storage/' . $cv->cv_path),
            'is_primary' => $cv->is_primary,
            'status' => $cv->status,
            'order_position' => $cv->order_position,
            'upload_date' => $cv->created_at?->toISOString(),
        ]);
    }

    /**
     * Remove a CV (pending or active).
     */
    public function destroyCv(ApplicantCv $cv): RedirectResponse
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($cv->applicantProfile?->user_id !== $user->id) {
            abort(403);
        }

        if (!$user->hasPermission('profile_completion.destroy_cv')) {
            return back()->with('error', 'You do not have permission to delete CV.');
        }

        if ($cv->cv_path && Storage::disk('public')->exists($cv->cv_path)) {
            Storage::disk('public')->delete($cv->cv_path);
        }

        $cv->forceDelete();
        ApplicantCv::reorderCvs($cv->applicant_profile_id);

        return back()->with('success', 'CV removed successfully.');
    }

    /**
     * Set a CV as primary (active only).
     */
    public function setPrimaryCv(ApplicantCv $cv): RedirectResponse
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if ($cv->applicantProfile?->user_id !== $user->id) {
            abort(403);
        }

        if (!$user->hasPermission('profile_completion.set_primary_cv')) {
            return back()->with('error', 'You do not have permission to set primary CV.');
        }

        if ($cv->status !== 'active') {
            return back()->with('error', 'Only active CVs can be set as primary.');
        }

        $cv->setAsPrimary();

        return back()->with('success', 'Primary CV updated successfully.');
    }

    /**
     * Promote pending CVs once profile is completed.
     */
    private function activatePendingCvs(int $profileId): void
    {
        $pendingCount = ApplicantCv::where('applicant_profile_id', $profileId)
            ->where('status', 'pending')
            ->count();

        $activeCount = ApplicantCv::where('applicant_profile_id', $profileId)
            ->where('status', 'active')
            ->count();

        $canActivate = min($pendingCount, ApplicantCv::MAX_CVS_PER_PROFILE - $activeCount);

        if ($canActivate > 0) {
            ApplicantCv::where('applicant_profile_id', $profileId)
                ->where('status', 'pending')
                ->limit($canActivate)
                ->update(['status' => 'active']);

            ApplicantCv::reorderCvs($profileId);

            $primary = ApplicantCv::getPrimaryCv($profileId);
            if (!$primary) {
                $first = ApplicantCv::where('applicant_profile_id', $profileId)
                    ->where('status', 'active')
                    ->orderBy('order_position')
                    ->first();
                if ($first) {
                    $first->setAsPrimary();
                }
            }
        }
    }

    /**
     * Seed a temporary profile for early CV uploads.
     */
    private function placeholderProfileData(User $user): array
    {
        $name = trim((string) $user->name);
        if ($name === '') {
            $email = Str::before((string) $user->email, '@');
            $name = Str::of($email)->replace(['.', '_', '-'], ' ')->title();
        }

        [$first, $last] = array_pad(preg_split('/\s+/', $name, 2) ?: [], 2, null);

        return [
            'first_name' => $first ?? '',
            'last_name' => $last ?? '',
        ];
    }

    /**
     * Handle Job Histories with max limit validation
     */
    private function handleJobHistories(int $profileId, array $jobs): void
    {
        $existingCount = JobHistory::where('applicant_profile_id', $profileId)->count();
        $newCount = 0;

        foreach ($jobs as $job) {
            if (!empty($job['to_delete']) && isset($job['id'])) {
                JobHistory::where('id', $job['id'])
                    ->where('applicant_profile_id', $profileId)
                    ->delete();
                $existingCount--;
                continue;
            }

            if (!empty($job['is_current'])) {
                $job['ending_year'] = null;
            }

            $payload = [
                'company_name' => $job['company_name'] ?? null,
                'position' => $job['position'] ?? null,
                'starting_year' => $job['starting_year'] ?? null,
                'ending_year' => $job['ending_year'] ?? null,
                'is_current' => $job['is_current'] ?? false,
            ];

            if (isset($job['id'])) {
                $existing = JobHistory::where('id', $job['id'])
                    ->where('applicant_profile_id', $profileId)
                    ->first();

                if ($existing) {
                    $existing->update($payload);
                    continue;
                }
            }

            if (($existingCount + $newCount) >= JobHistory::MAX_ENTRIES_PER_PROFILE) {
                throw ValidationException::withMessages([
                    'job_histories' => sprintf('Maximum %d job history entries allowed.', JobHistory::MAX_ENTRIES_PER_PROFILE)
                ]);
            }
            $payload['applicant_profile_id'] = $profileId;
            JobHistory::create($payload);
            $newCount++;
        }
    }

    /**
     * Handle Education Histories with max limit validation
     */
    private function handleEducationHistories(int $profileId, array $educations): void
    {
        $existingCount = EducationHistory::where('applicant_profile_id', $profileId)->count();
        $newCount = 0;

        foreach ($educations as $edu) {
            if (!empty($edu['to_delete']) && isset($edu['id'])) {
                EducationHistory::where('id', $edu['id'])
                    ->where('applicant_profile_id', $profileId)
                    ->delete();
                $existingCount--;
                continue;
            }

            $payload = [
                'institution_name' => $edu['institution_name'] ?? null,
                'degree' => $edu['degree'] ?? null,
                'passing_year' => $edu['passing_year'] ?? null,
            ];

            if (isset($edu['id'])) {
                $existing = EducationHistory::where('id', $edu['id'])
                    ->where('applicant_profile_id', $profileId)
                    ->first();

                if ($existing) {
                    $existing->update($payload);
                    continue;
                }
            }

            if (($existingCount + $newCount) >= EducationHistory::MAX_ENTRIES_PER_PROFILE) {
                throw ValidationException::withMessages([
                    'education_histories' => sprintf('Maximum %d education history entries allowed.', EducationHistory::MAX_ENTRIES_PER_PROFILE)
                ]);
            }
            $payload['applicant_profile_id'] = $profileId;
            EducationHistory::create($payload);
            $newCount++;
        }
    }

    /**
     * Handle Achievements with max limit validation
     */
    private function handleAchievements(int $profileId, array $achievements): void
    {
        $existingCount = Achievement::where('applicant_profile_id', $profileId)->count();
        $newCount = 0;

        foreach ($achievements as $ach) {
            if (!empty($ach['to_delete']) && isset($ach['id'])) {
                Achievement::where('id', $ach['id'])
                    ->where('applicant_profile_id', $profileId)
                    ->delete();
                $existingCount--;
                continue;
            }

            $payload = [
                'achievement_name' => $ach['achievement_name'] ?? null,
                'achievement_details' => $ach['achievement_details'] ?? null,
            ];

            if (isset($ach['id'])) {
                $existing = Achievement::where('id', $ach['id'])
                    ->where('applicant_profile_id', $profileId)
                    ->first();

                if ($existing) {
                    $existing->update($payload);
                    continue;
                }
            }

            if (($existingCount + $newCount) >= Achievement::MAX_ACHIEVEMENTS_PER_PROFILE) {
                throw ValidationException::withMessages([
                    'achievements' => sprintf('Maximum %d achievements allowed.', Achievement::MAX_ACHIEVEMENTS_PER_PROFILE)
                ]);
            }
            $payload['applicant_profile_id'] = $profileId;
            Achievement::create($payload);
            $newCount++;
        }
    }
}
