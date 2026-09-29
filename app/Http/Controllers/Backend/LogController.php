<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * ============================================================
 *  SYSTEM LOGS
 * ============================================================
 *
 * File-based, human-readable log trail written by SimpleLogger
 * to storage/logs/{type}.log. This controller reads, exports,
 * clears, and reports on those files.
 *
 * Complements (does not replace) the database-backed audit trail:
 * SimpleLogger captures operational events (cache clears, backups,
 * security actions) while the AuditLogger middleware captures data
 * mutations automatically.
 */
class LogController extends Controller
{
    protected int $cacheDuration;

    protected array $logTypes;

    protected int $rateLimitAttempts = 10;

    public function __construct()
    {
        $this->cacheDuration = (int) config('system-logs.cache_ttl', 60);
        $this->logTypes = (array) config('system-logs.log_types', [
            'security' => '🔒 Security Logs',
            'jobs' => '💼 Jobs Log',
            'applications' => '📄 Applications Log',
            'users' => '👤 Users Log',
            'cms' => '📝 CMS Log',
            'system' => '⚙️ System Log',
            'ats' => '🤖 ATS Log',
        ]);
    }

    /**
     * Display the log viewer — with caching.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        if (!$this->can('logs.view')) {
            return $this->deny('You do not have permission to view system logs.');
        }

        $type = $request->input('type', 'security');
        $limit = min((int) $request->input('limit', 200), 5000);

        $cacheKey = 'log_viewer_' . $type . '_' . $limit;

        $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($type, $limit) {
            return [
                'logTypes' => $this->logTypes,
                'currentType' => $type,
                'logs' => $this->readLogFile($type, $limit),
                'fileInfo' => $this->getFileInfo($type),
                'can' => [
                    'export' => $this->can('logs.export'),
                    'clear' => $this->can('logs.clear'),
                    'prune' => $this->can('logs.prune'),
                ],
                'retentionDays' => (int) config('system-logs.retention_days', 90),
            ];
        });

        return Inertia::render('Backend/Logs/Index', $data);
    }

    /**
     * Show a single parsed log entry.
     */
    public function show(string $type, int $line): JsonResponse|RedirectResponse
    {
        if (!$this->can('logs.view')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if (!array_key_exists($type, $this->logTypes)) {
            return response()->json(['error' => 'Invalid log type'], 400);
        }

        $filePath = storage_path("logs/{$type}.log");

        if (!file_exists($filePath)) {
            return response()->json(['error' => 'Log file not found'], 404);
        }

        $lineCount = $this->countLines($filePath);

        if ($line < 1 || $line > $lineCount) {
            return response()->json(['error' => 'Line out of range'], 404);
        }

        $file = new \SplFileObject($filePath);
        $file->seek($line - 1);
        $rawLine = trim($file->fgets());

        if ($rawLine === '') {
            return response()->json(['error' => 'Empty entry'], 404);
        }

        $parsed = $this->parseLogLine($rawLine);

        if (!$parsed) {
            return response()->json([
                'type' => $type,
                'line' => $line,
                'totalLines' => $lineCount,
                'raw' => $rawLine,
            ]);
        }

        return response()->json([
            'type' => $type,
            'line' => $line,
            'totalLines' => $lineCount,
            'log' => $parsed,
            'fileInfo' => $this->getFileInfo($type),
        ]);
    }

    /**
     * Export parsed log entries as CSV.
     */
    public function export(Request $request): BinaryFileResponse|RedirectResponse
    {
        if (!$this->can('logs.export')) {
            return $this->deny('You do not have permission to export logs.');
        }

        $type = $request->input('type', 'security');
        $exportLimit = (int) config('system-logs.export_limit', 5000);
        $limit = min((int) $request->input('limit', $exportLimit), 50000);

        if (!array_key_exists($type, $this->logTypes)) {
            return back()->with('error', 'Invalid log type.');
        }

        $logs = $this->readLogFile($type, $limit);

        $filename = "{$type}_logs_" . now()->format('Y-m-d_H-i-s') . '.csv';

        $callback = function () use ($logs) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Line', 'Timestamp', 'User ID', 'Email', 'IP Address', 'Highlighted', 'Message', 'Context']);

            foreach ($logs as $index => $log) {
                fputcsv($handle, [
                    $log['line'] ?? ($index + 1),
                    $log['timestamp'] ?? '',
                    $log['user_id'] ?? 'system',
                    $log['email'] ?? 'system',
                    $log['ip'] ?? '0.0.0.0',
                    $log['is_highlighted'] ? 'Yes' : 'No',
                    $log['message'] ?? '',
                    is_array($log['context']) ? json_encode($log['context']) : ($log['context'] ?? ''),
                ]);
            }

            fclose($handle);
        };

        SimpleLogger::system(
            "📥 Log exported: {$type}",
            [
                'type' => $type,
                'filename' => $filename,
                'entries' => count($logs),
                'ip' => request()->ip(),
            ]
        );

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Clear (truncate) a log file — protected by rate limiting.
     */
    public function clear(Request $request): RedirectResponse
    {
        if (!$this->can('logs.clear')) {
            return redirect()->back()->with('error', 'You do not have permission to clear logs.');
        }

        $this->checkRateLimit('log_clear', Auth::user()?->id);

        $type = $request->input('type', 'security');
        $filePath = storage_path("logs/{$type}.log");

        if (!array_key_exists($type, $this->logTypes)) {
            return back()->with('error', 'Invalid log type.');
        }

        if (file_exists($filePath)) {
            file_put_contents($filePath, '');
        }

        RateLimiter::clear($this->getThrottleKey('log_clear'));
        $this->clearCache();

        SimpleLogger::system(
            "🗑️ Log cleared: {$type}",
            [
                'type' => $type,
                'cleared_by' => Auth::user()?->email ?? 'system',
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', "{$type} log cleared successfully.");
    }

    /**
     * Get log statistics — line counts per type plus metadata.
     */
    public function stats(Request $request): JsonResponse
    {
        if (!$this->can('logs.view')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $cacheKey = 'log_stats';

        $result = Cache::remember($cacheKey, $this->cacheDuration, function () {
            $stats = [];
            $total = 0;
            $lastEntryAt = null;

            foreach (array_keys($this->logTypes) as $type) {
                $filePath = storage_path("logs/{$type}.log");
                $lineCount = 0;
                $lastModified = null;

                if (file_exists($filePath)) {
                    $lineCount = $this->countLines($filePath);
                    $total += $lineCount;
                    $lastModified = date('Y-m-d H:i:s', filemtime($filePath));

                    if ($lastModified !== null) {
                        if ($lastEntryAt === null || $lastModified > $lastEntryAt) {
                            $lastEntryAt = $lastModified;
                        }
                    }
                }

                $stats[$type] = [
                    'lines' => $lineCount,
                    'last_modified' => $lastModified ?? 'Never',
                ];
            }

            return [
                'stats' => $stats,
                'total' => $total,
                'lastEntryAt' => $lastEntryAt,
            ];
        });

        return response()->json($result);
    }

    // ==========================================
    // INTERNALS
    // ==========================================

    private function can(string $permission): bool
    {
        $user = Auth::user();

        return $user && method_exists($user, 'hasPermission') && $user->hasPermission($permission);
    }

    private function deny(string $message): RedirectResponse
    {
        return redirect()->route('unauthorized.access')->with('error', $message);
    }

    /**
     * Check rate limit for destructive log actions (clear).
     */
    private function checkRateLimit(string $action, ?int $userId): void
    {
        $key = $this->getThrottleKey($action, $userId);

        if (RateLimiter::tooManyAttempts($key, $this->rateLimitAttempts)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'rate_limit' => 'Too many attempts. Please wait a moment.',
            ]);
        }

        RateLimiter::hit($key, 3600);
    }

    private function getThrottleKey(string $action, ?int $userId = null): string
    {
        return "log_{$action}|" . ($userId ?? 'system');
    }

    /**
     * Clear log viewer cache keys.
     */
    private function clearCache(): void
    {
        foreach (array_keys($this->logTypes) as $type) {
            for ($i = 0; $i <= 5000; $i += 200) {
                Cache::forget('log_viewer_' . $type . '_' . $i);
            }
        }
        Cache::forget('log_stats');
    }

    /**
     * Count lines in a file (cross-platform).
     */
    private function countLines(string $filePath): int
    {
        $count = 0;
        $handle = fopen($filePath, 'r');

        if ($handle === false) {
            return 0;
        }

        while (fgets($handle) !== false) {
            $count++;
        }

        fclose($handle);

        return $count;
    }

    /**
     * Read log file and parse entries.
     *
     * @return array<int, array<string, mixed>>
     */
    private function readLogFile(string $type, int $limit = 200): array
    {
        $filePath = storage_path("logs/{$type}.log");

        if (!file_exists($filePath)) {
            return [];
        }

        $file = new \SplFileObject($filePath);
        $file->seek(PHP_INT_MAX);
        $totalLines = $file->key();
        $start = max(0, $totalLines - $limit);
        $file->seek($start);

        $lineNumber = $start + 1;
        $logs = [];

        while (!$file->eof()) {
            $line = trim($file->fgets());

            if (!empty($line)) {
                $parsed = $this->parseLogLine($line);
                if ($parsed) {
                    $parsed['line'] = $lineNumber;
                    $logs[] = $parsed;
                }
            }

            $lineNumber++;
        }

        return array_reverse($logs);
    }

    /**
     * Parse a single log line.
     *
     * @return array<string, mixed>|null
     */
    private function parseLogLine(string $line): ?array
    {
        preg_match(
            '/\[(.*?)\] \[User: (.*?)\] \[(.*?)\] \[IP: (.*?)\] (.*?)(?:\s+(.*))?$/',
            $line,
            $matches
        );

        if (empty($matches)) {
            return null;
        }

        $timestamp = $matches[1] ?? '';
        $message = $matches[5] ?? '';

        return [
            'timestamp' => $timestamp,
            'user_id' => $matches[2] ?? 'system',
            'email' => $matches[3] ?? 'system',
            'ip' => $matches[4] ?? '0.0.0.0',
            'message' => $message,
            'context' => !empty($matches[6]) ? json_decode($matches[6], true) : null,
            'is_highlighted' => $this->isHighlighted($message),
        ];
    }

    /**
     * Check if log entry should be highlighted.
     */
    private function isHighlighted(string $message): bool
    {
        $patterns = (array) config('system-logs.highlight_patterns', [
            '❌', '🔴', 'Failed', 'failed', 'error', 'Error',
            'deleted', 'Deleted', 'permanently', 'Permanently',
        ]);

        foreach ($patterns as $pattern) {
            if (str_contains($message, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get file information.
     *
     * @return array<string, mixed>
     */
    private function getFileInfo(string $type): array
    {
        $filePath = storage_path("logs/{$type}.log");

        if (!file_exists($filePath)) {
            return [
                'exists' => false,
                'size' => '0 B',
                'lines' => 0,
                'last_modified' => 'Never',
            ];
        }

        return [
            'exists' => true,
            'size' => $this->formatBytes(filesize($filePath)),
            'lines' => $this->countLines($filePath),
            'last_modified' => date('Y-m-d H:i:s', filemtime($filePath)),
        ];
    }

    /**
     * Format bytes to human readable.
     */
    private function formatBytes(int|float $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        }
        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }
        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }
        return $bytes . ' B';
    }
}
