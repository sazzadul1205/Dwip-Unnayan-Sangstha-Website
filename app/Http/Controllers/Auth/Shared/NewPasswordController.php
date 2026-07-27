<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use App\Services\SimpleLogger;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/Shared/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $throttleKey = 'password_reset|' . $request->email . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            SimpleLogger::security(
                "Password reset rate limit exceeded for email {$request->email}",
                ['email' => $request->email, 'ip' => $request->ip()]
            );
            throw ValidationException::withMessages([
                'email' => 'Too many reset attempts. Please try again later.',
            ]);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status == Password::PasswordReset) {
            RateLimiter::clear($throttleKey);
            SimpleLogger::security(
                "Password reset successful for email {$request->email}",
                ['email' => $request->email, 'ip' => $request->ip()]
            );
            return to_route('login')->with('status', __($status));
        }

        RateLimiter::hit($throttleKey, 60);
        SimpleLogger::security(
            "Password reset failed for email {$request->email}",
            ['email' => $request->email, 'status' => $status, 'ip' => $request->ip()]
        );

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
}
