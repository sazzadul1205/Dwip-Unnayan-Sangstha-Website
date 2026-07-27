<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LogController extends Controller
{
  /**
   * Log types mapping.
   *
   * @var array<string, string>
   */
  private array $logTypes = [
    'security' => '🔒 Security Logs',
    'jobs' => '💼 Jobs Log',
    'applications' => '📄 Applications Log',
    'users' => '👤 Users Log',
    'cms' => '📝 CMS Log',
    'system' => '⚙️ System Log',
    'ats' => '🤖 ATS Log',
  ];

  /**
   * Cache duration in seconds (1 minute).
   */
  protected int $cacheDuration = 60;

  /**
   * Rate limit max attempts per hour.
   */
  protected int $rateLimitAttempts = 10;

  /**
   * Display the log viewer – with caching.
   */
  public function index(Request $request): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('logs.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view logs.');
    }

    $type = $request->input('type', 'security');
    $limit = min((int) $request->input('limit', 200), 5000);

    $cacheKey = 'log_viewer_' . $type . '_' . $limit;

    $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($type, $limit, $user) {
      return [
        'logTypes' => $this->logTypes,
        'currentType' => $type,
        'logs' => $this->readLogFile($type, $limit),
        'fileInfo' => $this->getFileInfo($type),
        'canExport' => $user->hasPermission('logs.export'),
        'canClear' => $user->hasPermission('logs.clear'),
      ];
    });

    return Inertia::render('Backend/Logs/Index', $data);
  }

  /**
   * Export log file – with rate limiting.
   */
  public function export(Request $request): BinaryFileResponse|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('logs.export')) {
      return redirect()->back()->with('error', 'You do not have permission to export logs.');
    }

    $this->checkRateLimit('log_export', $user->id);

    $type = $request->input('type', 'security');
    $filePath = storage_path("logs/{$type}.log");

    if (!file_exists($filePath)) {
      return back()->with('error', 'Log file not found.');
    }

    $filename = "{$type}_log_" . date('Y-m-d') . '.txt';

    RateLimiter::clear($this->getThrottleKey('log_export', $user->id));

    SimpleLogger::system(
      "📥 Log exported: {$type}",
      [
        'type' => $type,
        'filename' => $filename,
        'exported_by' => $user->email,
        'ip' => $request->ip(),
      ]
    );

    return response()->download($filePath, $filename);
  }

  /**
   * Clear log file – with rate limiting.
   */
  public function clear(Request $request): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('logs.clear')) {
      return redirect()->back()->with('error', 'You do not have permission to clear logs.');
    }

    $this->checkRateLimit('log_clear', $user->id);

    $type = $request->input('type', 'security');
    $filePath = storage_path("logs/{$type}.log");

    if (file_exists($filePath)) {
      file_put_contents($filePath, '');
    }

    RateLimiter::clear($this->getThrottleKey('log_clear', $user->id));
    $this->clearCache();

    SimpleLogger::system(
      "🗑️ Log cleared: {$type}",
      [
        'type' => $type,
        'cleared_by' => $user->email,
        'ip' => $request->ip(),
      ]
    );

    return back()->with('success', "{$type} log cleared successfully.");
  }

  /**
   * Get log statistics – with rate limiting.
   */
  public function stats(Request $request): JsonResponse|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('logs.view')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('log_stats', $user->id, 20);

    $cacheKey = 'log_stats';

    $stats = Cache::remember($cacheKey, $this->cacheDuration, function () {
      $stats = [];
      foreach (array_keys($this->logTypes) as $type) {
        $filePath = storage_path("logs/{$type}.log");
        if (file_exists($filePath)) {
          $lineCount = 0;
          $handle = fopen($filePath, 'r');
          while (fgets($handle) !== false) {
            $lineCount++;
          }
          fclose($handle);
          $stats[$type] = $lineCount;
        } else {
          $stats[$type] = 0;
        }
      }
      return $stats;
    });

    RateLimiter::clear($this->getThrottleKey('log_stats', $user->id));

    return response()->json([
      'stats' => $stats,
      'total' => array_sum($stats),
    ]);
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

  /**
   * Get the authenticated user.
   */
  private function getAuthUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

  /**
   * Check rate limit for log actions.
   */
  private function checkRateLimit(string $action, int $userId, ?int $maxAttempts = null, int $decaySeconds = 3600): void
  {
    $max = $maxAttempts ?? $this->rateLimitAttempts;
    $key = $this->getThrottleKey($action, $userId);

    if (RateLimiter::tooManyAttempts($key, $max)) {
      Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
      throw ValidationException::withMessages([
        'rate_limit' => 'Too many attempts. Please wait a moment.',
      ]);
    }
    RateLimiter::hit($key, $decaySeconds);
  }

  /**
   * Get throttle key.
   */
  private function getThrottleKey(string $action, int $userId): string
  {
    return "log_{$action}|{$userId}";
  }

  /**
   * Clear log cache keys.
   */
  private function clearCache(): void
  {
    Cache::forget('log_viewer_*');
    Cache::forget('log_stats');
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

    $logs = [];
    while (!$file->eof()) {
      $line = trim($file->fgets());
      if (!empty($line)) {
        $parsed = $this->parseLogLine($line);
        if ($parsed) {
          $logs[] = $parsed;
        }
      }
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

    return [
      'timestamp' => $matches[1] ?? '',
      'user_id' => $matches[2] ?? 'system',
      'email' => $matches[3] ?? 'system',
      'ip' => $matches[4] ?? '0.0.0.0',
      'message' => $matches[5] ?? '',
      'context' => !empty($matches[6]) ? json_decode($matches[6], true) : null,
      'is_highlighted' => $this->isHighlighted($matches[5] ?? ''),
    ];
  }

  /**
   * Check if log entry should be highlighted.
   */
  private function isHighlighted(string $message): bool
  {
    $highlightPatterns = [
      '❌',
      '🔴',
      'Failed',
      'failed',
      'error',
      'Error',
      'deleted',
      'Deleted',
      'permanently',
      'Permanently',
    ];

    foreach ($highlightPatterns as $pattern) {
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

    $lineCount = 0;
    $handle = fopen($filePath, 'r');
    while (fgets($handle) !== false) {
      $lineCount++;
    }
    fclose($handle);

    return [
      'exists' => true,
      'size' => $this->formatBytes(filesize($filePath)),
      'lines' => $lineCount,
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
