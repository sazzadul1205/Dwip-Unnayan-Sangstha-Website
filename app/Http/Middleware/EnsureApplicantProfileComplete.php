<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use App\Models\ApplicantProfile;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class EnsureApplicantProfileComplete
{
    /**
     * Routes that bypass profile completion check.
     */
    protected const BYPASS_ROUTES = [
        'profile.complete',
        'profile.complete.store',
        'logout',
        'verification.*',
        'profile.photo.upload',
        'profile.cv.upload',
        'profile.cv.destroy',
        'profile.cv.primary',
    ];

    /**
     * Cache TTL for profile completion status (1 minute).
     * This reduces DB queries on every request.
     */
    protected const CACHE_TTL = 60;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Proceed if not authenticated or not a job-seeker
        if (!$user || !$user->hasRole('job-seeker')) {
            return $next($request);
        }

        // Skip bypass routes
        if ($request->routeIs(...self::BYPASS_ROUTES)) {
            return $next($request);
        }

        // Check if profile is complete (with caching)
        if (!$this->isProfileComplete($user)) {
            // If the user is trying to access a backend route, redirect to profile completion
            $currentRoute = Route::currentRouteName();
            if ($currentRoute === 'backend.dashboard' || str_starts_with($currentRoute, 'backend.')) {
                return redirect()->route('profile.complete')
                    ->with('warning', 'Please complete your profile to access this page.');
            }

            // For other routes, still redirect
            return redirect()->route('profile.complete')
                ->with('warning', 'Please complete your profile to access this page.');
        }

        return $next($request);
    }

    /**
     * Check if the user's profile is complete, with caching.
     */
    private function isProfileComplete(User $user): bool
    {
        $cacheKey = 'profile_complete_' . $user->id;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            $profile = ApplicantProfile::withTrashed()
                ->where('user_id', $user->id)
                ->first();

            // If profile is soft-deleted, treat as incomplete? Actually the original logic returns $next.
            // We'll follow the original: if trashed, we consider it complete (or bypass).
            if ($profile && $profile->trashed()) {
                return true; // or false? Original: return $next, which means proceed, so true.
            }

            return $profile && $profile->isComplete();
        });
    }
}
