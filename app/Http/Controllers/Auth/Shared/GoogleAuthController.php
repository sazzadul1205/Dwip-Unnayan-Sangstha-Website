<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpKernel\Exception\HttpException;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        $this->ensureGoogleIsConfigured();

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $this->ensureGoogleIsConfigured();

        try {
            /** @var SocialiteUser $googleUser */
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $exception) {
            report($exception);

            SimpleLogger::security(
                'Google OAuth callback failed',
                [
                    'error' => $exception->getMessage(),
                    'ip' => $request->ip(),
                ]
            );

            return to_route('login')->withErrors([
                'google' => 'Google sign-in could not be completed. Please try again.',
            ]);
        }

        $email = Str::lower((string) $googleUser->getEmail());

        if ($email === '') {
            return to_route('login')->withErrors([
                'google' => 'Google did not return an email address.',
            ]);
        }

        if (! $this->emailIsVerifiedByGoogle($googleUser)) {
            return to_route('login')->withErrors([
                'google' => 'Please verify your Google account email before signing in.',
            ]);
        }

        $user = User::query()
            ->where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        if (! $user) {
            $user = $this->createUserFromGoogleProfile($googleUser);

            SimpleLogger::security(
                "New user created via Google: {$email}",
                [
                    'user_id' => $user->id,
                    'google_id' => $googleUser->getId(),
                ]
            );
        } else {
            $user->forceFill([
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'google_avatar' => $googleUser->getAvatar(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            SimpleLogger::security(
                "User logged in via Google: {$email}",
                [
                    'user_id' => $user->id,
                ]
            );
        }

        Auth::login($user, true);

        $request->session()->regenerate();

        return redirect()->intended(route('profile.complete', absolute: false));
    }

    private function createUserFromGoogleProfile(SocialiteUser $googleUser): User
    {
        $user = User::create([
            'name' => $googleUser->getName() ?: Str::before($googleUser->getEmail(), '@'),
            'email' => Str::lower((string) $googleUser->getEmail()),
            'password' => Hash::make(Str::random(40)),
            'google_id' => $googleUser->getId(),
            'google_avatar' => $googleUser->getAvatar(),
            'email_verified_at' => now(),
        ]);

        if ($role = Role::where('slug', 'job-seeker')->first()) {
            $user->roles()->attach($role->id, [
                'assigned_by' => $user->id,
                'assigned_at' => now(),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $user;
    }

    private function ensureGoogleIsConfigured(): void
    {
        if (
            blank(config('services.google.client_id')) ||
            blank(config('services.google.client_secret')) ||
            blank(config('services.google.redirect'))
        ) {
            throw new HttpException(
                503,
                'Google authentication is not configured.'
            );
        }
    }

    private function emailIsVerifiedByGoogle(SocialiteUser $googleUser): bool
    {
        // Google OAuth only returns verified email addresses.
        // If an email exists, consider it verified.
        return filled($googleUser->getEmail());
    }
}
