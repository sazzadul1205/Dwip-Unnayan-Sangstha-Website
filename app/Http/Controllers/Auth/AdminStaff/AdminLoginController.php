<?php

namespace App\Http\Controllers\Auth\AdminStaff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminLoginController extends Controller
{
    protected const MAX_ATTEMPTS = 5;
    protected const DECAY_MINUTES = 1;

    public function create(Request $request): Response
    {
        return Inertia::render('auth/AdminStaff/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $throttleKey = $this->throttleKey($request);

        // Rate limiting
        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            Log::warning('Admin login rate limit exceeded', [
                'email' => $request->input('email'),
                'ip' => $request->ip(),
            ]);
            throw ValidationException::withMessages([
                'email' => trans('auth.throttle', [
                    'seconds' => RateLimiter::availableIn($throttleKey),
                ]),
            ]);
        }

        try {
            $request->authenticate();
            $request->session()->regenerate();
            $request->session()->regenerateToken();

            /** @var \App\Models\User $user */
            $user = $request->user();

            // Email verification (backup)
            if (!$user->hasVerifiedEmail()) {
                $this->logoutAndInvalidate($request);
                throw ValidationException::withMessages([
                    'email' => 'Please verify your email before logging in.',
                ]);
            }

            // ---- DYNAMIC ROLE CHECK ----
            // Allow only if the user has at least one role that is NOT 'job-seeker'
            $userRoles = $user->roles->pluck('slug')->toArray();
            $hasAdminRole = collect($userRoles)->contains(fn($role) => $role !== 'job-seeker');

            if (!$hasAdminRole) {
                Log::warning('Unauthorized admin login attempt (only job-seeker role)', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'roles' => $userRoles,
                    'ip' => $request->ip(),
                ]);
                $this->logoutAndInvalidate($request);
                throw ValidationException::withMessages([
                    'email' => 'Access denied. This account does not have administrative privileges.',
                ]);
            }

            // Success – clear rate limiter
            RateLimiter::clear($throttleKey);

            Log::info('Admin login successful', [
                'user_id' => $user->id,
                'email' => $user->email,
                'roles' => $userRoles,
                'ip' => $request->ip(),
            ]);

            event(new \Illuminate\Auth\Events\Login('web', $user, false));

            return redirect()->intended(route('backend.dashboard'));
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            RateLimiter::hit($throttleKey, self::DECAY_MINUTES * 60);
            Log::error('Admin login error', [
                'email' => $request->input('email'),
                'ip' => $request->ip(),
                'error' => $e->getMessage(),
            ]);
            return back()->withErrors([
                'email' => 'An error occurred. Please try again later.',
            ])->onlyInput('email');
        }
    }

    private function logoutAndInvalidate(Request $request): void
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    private function throttleKey(Request $request): string
    {
        return strtolower($request->input('email')) . '|' . $request->ip();
    }
}
