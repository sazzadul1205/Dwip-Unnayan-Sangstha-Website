<?php

namespace App\Http\Controllers\Auth\Shared;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use App\Services\SimpleLogger;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page - DEPRECATED / REDIRECT
     * This is kept for backward compatibility but redirects to job seeker login
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('seeker.login');
    }

    /**
     * Handle an incoming authentication request.
     * NOTE: This is now handled by JobSeekerLoginController and AdminLoginController
     */
    public function store(): RedirectResponse
    {
        return redirect()->route('login')->withErrors([
            'email' => 'Please use the appropriate login page for your account type.',
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if ($user) {
            SimpleLogger::security(
                "🚪 User logged out: {$user->email}",
                [
                    'user_id'    => $user->id,
                    'email'      => $user->email,
                    'ip'         => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]
            );
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function googleAuthEnabled(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }
}
