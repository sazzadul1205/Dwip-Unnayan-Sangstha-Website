<?php

namespace Tests\Feature\Middleware;

use Tests\TestCase;

class PerformanceMonitorTest extends TestCase
{
    public function test_performance_monitor_does_not_break_requests(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_performance_monitor_handles_slow_threshold(): void
    {
        putenv('PERFORMANCE_THRESHOLD_MS=0.001');

        $response = $this->get('/');

        $response->assertStatus(200);

        putenv('PERFORMANCE_THRESHOLD_MS=');
    }

    public function test_performance_monitor_logs_to_performance_channel(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);

        // Verify the performance log file exists (daily driver adds date suffix)
        $today = date('Y-m-d');
        $logPath = storage_path("logs/performance-{$today}.log");
        $this->assertFileExists($logPath);
    }
}
