<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use App\Services\SimpleLogger;

class EmailVerificationNotificationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $throttleKey = 'email_verification_resend|' . $user->id;
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            SimpleLogger::security(
                "Verification email resend rate limit exceeded for user {$user->email}",
                ['user_id' => $user->id, 'ip' => $request->ip()]
            );
            return back()->withErrors([
                'email' => 'Too many resend requests. Please wait a moment.',
            ]);
        }

        $user->sendEmailVerificationNotification();
        RateLimiter::hit($throttleKey, 60);

        SimpleLogger::security(
            "Verification email resent to {$user->email}",
            ['user_id' => $user->id, 'ip' => $request->ip()]
        );

        return back()->with('status', 'verification-link-sent');
    }
}
