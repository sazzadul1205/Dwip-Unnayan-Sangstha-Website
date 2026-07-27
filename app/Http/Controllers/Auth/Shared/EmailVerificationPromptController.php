<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use App\Models\ApplicantProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user && $user->hasVerifiedEmail()) {
            // For job-seekers, check profile completion
            if ($user->hasRole('job-seeker')) {
                $profile = ApplicantProfile::where('user_id', $user->id)->first();
                if (!$profile || !$profile->isComplete()) {
                    return redirect()->route('profile.complete');
                }
            }
            return redirect()->route('backend.dashboard');
        }

        return Inertia::render('auth/JobSeeker/VerifyEmail', [
            'status' => $request->session()->get('status'),
        ]);
    }
}
