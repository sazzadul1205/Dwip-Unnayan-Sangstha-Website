<?php

use App\Console\Commands\ClearFrontendCache;
use App\Console\Commands\PruneAuditLogs;
use App\Console\Commands\UpdateJobStatuses;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\StaticAssetCache;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Console\Scheduling\Schedule;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

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
        PruneAuditLogs::class,
    ])
    ->withMiddleware(function (Middleware $middleware) {
        // Add custom aliases
        $middleware->alias([
            'profile.complete' => \App\Http\Middleware\EnsureApplicantProfileComplete::class,
            'static.cache' => \App\Http\Middleware\StaticAssetCache::class,
        ]);

        // Audit every state-changing request application-wide, so no
        // controller can silently mutate data without leaving a trail.
        $middleware->appendToGroup('web', \App\Http\Middleware\AuditMutations::class);

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

        // Keep the append-only audit trail inside its retention window.
        $schedule->command('audit:prune')->dailyAt('03:30');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $exception) {
            if ($exception instanceof HttpExceptionInterface && $exception->getStatusCode() === 503) {
                return response()->view('errors.maintenance', [], 503, $exception->getHeaders());
            }

            return null;
        });
    })->create();
