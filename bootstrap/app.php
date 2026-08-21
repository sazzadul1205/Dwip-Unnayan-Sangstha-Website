<?php

use App\Console\Commands\ClearFrontendCache;
use App\Console\Commands\UpdateJobStatuses;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Console\Scheduling\Schedule;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        // api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    // ✅ Register your custom console commands
    ->withCommands([
        ClearFrontendCache::class,
        UpdateJobStatuses::class,
    ])
    ->withMiddleware(function (Middleware $middleware) {
        // Add custom aliases
        $middleware->alias([
            'profile.complete' => \App\Http\Middleware\EnsureApplicantProfileComplete::class,
        ]);

        // Web middleware group
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // API middleware group
        $middleware->group('api', [
            EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);
    })
    // ✅ Schedule tasks using the registered command
    ->withSchedule(function (Schedule $schedule) {
        // Update job statuses every hour using the dedicated command
        $schedule->command('jobs:update-status')->hourly();

        // Optionally clear frontend cache daily (uncomment if needed)
        // $schedule->command('frontend:clear-cache --all')->daily();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function () {
            return response()->view('errors.maintenance', [], 503);
        });
    })->create();
