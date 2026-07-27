<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use App\Services\SimpleLogger;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('auth/Shared/ConfirmPassword');
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $throttleKey = 'password_confirm|' . $user->id;

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            SimpleLogger::security(
                "Password confirmation rate limit exceeded for user {$user->email}",
                ['user_id' => $user->id, 'ip' => $request->ip()]
            );
            throw ValidationException::withMessages([
                'password' => 'Too many attempts. Please wait a moment.',
            ]);
        }

        if (! Auth::guard('web')->validate([
            'email' => $user->email,
            'password' => $request->password,
        ])) {
            RateLimiter::hit($throttleKey, 60);
            SimpleLogger::security(
                "Failed password confirmation for user {$user->email}",
                ['user_id' => $user->id, 'ip' => $request->ip()]
            );
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->put('auth.password_confirmed_at', time());

        SimpleLogger::security(
            "Password confirmed for user {$user->email}",
            ['user_id' => $user->id]
        );

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
