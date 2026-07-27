<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\ApplicantCv;
use App\Models\ApplicantProfile;
use App\Models\EducationHistory;
use App\Models\JobHistory;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ApplicantProfileController extends Controller
{
    protected array $allowedPhotoExtensions = ['jpeg', 'png', 'jpg', 'gif', 'webp'];
    protected array $allowedCvExtensions = ['pdf', 'doc', 'docx'];
    protected int $maxPhotoSize = 2048; // KB
    protected int $maxCvSize = 5120; // KB

    /**
     * Display all applicant profiles with comprehensive filtering and sorting.
     */
    public function index(Request $request): Response
    {
        $user = $this->getAuthenticatedUser();

        $query = ApplicantProfile::with([
            'user',
            'cvs' => fn($q) => $q->where('status', 'active')->orderBy('order_position'),
            'primaryCv',
            'jobHistories' => fn($q) => $q->orderBy('starting_year', 'desc')->limit(3),
            'educationHistories' => fn($q) => $q->orderBy('passing_year', 'desc')->limit(2),
            'achievements' => fn($q) => $q->latest()->limit(3),
            'applications' => fn($q) => $q->latest()->limit(5),
        ]);

        // Apply all filters
        $this->applyFilters($query, $request);

        // Sorting – using ->input() instead of deprecated ->get()
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $this->applySorting($query, $sortField, $sortDirection);

        // Pagination
        $perPage = $request->input('per_page', 7);
        $profiles = $query->paginate($perPage)->withQueryString();

        // Transform collection with computed attributes
        $profiles->getCollection()->transform(fn($profile) => $this->transformProfile($profile));

        // Sort by completion percentage if requested
        if ($sortField === 'completion_percentage') {
            $profiles->getCollection()->sortBy([
                ['completion_percentage', $sortDirection === 'desc' ? SORT_DESC : SORT_ASC],
            ]);
        }

        // Statistics
        $stats = $this->getStatistics($request);

        return Inertia::render('Backend/ApplicantProfile/Index', [
            'profiles' => $profiles,
            'filters' => $request->only([
                'search',
                'email',
                'gender',
                'blood_type',
                'phone',
                'address',
                'birth_date_from',
                'birth_date_to',
                'min_age',
                'max_age',
                'created_from',
                'created_to',
                'date_range',
                'min_experience',
                'max_experience',
                'experience_level',
                'current_job_title',
                'has_current_job',
                'has_experience',
                'has_cv',
                'has_primary_cv',
                'completion_status',
                'min_completion',
                'trashed',
                'has_applied',
                'min_applications',
                'application_status',
                'applied_to_job_id',
                'min_ats_score',
                'max_ats_score',
                'has_social_links',
                'has_linkedin',
                'has_facebook',
                'has_twitter',
                'has_job_history',
                'min_job_history_count',
                'company_name',
                'position',
                'has_education',
                'degree',
                'institution',
                'min_passing_year',
                'max_passing_year',
                'has_achievements',
                'min_achievements',
                'email_verified',
                'user_status',
                'sort',
                'direction',
                'per_page',
            ]),
            'filterOptions' => $stats['options'],
            'statusCounts' => $stats['counts'],
            'genderDistribution' => $stats['gender'],
            'experienceDistribution' => $stats['experience'],
            'totalProfiles' => ApplicantProfile::count(),
        ]);
    }

    /**
     * Display a specific applicant profile.
     */
    public function show(?int $id = null): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        $profile = $this->findProfile($id, $user);

        if (!$profile) {
            return redirect()->route('backend.dashboard')
                ->with('error', 'Profile not found.');
        }

        $this->enrichProfile($profile);

        $isOwner = ($user->id === $profile->user_id);

        return Inertia::render('Backend/ApplicantProfile/Show', [
            'profile' => $profile,
            'canEdit' => $isOwner,
            'canDelete' => false,
        ]);
    }

    /**
     * Serve profile photo from storage.
     */
    public function photo(string $path): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        if (Str::contains($path, '..')) {
            abort(404);
        }

        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }

        $filePath = Storage::disk('public')->path($path);
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
        ];

        return response()->file($filePath, [
            'Content-Type' => $mimeTypes[$extension] ?? 'application/octet-stream',
            'Cache-Control' => 'public, max-age=31536000',
        ]);
    }

    /**
     * Update basic information.
     */
    public function updateBasicInfo(Request $request, ApplicantProfile $applicantProfile): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        if ($applicantProfile->trashed()) {
            return $this->jsonError('Cannot update a deleted profile.', 422);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'blood_type' => 'nullable|string|max:3',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'photo' => 'nullable|image|mimes:' . implode(',', $this->allowedPhotoExtensions) . '|max:' . $this->maxPhotoSize,
            'remove_photo' => 'nullable|boolean',
        ]);

        $profileData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'birth_date' => $validated['birth_date'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'blood_type' => $validated['blood_type'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
        ];

        // Handle photo removal
        if ($request->boolean('remove_photo') && $applicantProfile->photo_path) {
            Storage::disk('public')->delete($applicantProfile->photo_path);
            $profileData['photo_path'] = null;
        }

        // Handle photo upload with rate limiting
        if ($request->hasFile('photo')) {
            $this->checkRateLimit('photo_upload', $user->id, 5);

            if ($applicantProfile->photo_path) {
                Storage::disk('public')->delete($applicantProfile->photo_path);
            }
            $profileData['photo_path'] = $this->handlePhotoUpload($request->file('photo'));
            RateLimiter::clear($this->getThrottleKey('photo_upload', $user->id));
        }

        $applicantProfile->update($profileData);

        SimpleLogger::users(
            "✏️ Profile updated: {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $applicantProfile->id,
                'section' => 'basic_info',
                'updated_fields' => array_keys($profileData),
                'ip' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Basic information updated successfully!',
            'profile' => $applicantProfile->fresh(),
        ]);
    }

    /**
     * Update professional information.
     */
    public function updateProfessionalInfo(Request $request, ApplicantProfile $applicantProfile): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        if ($applicantProfile->trashed()) {
            return $this->jsonError('Cannot update a deleted profile.', 422);
        }

        $validated = $request->validate([
            'experience_years' => 'nullable|integer|min:0|max:60',
            'current_job_title' => 'nullable|string|max:255',
            'social_links' => 'nullable|array',
        ]);

        $applicantProfile->update([
            'experience_years' => $validated['experience_years'] ?? null,
            'current_job_title' => $validated['current_job_title'] ?? null,
            'social_links' => $validated['social_links'] ?? [],
        ]);

        SimpleLogger::users(
            "✏️ Professional info updated: {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $applicantProfile->id,
                'section' => 'professional_info',
                'experience_years' => $validated['experience_years'] ?? null,
                'current_job_title' => $validated['current_job_title'] ?? null,
                'has_social_links' => !empty($validated['social_links']),
                'ip' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Professional information updated successfully!',
            'profile' => $applicantProfile->fresh(),
        ]);
    }

    /**
     * Update work experiences.
     */
    public function updateWorkExperiences(Request $request, ApplicantProfile $applicantProfile): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        if ($applicantProfile->trashed()) {
            return $this->jsonError('Cannot update a deleted profile.', 422);
        }

        $validated = $request->validate([
            'job_histories' => 'nullable|array',
            'job_histories.*.id' => 'nullable|exists:job_histories,id',
            'job_histories.*.company_name' => 'required|string|max:255',
            'job_histories.*.position' => 'required|string|max:255',
            'job_histories.*.starting_year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'job_histories.*.ending_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'job_histories.*.is_current' => 'nullable|boolean',
            'job_histories.*.to_delete' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $applicantProfile) {
            foreach ($validated['job_histories'] ?? [] as $jobData) {
                if (!empty($jobData['to_delete']) && isset($jobData['id'])) {
                    JobHistory::where('id', $jobData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->delete();
                    continue;
                }

                if (!empty($jobData['is_current'])) {
                    $jobData['ending_year'] = null;
                }

                $payload = [
                    'company_name' => $jobData['company_name'],
                    'position' => $jobData['position'],
                    'starting_year' => $jobData['starting_year'],
                    'ending_year' => $jobData['ending_year'] ?? null,
                    'is_current' => $jobData['is_current'] ?? false,
                ];

                if (isset($jobData['id'])) {
                    JobHistory::where('id', $jobData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->update($payload);
                } else {
                    $applicantProfile->jobHistories()->create($payload);
                }
            }
        });

        SimpleLogger::users(
            "✏️ Work experiences updated: {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $applicantProfile->id,
                'section' => 'work_experiences',
                'count' => count($validated['job_histories'] ?? []),
                'ip' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Work experience updated successfully!',
            'job_histories' => $applicantProfile->fresh()->jobHistories,
        ]);
    }

    /**
     * Update education.
     */
    public function updateEducations(Request $request, ApplicantProfile $applicantProfile): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        if ($applicantProfile->trashed()) {
            return $this->jsonError('Cannot update a deleted profile.', 422);
        }

        $validated = $request->validate([
            'education_histories' => 'nullable|array',
            'education_histories.*.id' => 'nullable|exists:education_histories,id',
            'education_histories.*.institution_name' => 'required|string|max:255',
            'education_histories.*.degree' => 'required|string|max:255',
            'education_histories.*.passing_year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'education_histories.*.to_delete' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $applicantProfile) {
            foreach ($validated['education_histories'] ?? [] as $eduData) {
                if (!empty($eduData['to_delete']) && isset($eduData['id'])) {
                    EducationHistory::where('id', $eduData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->delete();
                    continue;
                }

                $payload = [
                    'institution_name' => $eduData['institution_name'],
                    'degree' => $eduData['degree'],
                    'passing_year' => $eduData['passing_year'],
                ];

                if (isset($eduData['id'])) {
                    EducationHistory::where('id', $eduData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->update($payload);
                } else {
                    $applicantProfile->educationHistories()->create($payload);
                }
            }
        });

        SimpleLogger::users(
            "✏️ Education updated: {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $applicantProfile->id,
                'section' => 'education',
                'count' => count($validated['education_histories'] ?? []),
                'ip' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Education updated successfully!',
            'education_histories' => $applicantProfile->fresh()->educationHistories,
        ]);
    }

    /**
     * Update achievements.
     */
    public function updateAchievements(Request $request, ApplicantProfile $applicantProfile): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        if ($applicantProfile->trashed()) {
            return $this->jsonError('Cannot update a deleted profile.', 422);
        }

        $validated = $request->validate([
            'achievements' => 'nullable|array',
            'achievements.*.id' => 'nullable|exists:achievements,id',
            'achievements.*.achievement_name' => 'required|string|max:255',
            'achievements.*.achievement_details' => 'nullable|string',
            'achievements.*.to_delete' => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($validated, $applicantProfile) {
            foreach ($validated['achievements'] ?? [] as $achData) {
                if (!empty($achData['to_delete']) && isset($achData['id'])) {
                    Achievement::where('id', $achData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->delete();
                    continue;
                }

                $payload = [
                    'achievement_name' => $achData['achievement_name'],
                    'achievement_details' => $achData['achievement_details'] ?? null,
                ];

                if (isset($achData['id'])) {
                    Achievement::where('id', $achData['id'])
                        ->where('applicant_profile_id', $applicantProfile->id)
                        ->update($payload);
                } else {
                    $applicantProfile->achievements()->create($payload);
                }
            }
        });

        SimpleLogger::users(
            "✏️ Achievements updated: {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $applicantProfile->id,
                'section' => 'achievements',
                'count' => count($validated['achievements'] ?? []),
                'ip' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Achievements updated successfully!',
            'achievements' => $applicantProfile->fresh()->achievements,
        ]);
    }

    /**
     * Change password.
     */
    public function changePassword(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($validated['new_password']),
        ])->save();

        SimpleLogger::security(
            "🔑 Password changed: {$user->email}",
            [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully!',
        ]);
    }

    /**
     * Soft delete profile.
     */
    public function destroy(ApplicantProfile $applicantProfile): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        if ($applicantProfile->trashed()) {
            return $this->jsonError('Profile is already deleted.', 422);
        }

        DB::transaction(function () use ($applicantProfile) {
            $applicantProfile->cvs()->delete();
            $applicantProfile->jobHistories()->delete();
            $applicantProfile->educationHistories()->delete();
            $applicantProfile->achievements()->delete();
            $applicantProfile->delete();
        });

        SimpleLogger::users(
            "🗑️ Profile deleted: {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $applicantProfile->id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile has been deleted. You can restore it if needed.',
        ]);
    }

    /**
     * Restore a soft-deleted profile.
     */
    public function restore(int $id): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();

        $profile = ApplicantProfile::withTrashed()->find($id);

        if (!$profile) {
            return $this->jsonError('No profile found to restore.', 404);
        }

        if (!$profile->trashed()) {
            return $this->jsonError('Profile is not deleted.', 422);
        }

        DB::transaction(function () use ($profile) {
            ApplicantCv::withTrashed()
                ->where('applicant_profile_id', $profile->id)
                ->restore();
            $profile->restore();
        });

        if ($profile->photo_path && !Storage::disk('public')->exists($profile->photo_path)) {
            $profile->photo_path = null;
            $profile->save();
        }

        SimpleLogger::users(
            "♻️ Profile restored: {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $profile->id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile restored successfully!',
            'profile' => $profile->fresh(),
        ]);
    }

    /**
     * Download CV.
     */
    public function downloadCV(ApplicantProfile $applicantProfile): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\RedirectResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        if ($applicantProfile->trashed()) {
            return redirect()->back()->with('error', 'Cannot download CV from a deleted profile.');
        }

        $cv = $applicantProfile->primaryCv;

        if (!$cv || !$cv->cv_path) {
            return redirect()->back()->with('error', 'No CV found.');
        }

        $filePath = storage_path('app/public/' . $cv->cv_path);

        if (!file_exists($filePath)) {
            return redirect()->back()->with('error', 'CV file not found.');
        }

        return response()->download($filePath, $applicantProfile->full_name . '_CV.pdf');
    }

    /**
     * Get profile data for editing (AJAX).
     */
    public function getProfileData(ApplicantProfile $applicantProfile): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        $this->authorizeProfileOwner($user, $applicantProfile);

        return response()->json([
            'profile' => $applicantProfile->load([
                'cvs',
                'jobHistories',
                'educationHistories',
                'achievements',
            ]),
        ]);
    }

    /**
     * Bulk delete profiles (soft delete).
     */
    public function bulkDelete(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user->hasPermission('applicant-profiles.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete profiles.');
        }

        $request->validate([
            'profile_ids' => 'required|array',
            'profile_ids.*' => 'exists:applicant_profiles,id',
        ]);

        $deleted = ApplicantProfile::whereIn('id', $request->profile_ids)->delete();

        SimpleLogger::security(
            "📦 Bulk delete profiles by {$user->email}",
            [
                'user_id' => $user->id,
                'count' => $deleted,
                'ids' => $request->profile_ids,
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', $deleted . ' profile(s) deleted successfully.');
    }

    /**
     * Bulk restore profiles.
     */
    public function bulkRestore(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user->hasPermission('applicant-profiles.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore profiles.');
        }

        $request->validate([
            'profile_ids' => 'required|array',
            'profile_ids.*' => 'exists:applicant_profiles,id',
        ]);

        $restored = ApplicantProfile::onlyTrashed()
            ->whereIn('id', $request->profile_ids)
            ->restore();

        SimpleLogger::security(
            "📦 Bulk restore profiles by {$user->email}",
            [
                'user_id' => $user->id,
                'count' => $restored,
                'ids' => $request->profile_ids,
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', $restored . ' profile(s) restored successfully.');
    }

    /**
     * Force delete a profile permanently.
     */
    public function forceDelete(int $id): \Illuminate\Http\RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user->hasPermission('applicant-profiles.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete profiles.');
        }

        $profile = ApplicantProfile::withTrashed()->findOrFail($id);

        // Delete CV files
        foreach ($profile->cvs as $cv) {
            if ($cv->cv_path && Storage::disk('public')->exists($cv->cv_path)) {
                Storage::disk('public')->delete($cv->cv_path);
            }
            $cv->forceDelete();
        }

        // Delete photo
        if ($profile->photo_path && Storage::disk('public')->exists($profile->photo_path)) {
            Storage::disk('public')->delete($profile->photo_path);
        }

        $profile->jobHistories()->forceDelete();
        $profile->educationHistories()->forceDelete();
        $profile->achievements()->forceDelete();
        $profile->forceDelete();

        SimpleLogger::security(
            "💥 Profile permanently deleted by {$user->email}",
            [
                'user_id' => $user->id,
                'profile_id' => $id,
                'ip' => request()->ip(),
            ]
        );

        return back()->with('success', 'Profile permanently deleted.');
    }

    /**
     * Export applicant profiles as CSV.
     * Return type changed to Symfony\Component\HttpFoundation\Response.
     */
    public function export(Request $request): SymfonyResponse|\Illuminate\Http\RedirectResponse
    {
        $user = $this->getAuthenticatedUser();

        if (!$user->hasPermission('applicant-profiles.export')) {
            return redirect()->back()->with('error', 'You do not have permission to export profiles.');
        }

        $request->validate([
            'format' => 'required|in:csv,xlsx',
        ]);

        $query = ApplicantProfile::with(['user']);
        $this->applyFilters($query, $request);
        $profiles = $query->get();

        if ($profiles->isEmpty()) {
            return back()->with('error', 'No profiles found to export.');
        }

        $filename = 'applicant_profiles_' . date('Y-m-d_His');

        $csvData = [];
        foreach ($profiles as $profile) {
            $csvData[] = [
                'ID' => $profile->id,
                'Full Name' => $profile->full_name,
                'Email' => $profile->user?->email,
                'Phone' => $profile->phone,
                'Gender' => $profile->gender,
                'Blood Type' => $profile->blood_type,
                'Birth Date' => $profile->birth_date,
                'Age' => $profile->birth_date ? now()->diffInYears($profile->birth_date) : 'N/A',
                'Address' => $profile->address,
                'Experience Years' => $profile->experience_years ?? 'N/A',
                'Current Job Title' => $profile->current_job_title ?? 'N/A',
                'Has CV' => $profile->cvs->count() > 0 ? 'Yes' : 'No',
                'CV Count' => $profile->cvs->count(),
                'Has Primary CV' => $profile->primaryCv ? 'Yes' : 'No',
                'Applications Count' => $profile->applications()->count(),
                'Completion Percentage' => $profile->completionPercentage() . '%',
                'Email Verified' => $profile->user?->email_verified_at ? 'Yes' : 'No',
                'Joined Date' => $profile->created_at?->format('Y-m-d'),
                'Last Updated' => $profile->updated_at?->format('Y-m-d'),
                'Status' => $profile->trashed() ? 'Deleted' : 'Active',
            ];
        }

        $output = fopen('php://temp', 'w');
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));
        fputcsv($output, array_keys($csvData[0]));

        foreach ($csvData as $row) {
            fputcsv($output, $row);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        // Return a proper Response object with CSV headers
        return response($csvContent, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }

    /**
     * Upload a CV – with rate limiting.
     */
    public function uploadCv(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();

        $this->checkRateLimit('cv_upload', $user->id, 3);

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            return $this->jsonError('Please complete your profile first.', 422);
        }

        $validated = $request->validate([
            'cv' => 'required|file|mimes:' . implode(',', $this->allowedCvExtensions) . '|max:' . $this->maxCvSize,
        ]);

        $activeCount = ApplicantCv::where('applicant_profile_id', $profile->id)
            ->where('status', 'active')
            ->count();

        if ($activeCount >= ApplicantCv::MAX_CVS_PER_PROFILE) {
            return $this->jsonError(
                sprintf('Maximum %d CVs reached.', ApplicantCv::MAX_CVS_PER_PROFILE),
                422
            );
        }

        $path = $this->storeCvFile($validated['cv'], $profile->id);

        $maxPosition = ApplicantCv::where('applicant_profile_id', $profile->id)
            ->max('order_position');
        $nextPosition = is_null($maxPosition) ? 0 : $maxPosition + 1;

        $cv = ApplicantCv::create([
            'applicant_profile_id' => $profile->id,
            'cv_path' => $path,
            'original_name' => $validated['cv']->getClientOriginalName(),
            'order_position' => $nextPosition,
            'is_primary' => $activeCount === 0,
            'status' => 'active',
        ]);

        RateLimiter::clear($this->getThrottleKey('cv_upload', $user->id));

        SimpleLogger::users(
            "📄 CV uploaded: {$user->email}",
            [
                'user_id' => $user->id,
                'cv_id' => $cv->id,
                'original_name' => $cv->original_name,
                'ip' => $request->ip(),
            ]
        );

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
            'cv_path' => $cv->cv_path,
        ]);
    }

    /**
     * Delete a CV.
     */
    public function destroyCv(ApplicantCv $cv): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();

        if ($cv->applicantProfile->user_id !== $user->id) {
            return $this->jsonError('Unauthorized.', 403);
        }

        if ($cv->cv_path && Storage::disk('public')->exists($cv->cv_path)) {
            Storage::disk('public')->delete($cv->cv_path);
        }

        $cv->forceDelete();
        ApplicantCv::reorderCvs($cv->applicant_profile_id);

        SimpleLogger::users(
            "📄 CV deleted: {$user->email}",
            [
                'user_id' => $user->id,
                'cv_id' => $cv->id,
                'original_name' => $cv->original_name,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'CV deleted successfully.',
        ]);
    }

    /**
     * Set a CV as primary.
     */
    public function setPrimaryCv(ApplicantCv $cv): \Illuminate\Http\JsonResponse
    {
        $user = $this->getAuthenticatedUser();

        if ($cv->applicantProfile->user_id !== $user->id) {
            return $this->jsonError('Unauthorized.', 403);
        }

        $cv->setAsPrimary();

        SimpleLogger::users(
            "📌 CV set as primary: {$user->email}",
            [
                'user_id' => $user->id,
                'cv_id' => $cv->id,
                'original_name' => $cv->original_name,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Primary CV updated successfully.',
        ]);
    }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

    private function getAuthenticatedUser(): User
    {
        $user = Auth::user();
        if (!$user instanceof User) {
            abort(401, 'Unauthenticated');
        }
        return $user;
    }

    private function authorizeProfileOwner(User $user, ApplicantProfile $profile): void
    {
        if ($user->id !== $profile->user_id) {
            abort(403, 'Unauthorized.');
        }
    }

    private function checkRateLimit(string $action, int $userId, int $maxAttempts = 5): void
    {
        $key = $this->getThrottleKey($action, $userId);
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            \Illuminate\Support\Facades\Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
            throw ValidationException::withMessages([
                'file' => 'Too many upload attempts. Please wait a moment.',
            ]);
        }
        RateLimiter::hit($key, 60);
    }

    private function getThrottleKey(string $action, int $userId): string
    {
        return $action . '|' . $userId;
    }

    private function handlePhotoUpload(UploadedFile $photo): string
    {
        $filename = date('Ymd') . '_' . Str::uuid() . '.' . $photo->getClientOriginalExtension();
        $path = 'profile_photos/' . $filename;
        Storage::disk('public')->put($path, file_get_contents($photo));
        return $path;
    }

    private function storeCvFile(UploadedFile $file, int $profileId): string
    {
        $filename = date('Ymd') . '_' . Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = 'cvs/' . $profileId . '/' . $filename;
        Storage::disk('public')->put($path, file_get_contents($file));
        return $path;
    }

    private function findProfile(?int $id, User $user): ?ApplicantProfile
    {
        if (is_null($id)) {
            return ApplicantProfile::withTrashed()
                ->with(['cvs', 'jobHistories', 'educationHistories', 'achievements', 'applications', 'user'])
                ->where('user_id', $user->id)
                ->first();
        }

        return ApplicantProfile::withTrashed()
            ->with(['cvs', 'jobHistories', 'educationHistories', 'achievements', 'applications', 'user'])
            ->where('id', $id)
            ->first();
    }

    private function enrichProfile(ApplicantProfile $profile): void
    {
        $profile->photo_url = $profile->photo_path
            ? asset('storage/' . $profile->photo_path)
            : null;

        foreach ($profile->cvs as $cv) {
            $cv->cv_url = $cv->cv_path ? asset('storage/' . $cv->cv_path) : null;
            $cv->file_size = $cv->cv_path && Storage::disk('public')->exists($cv->cv_path)
                ? Storage::disk('public')->size($cv->cv_path)
                : null;
        }

        $profile->completion_percentage = $profile->completionPercentage();
        $profile->email = $profile->user?->email;
    }

    private function transformProfile(ApplicantProfile $profile): ApplicantProfile
    {
        // Add computed attributes (full_name is an accessor, so we don't need to set it manually)
        $profile->completion_percentage = $profile->completionPercentage();
        $profile->email = $profile->user?->email;
        $profile->photo_url = $profile->photo_path
            ? route('profile.photo', ['path' => $profile->photo_path])
            : null;
        $profile->experience_level_label = $this->getExperienceLevelLabel($profile->experience_years);
        $profile->applications_count = $profile->applications()->count();
        $profile->active_cvs_count = $profile->cvs()->where('status', 'active')->count();
        return $profile;
    }

    private function getExperienceLevelLabel(?int $years): string
    {
        if ($years === null || $years === 0) {
            return 'Fresher';
        }
        if ($years <= 1) {
            return 'Entry Level';
        }
        if ($years <= 3) {
            return 'Junior';
        }
        if ($years <= 6) {
            return 'Mid Level';
        }
        if ($years <= 10) {
            return 'Senior';
        }
        return 'Expert';
    }

    private function applyFilters(Builder $query, Request $request): void
    {
        // Search by name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                    ->orWhereHas('user', fn($u) => $u->where('email', 'like', "%{$search}%"));
            });
        }

        // Gender
        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        // Blood type
        if ($request->filled('blood_type')) {
            $query->where('blood_type', $request->blood_type);
        }

        // Experience
        if ($request->filled('min_experience')) {
            $query->where('experience_years', '>=', (int) $request->min_experience);
        }
        if ($request->filled('max_experience')) {
            $query->where('experience_years', '<=', (int) $request->max_experience);
        }

        // Experience level
        if ($request->filled('experience_level')) {
            $ranges = [
                'fresher' => [0, 0],
                'entry' => [0, 1],
                'junior' => [1, 3],
                'mid' => [3, 6],
                'senior' => [6, 10],
                'expert' => [10, 100],
            ];
            if (isset($ranges[$request->experience_level])) {
                $range = $ranges[$request->experience_level];
                $query->whereBetween('experience_years', [$range[0], $range[1]]);
            }
        }

        // Has CV
        if ($request->filled('has_cv')) {
            if ($request->has_cv === 'yes') {
                $query->whereHas('cvs', fn($q) => $q->where('status', 'active'));
            } else {
                $query->whereDoesntHave('cvs', fn($q) => $q->where('status', 'active'));
            }
        }

        // Trashed
        if ($request->filled('trashed')) {
            match ($request->trashed) {
                'only' => $query->onlyTrashed(),
                'with' => $query->withTrashed(),
                default => null,
            };
        }

        // Date range
        if ($request->filled('date_range')) {
            match ($request->date_range) {
                'today' => $query->whereDate('created_at', today()),
                'yesterday' => $query->whereDate('created_at', today()->subDay()),
                'this_week' => $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]),
                'this_month' => $query->whereMonth('created_at', now()->month),
                'last_month' => $query->whereMonth('created_at', now()->subMonth()->month),
                'this_year' => $query->whereYear('created_at', now()->year),
                default => null,
            };
        }

        // Profile completion
        if ($request->filled('completion_status')) {
            match ($request->completion_status) {
                'complete' => $query->complete(),
                'incomplete' => $query->where(function ($q) {
                    foreach (ApplicantProfile::REQUIRED_FIELDS as $field) {
                        $q->where(function ($sub) use ($field) {
                            $sub->whereNull($field)->orWhere($field, '');
                        });
                    }
                }),
                default => null,
            };
        }
    }

    private function applySorting(Builder $query, string $field, string $direction): void
    {
        $allowedSortFields = [
            'created_at',
            'updated_at',
            'first_name',
            'last_name',
            'birth_date',
            'experience_years',
            'current_job_title',
            'phone',
        ];

        if (in_array($field, $allowedSortFields)) {
            $query->orderBy($field, $direction);
        } elseif ($field === 'full_name') {
            $query->orderBy('first_name', $direction)->orderBy('last_name', $direction);
        } elseif ($field === 'email') {
            $query->whereHas('user', fn($q) => $q->orderBy('email', $direction));
        } else {
            $query->orderBy('created_at', 'desc');
        }
    }

    private function getStatistics(Request $request): array
    {
        $statsQuery = ApplicantProfile::query();
        $this->applyFilters($statsQuery, $request);

        $experienceStats = (clone $statsQuery)->selectRaw(
            'MIN(experience_years) as min_exp, MAX(experience_years) as max_exp, AVG(experience_years) as avg_exp'
        )->first();

        $ageStats = (clone $statsQuery)
            ->selectRaw('MIN(YEAR(birth_date)) as min_birth_year, MAX(YEAR(birth_date)) as max_birth_year')
            ->whereNotNull('birth_date')
            ->first();

        $statusCounts = [
            'total' => (clone $statsQuery)->count(),
            'complete' => (clone $statsQuery)->complete()->count(),
            'incomplete' => (clone $statsQuery)->where(function ($q) {
                foreach (ApplicantProfile::REQUIRED_FIELDS as $field) {
                    $q->where(function ($sub) use ($field) {
                        $sub->whereNull($field)->orWhere($field, '');
                    });
                }
            })->count(),
            'has_cv' => (clone $statsQuery)->whereHas('cvs', fn($q) => $q->where('status', 'active'))->count(),
            'has_applied' => (clone $statsQuery)->whereHas('applications')->count(),
            'deleted' => ApplicantProfile::onlyTrashed()->count(),
        ];

        $genderStats = (clone $statsQuery)
            ->selectRaw('gender, COUNT(*) as count')
            ->whereNotNull('gender')
            ->groupBy('gender')
            ->pluck('count', 'gender')
            ->toArray();

        $experienceDistribution = [];
        $levels = ['fresher' => [0, 0], 'entry' => [0, 1], 'junior' => [1, 3], 'mid' => [3, 6], 'senior' => [6, 10], 'expert' => [10, 100]];
        foreach ($levels as $level => $range) {
            $experienceDistribution[$level] = (clone $statsQuery)
                ->whereBetween('experience_years', [$range[0], $range[1]])
                ->count();
        }

        return [
            'options' => [
                'genders' => ['male', 'female', 'other'],
                'blood_types' => ApplicantProfile::$bloodTypes,
                'experience' => [
                    'min' => (int) ($experienceStats->min_exp ?? 0),
                    'max' => (int) ($experienceStats->max_exp ?? 30),
                    'avg' => round($experienceStats->avg_exp ?? 0, 1),
                ],
                'age' => [
                    'min' => $ageStats->min_birth_year ? now()->year - (int) $ageStats->max_birth_year : 18,
                    'max' => $ageStats->max_birth_year ? now()->year - (int) $ageStats->min_birth_year : 65,
                ],
                'completion_levels' => [
                    'complete' => $statusCounts['complete'],
                    'incomplete' => $statusCounts['incomplete'],
                    'complete_with_cv' => (clone $statsQuery)->complete()->whereHas('cvs')->count(),
                ],
            ],
            'counts' => $statusCounts,
            'gender' => $genderStats,
            'experience' => $experienceDistribution,
        ];
    }

    private function jsonError(string $message, int $status = 400): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $status);
    }
}
