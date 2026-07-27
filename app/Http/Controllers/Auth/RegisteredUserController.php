<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Services\SimpleLogger;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'googleAuthEnabled' => $this->googleAuthEnabled(),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Rate limiting: 3 registrations per minute per IP
        $throttleKey = 'register_legacy|' . $request->ip();
        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            Log::warning('Legacy registration rate limit exceeded', ['ip' => $request->ip()]);
            throw ValidationException::withMessages([
                'email' => 'Too many registration attempts. Please try again later.',
            ]);
        }

        $request->validate([
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $email = strtolower($request->email);
        $name = Str::of($email)->before('@')->replace(['.', '_', '-'], ' ')->title()->value() ?: 'New User';

        try {
            DB::transaction(function () use ($email, $name, $request) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make($request->password),
                    'email_verified_at' => null,
                ]);

                // Assign job_seeker role via RBAC (default role)
                $jobSeekerRole = Role::where('slug', 'job-seeker')->first();
                if ($jobSeekerRole) {
                    $user->roles()->attach($jobSeekerRole->id, [
                        'assigned_by' => $user->id,
                        'assigned_at' => now(),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // Send email verification notification
                $user->sendEmailVerificationNotification();

                event(new Registered($user));

                // Log the user in
                Auth::login($user);
                $request->session()->regenerate();
            });

            RateLimiter::clear($throttleKey);

            // Log successful registration
            if (class_exists(SimpleLogger::class)) {
                SimpleLogger::security(
                    "New user registered (legacy) – {$email}",
                    ['email' => $email, 'ip' => $request->ip()]
                );
            } else {
                Log::info('New user registered (legacy)', ['email' => $email, 'ip' => $request->ip()]);
            }

            return to_route('verification.notice');
        } catch (\Throwable $e) {
            RateLimiter::hit($throttleKey, 60);
            Log::error('Legacy registration failed', [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw ValidationException::withMessages([
                'email' => 'Registration failed. Please try again later.',
            ]);
        }
    }

    /**
     * Determine whether Google auth is configured and ready to use.
     */
    private function googleAuthEnabled(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }
}
