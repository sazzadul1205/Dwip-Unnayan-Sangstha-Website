<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Services\AuditLogger;
use App\Services\ContentService;
use App\Services\PageMapService;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PageMapService::class, function ($app) {
            return new PageMapService(
                $app->make(ContentService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip()
            );
        });

        RateLimiter::for('profile-cv', function (Request $request) {
            $userId = $request->user()?->id;
            $key = $userId
                ? "profile-cv:{$userId}"
                : "profile-cv:{$request->ip()}";

            return Limit::perMinute(3)->by($key);
        });

        $this->registerAuthAuditing();
    }

    /**
     * Sign-in, sign-out and failed attempts were only reaching
     * Laravel's own log file, which no admin screen reads. They now land
     * in the queryable audit trail as well.
     */
    private function registerAuthAuditing(): void
    {
        Event::listen(Login::class, function (Login $event) {
            app(AuditLogger::class)->recordAuth(
                AuditLog::LOGIN,
                $event->user,
                sprintf('%s signed in', $event->user?->name ?? $event->user?->email ?? 'User'),
            );
        });

        Event::listen(Logout::class, function (Logout $event) {
            app(AuditLogger::class)->recordAuth(
                AuditLog::LOGOUT,
                $event->user,
                sprintf('%s signed out', $event->user?->name ?? $event->user?->email ?? 'User'),
            );
        });

        Event::listen(Failed::class, function (Failed $event) {
            if (!config('audit.record_failed_logins', true)) {
                return;
            }

            // No user resolved on a failed attempt, so the identifier is
            // taken from whichever credential the form submitted.
            $identifier = $event->credentials['email']
                ?? $event->credentials['username']
                ?? 'unknown';

            app(AuditLogger::class)->record(
                AuditLog::FAILED_LOGIN,
                sprintf('Failed sign-in attempt for %s', $identifier),
                ['new_values' => ['identifier' => $identifier]]
            );
        });
    }
}
