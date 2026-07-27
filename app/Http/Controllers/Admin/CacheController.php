<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Frontend\SharedDataTrait;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class CacheController extends Controller
{
  use SharedDataTrait;

  /**
   * List of cache keys to clear when clearing all cache.
   */
  protected array $cacheKeys = [
    // Frontend shared data
    'frontend_shared_data',

    // CMS lists
    'cms_page_list',
    'cms_program_list',
    'cms_publication_list',
    'blog_admin_list',
    'about_content_list',
    'about_content_options',
    'shared_data_list',

    // Section cache
    'sections_page_*', // wildcard – will be cleared via pattern

    // Public job filters and stats
    'public_job_filters',
    'public_job_stats',

    // Navigation
    'data.navigation',

    // Backup cache
    'backup_list',
    'backup_logs',

    // Shared data type caches
    'shared.topbar',
    'shared.navbar',
    'shared.footer',
    'shared.faq',
    'shared.upcoming-events',
    'shared.stories',
    'shared_data_topbar',
    'shared_data_navbar',
    'shared_data_footer',
    'shared_data_faq',
    'shared_data_upcoming-events',
    'shared_data_stories',
  ];

  /**
   * Clear all frontend cache – with rate limiting.
   */
  public function clearAll(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('cache.manage')) {
      return $this->jsonError('You do not have permission to manage cache.', 403);
    }

    $this->checkRateLimit('cache_clear_all', $user->id);

    try {
      $cleared = [];

      // Clear individual keys
      foreach ($this->cacheKeys as $key) {
        if (str_contains($key, '*')) {
          // Handle wildcard pattern – clear all matching keys
          $pattern = str_replace('*', '', $key);
          $this->clearMatchingKeys($pattern);
          $cleared[] = $key . ' (pattern)';
        } else {
          if (Cache::has($key)) {
            Cache::forget($key);
            $cleared[] = $key;
          }
        }
      }

      // Also clear shared data via trait cache
      $this->clearSharedDataCache();

      RateLimiter::clear($this->getThrottleKey('cache_clear_all', $user->id));

      SimpleLogger::system(
        "🗑️ All frontend cache cleared",
        [
          'action' => 'clear_all',
          'cleared_count' => count($cleared),
          'performed_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return response()->json([
        'success' => true,
        'message' => 'Frontend cache cleared successfully!',
        'cleared' => $cleared,
        'count' => count($cleared),
        'timestamp' => now()->toDateTimeString(),
      ]);
    } catch (\Exception $e) {
      Log::error('Cache clearing failed: ' . $e->getMessage());
      return $this->jsonError('Failed to clear cache: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Clear cache for a specific page – with rate limiting.
   */
  public function clearPage(Request $request, string $pageSlug): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('cache.manage')) {
      return $this->jsonError('You do not have permission to manage cache.', 403);
    }

    $this->checkRateLimit('cache_clear_page', $user->id);

    try {
      $cleared = [];

      // Clear page-specific cache keys
      $pageKeys = [
        "sections_page_{$pageSlug}",
        "page_data_{$pageSlug}",
        "frontend_page_{$pageSlug}",
        "public_job_filters", // also affected by page changes
        "public_job_stats",
      ];

      foreach ($pageKeys as $key) {
        if (Cache::has($key)) {
          Cache::forget($key);
          $cleared[] = $key;
        }
      }

      // If it's a specific page that has detail cache, clear those too
      $detailKeys = [
        "about_content_{$pageSlug}",
        "blog_{$pageSlug}",
        "program_{$pageSlug}",
        "publication_{$pageSlug}",
      ];

      foreach ($detailKeys as $key) {
        if (Cache::has($key)) {
          Cache::forget($key);
          $cleared[] = $key;
        }
      }

      RateLimiter::clear($this->getThrottleKey('cache_clear_page', $user->id));

      SimpleLogger::system(
        "🗑️ Page cache cleared: {$pageSlug}",
        [
          'action' => 'clear_page',
          'page_slug' => $pageSlug,
          'cleared_count' => count($cleared),
          'performed_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return response()->json([
        'success' => true,
        'message' => "Cache for page '{$pageSlug}' cleared successfully!",
        'cleared' => $cleared,
        'count' => count($cleared),
        'timestamp' => now()->toDateTimeString(),
      ]);
    } catch (\Exception $e) {
      Log::error('Page cache clearing failed: ' . $e->getMessage(), ['page_slug' => $pageSlug]);
      return $this->jsonError('Failed to clear page cache: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Get cache status – with rate limiting (lighter limit).
   */
  public function status(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('cache.status')) {
      return $this->jsonError('You do not have permission to view cache status.', 403);
    }

    $this->checkRateLimit('cache_status', $user->id, 20);

    try {
      $cacheStatus = [];

      foreach ($this->cacheKeys as $key) {
        if (str_contains($key, '*')) {
          $pattern = str_replace('*', '', $key);
          $matches = $this->findMatchingKeys($pattern);
          foreach ($matches as $match) {
            $cacheStatus[] = [
              'key' => $match,
              'exists' => Cache::has($match),
              'message' => Cache::has($match) ? 'Cached' : 'Not cached',
            ];
          }
        } else {
          $cacheStatus[] = [
            'key' => $key,
            'exists' => Cache::has($key),
            'message' => Cache::has($key) ? 'Cached' : 'Not cached',
          ];
        }
      }

      RateLimiter::clear($this->getThrottleKey('cache_status', $user->id));

      return response()->json([
        'success' => true,
        'cache_status' => $cacheStatus,
        'total' => count($cacheStatus),
        'cached' => collect($cacheStatus)->where('exists', true)->count(),
        'timestamp' => now()->toDateTimeString(),
      ]);
    } catch (\Exception $e) {
      Log::error('Cache status check failed: ' . $e->getMessage());
      return $this->jsonError('Failed to get cache status: ' . $e->getMessage(), 500);
    }
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
   * Check rate limit for cache actions.
   */
  private function checkRateLimit(string $action, int $userId, int $maxAttempts = 5, int $decaySeconds = 3600): void
  {
    $key = $this->getThrottleKey($action, $userId);
    if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
      Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
      throw ValidationException::withMessages([
        'rate_limit' => 'Too many requests. Please wait a moment.',
      ]);
    }
    RateLimiter::hit($key, $decaySeconds);
  }

  /**
   * Get throttle key.
   */
  private function getThrottleKey(string $action, int $userId): string
  {
    return "cache_{$action}|{$userId}";
  }

  /**
   * Clear all cache keys matching a pattern.
   */
  private function clearMatchingKeys(string $pattern): void
  {
    // Laravel doesn't support pattern-based cache clearing by default.
    // We'll check common prefixes and clear them individually.
    $keys = Cache::get('cache_keys', []);

    if (is_array($keys)) {
      foreach ($keys as $key) {
        if (str_starts_with($key, $pattern)) {
          Cache::forget($key);
        }
      }
    }
  }

  /**
   * Find all cache keys matching a pattern.
   */
  private function findMatchingKeys(string $pattern): array
  {
    $keys = Cache::get('cache_keys', []);
    $matches = [];

    if (is_array($keys)) {
      foreach ($keys as $key) {
        if (str_starts_with($key, $pattern)) {
          $matches[] = $key;
        }
      }
    }

    return $matches;
  }

  /**
   * Clear shared data cache from the trait.
   */
  private function clearSharedDataCache(): void
  {
    if (method_exists($this, 'clearSharedDataCache')) {
      $this->clearSharedDataCache();
    }
    Cache::forget('frontend_shared_data');
  }

  /**
   * Return a JSON error response.
   */
  private function jsonError(string $message, int $status = 400): JsonResponse
  {
    return response()->json([
      'success' => false,
      'message' => $message,
    ], $status);
  }
}
