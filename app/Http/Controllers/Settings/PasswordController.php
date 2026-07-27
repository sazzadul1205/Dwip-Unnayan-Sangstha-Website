<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\SimpleLogger;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/password', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's password – with rate limiting and logging.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $throttleKey = 'password_update|' . $user->id;
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            SimpleLogger::security(
                "Password update rate limit exceeded for user {$user->email}",
                ['user_id' => $user->id, 'ip' => $request->ip()]
            );
            throw ValidationException::withMessages([
                'current_password' => 'Too many attempts. Please wait a moment.',
            ]);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        RateLimiter::clear($throttleKey);

        SimpleLogger::security(
            "Password updated for user {$user->email}",
            ['user_id' => $user->id, 'ip' => $request->ip()]
        );

        return back()->with('status', 'password-updated');
    }
}
