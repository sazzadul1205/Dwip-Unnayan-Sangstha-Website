<?php

namespace App\Http\Controllers\Auth\JobSeeker;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\ApplicantProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JobSeekerLoginController extends Controller
{
  /**
   * Show the job seeker login page.
   */
  public function create(Request $request): Response
  {
    return Inertia::render('auth/JobSeeker/Login', [
      'canResetPassword' => Route::has('password.request'),
      'googleAuthEnabled' => $this->googleAuthEnabled(),
      'status' => $request->session()->get('status'),
    ]);
  }

  /**
   * Handle job seeker login request.
   */
  public function store(LoginRequest $request): RedirectResponse
  {
    $throttleKey = 'login_jobseeker|' . strtolower($request->input('email')) . '|' . $request->ip();

    if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
      Log::warning('Job-seeker login rate limit exceeded', [
        'email' => $request->input('email'),
        'ip' => $request->ip(),
      ]);
      throw ValidationException::withMessages([
        'email' => trans('auth.throttle', ['seconds' => RateLimiter::availableIn($throttleKey)]),
      ]);
    }

    try {
      $request->authenticate();
      $request->session()->regenerate();
      $request->session()->regenerateToken();

      $user = $request->user();

      // Verify email
      if (!$user->hasVerifiedEmail()) {
        $this->logoutAndInvalidate($request);
        return to_route('verification.notice')->withErrors([
          'email' => 'Please verify your email address before logging in.',
        ]);
      }

      // Check if user has job_seeker role
      if (!$user->hasRole('job-seeker')) {
        $this->logoutAndInvalidate($request);
        Log::warning('Non-job-seeker tried to login via job-seeker login', [
          'user_id' => $user->id,
          'email' => $user->email,
          'roles' => $user->roles->pluck('slug')->toArray(),
        ]);
        return back()->withErrors([
          'email' => 'This account does not have job seeker access. Please use the admin login page.',
        ]);
      }

      // Clear rate limiter on success
      RateLimiter::clear($throttleKey);

      Log::info('Job-seeker login successful', [
        'user_id' => $user->id,
        'email' => $user->email,
      ]);

      // Check profile completion
      $profile = ApplicantProfile::where('user_id', $user->id)->first();
      if (!$profile || !$profile->isComplete()) {
        return redirect()->route('profile.complete');
      }

      return redirect()->intended(route('backend.dashboard'));
    } catch (ValidationException $e) {
      RateLimiter::hit($throttleKey, 60);
      throw $e;
    } catch (\Exception $e) {
      RateLimiter::hit($throttleKey, 60);
      Log::error('Job-seeker login error', [
        'email' => $request->input('email'),
        'error' => $e->getMessage(),
      ]);
      return back()->withErrors([
        'email' => 'An error occurred. Please try again later.',
      ])->onlyInput('email');
    }
  }

  /**
   * Logout and invalidate the session.
   */
  private function logoutAndInvalidate(Request $request): void
  {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
  }

  /**
   * Check if Google auth is configured.
   */
  private function googleAuthEnabled(): bool
  {
    return filled(config('services.google.client_id'))
      && filled(config('services.google.client_secret'))
      && filled(config('services.google.redirect'));
  }
}
