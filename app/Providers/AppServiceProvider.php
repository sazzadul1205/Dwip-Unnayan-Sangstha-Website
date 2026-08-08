<?php

namespace App\Providers;

use App\Services\PageMapService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
            return new PageMapService($app);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define API rate limiter (required for throttle:api)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Your existing profile-cv rate limiter
        RateLimiter::for('profile-cv', function (Request $request) {
            $userId = $request->user()?->id;
            $key = $userId ? "profile-cv:{$userId}" : "profile-cv:{$request->ip()}";

            return Limit::perMinute(3)->by($key);
        });
    }
}
