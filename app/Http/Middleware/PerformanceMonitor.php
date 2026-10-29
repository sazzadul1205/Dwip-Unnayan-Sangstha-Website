<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * ============================================================
 *  PERFORMANCE MONITOR
 * ============================================================
 *
 * Registered globally on the web group so every controller method
 * is timed. Execution time is recorded and logged to the
 * "performance" channel. Controllers that exceed the configured
 * threshold are flagged as slow with a warning-level log entry.
 *
 * The threshold is configurable via PERFORMANCE_THRESHOLD_MS env
 * variable (default: 500ms).
 */
class PerformanceMonitor
{
    /** Default slow-controller threshold in milliseconds. */
    private const DEFAULT_THRESHOLD_MS = 500;

    public function handle(Request $request, Closure $next): Response
    {
        $startedAt = hrtime(true);

        $response = $next($request);

        $elapsedMs = (hrtime(true) - $startedAt) / 1_000_000;

        $routeName = $request->route()?->getName() ?? $request->path();
        $controller = $this->resolveController($request);
        $threshold = (float) env('PERFORMANCE_THRESHOLD_MS', self::DEFAULT_THRESHOLD_MS);

        $context = [
            'route' => $routeName,
            'controller' => $controller,
            'method' => $request->method(),
            'elapsed_ms' => round($elapsedMs, 3),
            'threshold_ms' => $threshold,
            'status' => $response->getStatusCode(),
            'url' => $request->fullUrl(),
        ];

        try {
            if ($elapsedMs >= $threshold) {
                Log::channel('performance')->warning('Slow controller detected', $context);
            } else {
                Log::channel('performance')->debug('Controller execution', $context);
            }
        } catch (\Throwable $e) {
            // Logging must never break the request
        }

        return $response;
    }

    /**
     * Extract the controller class and method name from the route.
     */
    private function resolveController(Request $request): string
    {
        $action = $request->route()?->getAction('controller');

        if (is_string($action) && str_contains($action, '@')) {
            return $action;
        }

        if (is_callable($action)) {
            return 'Closure';
        }

        return 'Unknown';
    }
}
