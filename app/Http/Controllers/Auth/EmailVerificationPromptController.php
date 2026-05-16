<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ApplicantProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // If already verified, check profile and redirect appropriately
        if ($user && $user->hasVerifiedEmail()) {
            // Check if profile needs to be completed using hasRole method from trait
            if ($user->hasRole('job-seeker')) {
                $profile = ApplicantProfile::where('user_id', $user->id)->first();
                if (!$profile || !$profile->isComplete()) {
                    return redirect()->route('profile.complete');
                }
            }

            return redirect()->route('dashboard');
        }

        // Not verified - show the verification page
        return Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]);
    }
}
