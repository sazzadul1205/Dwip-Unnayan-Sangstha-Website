<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use App\Services\SimpleLogger;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/Shared/ForgotPassword', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['email' => 'required|email']);

        $throttleKey = 'password_reset_link|' . $request->email . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            SimpleLogger::security(
                "Password reset link request rate limit exceeded for email {$request->email}",
                ['email' => $request->email, 'ip' => $request->ip()]
            );
            return back()->with('status', __('A reset link will be sent if the account exists.'));
        }

        $status = Password::sendResetLink($request->only('email'));

        RateLimiter::hit($throttleKey, 60);

        SimpleLogger::security(
            "Password reset link requested for email {$request->email}",
            ['email' => $request->email, 'status' => $status, 'ip' => $request->ip()]
        );

        // Always return the same message to prevent email enumeration
        return back()->with('status', __('A reset link will be sent if the account exists.'));
    }
}
