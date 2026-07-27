<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\SimpleLogger;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings – with rate limiting and logging.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $throttleKey = 'profile_update|' . $user->id;
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            SimpleLogger::security(
                "Profile update rate limit exceeded for user {$user->email}",
                ['user_id' => $user->id, 'ip' => $request->ip()]
            );
            throw ValidationException::withMessages([
                'email' => 'Too many attempts. Please wait a moment.',
            ]);
        }

        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        RateLimiter::clear($throttleKey);

        SimpleLogger::security(
            "Profile updated for user {$user->email}",
            [
                'user_id' => $user->id,
                'changes' => array_keys($user->getDirty()),
                'ip' => $request->ip(),
            ]
        );

        return redirect()->route('settings.profile')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account – with rate limiting and logging.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        $throttleKey = 'account_delete|' . $user->id;
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            SimpleLogger::security(
                "Account deletion rate limit exceeded for user {$user->email}",
                ['user_id' => $user->id, 'ip' => $request->ip()]
            );
            throw ValidationException::withMessages([
                'password' => 'Too many attempts. Please wait a moment.',
            ]);
        }

        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        RateLimiter::clear($throttleKey);

        SimpleLogger::security(
            "Account deleted for user {$user->email}",
            ['user_id' => $user->id, 'ip' => $request->ip()]
        );

        return redirect('/');
    }
}
