<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimiterServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('web', function (Request $request) {
            return Limit::perMinute(config('rate-limiter.default.web.limit', 100))
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(config('rate-limiter.default.api.limit', 60))
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many requests. Please try again later.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(config('rate-limiter.default.auth.limit', 5))
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again later.',
                        'retry_after' => 60,
                    ], 429);
                });
        });

        RateLimiter::for('password_reset', function (Request $request) {
            return Limit::perMinutes(config('rate-limiter.default.password_reset.decay', 900) / 60, config('rate-limiter.default.password_reset.limit', 3))
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many password reset attempts. Please try again later.',
                        'retry_after' => config('rate-limiter.default.password_reset.decay', 900),
                    ], 429);
                });
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinutes(config('rate-limiter.default.register.decay', 900) / 60, config('rate-limiter.default.register.limit', 3))
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many registration attempts. Please try again later.',
                        'retry_after' => config('rate-limiter.default.register.decay', 900),
                    ], 429);
                });
        });

        RateLimiter::for('email_verification', function (Request $request) {
            return Limit::perMinutes(config('rate-limiter.default.email_verification.decay', 3600) / 60, config('rate-limiter.default.email_verification.limit', 5))
                ->by($request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many verification attempts. Please try again later.',
                        'retry_after' => config('rate-limiter.default.email_verification.decay', 3600),
                    ], 429);
                });
        });
    }
}