<?php
// middleware/EnsureApplicantProfileComplete.php
namespace App\Http\Middleware;

// Models
use App\Models\ApplicantProfile;

// Closure
use Closure;

// Requests
use Illuminate\Http\Request;

// Response
use Symfony\Component\HttpFoundation\Response;

class EnsureApplicantProfileComplete
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if user has job-seeker role using RBAC
        if (! $user || !$user->hasRole('job-seeker')) {
            return $next($request);
        }

        // Routes that should bypass profile completion check
        $bypassRoutes = [
            'profile.complete',
            'profile.complete.store',
            'logout',
            'verification.*',
            'profile.photo.upload',
            'profile.cv.upload',
            'profile.cv.destroy',
            'profile.cv.primary',
        ];

        if ($request->routeIs(...$bypassRoutes)) {
            return $next($request);
        }

        $profile = ApplicantProfile::withTrashed()
            ->where('user_id', $user->id)
            ->first();

        // If the profile was soft deleted, do not force completion flow
        if ($profile && $profile->trashed()) {
            return $next($request);
        }

        // Check if profile is complete
        if (! $profile || ! $profile->isComplete()) {
            return redirect()->route('profile.complete');
        }

        return $next($request);
    }
}
