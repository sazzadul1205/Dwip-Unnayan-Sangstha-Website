<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Collection;

class JobListingApiController extends Controller
{
  /**
   * Maximum items per page.
   */
  private const MAX_PER_PAGE = 100;

  /**
   * Default items per page.
   */
  private const DEFAULT_PER_PAGE = 15;

  /**
   * Cache duration in seconds (5 minutes).
   */
  private const CACHE_DURATION = 300;

  /**
   * Rate limit max attempts per minute.
   */
  private const RATE_LIMIT_ATTEMPTS = 60;

  /**
   * Rate limit decay in seconds (1 minute).
   */
  private const RATE_LIMIT_DECAY = 60;

  /**
   * Get job listings with search, fixed sort by views, and limit support.
   * @return JsonResponse
   */
  public function index(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'job_listings');
    $this->logApiRequest($request, 'job_listings');

    $cacheKey = $this->getCacheKey($request, 'job_listings');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = JobListing::with(['category', 'locations', 'employer']);

        // Apply active filter by default (unless show_all is true)
        if (!$request->boolean('show_all')) {
          $query->active()->published();
        } elseif ($request->has('is_active')) {
          $query->where('is_active', $request->boolean('is_active'));
        }

        // Search
        if ($request->filled('search')) {
          $query->search($request->search);
        }

        // Fixed sort by views (most viewed first)
        $query->orderBy('views_count', 'desc');

        // Handle limit (returns all results up to limit)
        if ($request->has('limit')) {
          $limit = $this->sanitizeLimit($request->input('limit'));
          $data = $query->limit($limit)->get();
          return $this->successResponse($data);
        }

        // Handle pagination
        if ($request->has('page')) {
          $perPage = $this->sanitizePerPage($request->input('per_page', self::DEFAULT_PER_PAGE));
          $data = $query->paginate($perPage);
          return $this->successResponse($data);
        }

        // Default: return paginated results
        $perPage = $this->sanitizePerPage($request->input('per_page', self::DEFAULT_PER_PAGE));
        $data = $query->paginate($perPage);

        return $this->successResponse($data);
      } catch (\Exception $e) {
        Log::error('JobListing API error: ' . $e->getMessage(), [
          'trace' => $e->getTraceAsString(),
          'request' => $request->all(),
        ]);
        return $this->errorResponse('Failed to fetch job listings');
      }
    });
  }

  /**
   * Get a single job listing by ID or slug.
   */
  public function show(string $identifier, Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'job_listings_show');
    $this->logApiRequest($request, 'job_listings_show');

    try {
      $query = JobListing::with(['category', 'locations', 'employer']);

      $job = is_numeric($identifier)
        ? $query->find($identifier)
        : $query->where('slug', $identifier)->first();

      if (!$job) {
        return $this->errorResponse('Job listing not found', 404);
      }

      // Increment view count (if requested)
      if ($request->boolean('increment_view', true)) {
        $job->incrementViews();
      }

      return $this->successResponse($job);
    } catch (\Exception $e) {
      Log::error('JobListing show API error: ' . $e->getMessage());
      return $this->errorResponse('Failed to fetch job listing');
    }
  }

  /**
   * Get related jobs for a specific job by slug.
   * Returns exactly 3 related jobs based on category, job type, and title keywords.
   */
  public function related(string $slug, Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'job_listings_related');
    $this->logApiRequest($request, 'job_listings_related');

    // Cache per slug and request params (excluding page for related)
    $cacheKey = 'related_jobs_' . $slug . '_' . md5(json_encode($request->query()));

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($slug, $request) {
      try {
        $job = JobListing::with(['category', 'locations', 'employer'])
          ->where('slug', $slug)
          ->first();

        if (!$job) {
          return $this->errorResponse('Job listing not found', 404);
        }

        $relatedJobs = $this->fetchRelatedJobs($job);

        return $this->successResponse([
          'current_job' => $job,
          'related_jobs' => $relatedJobs,
          'count' => $relatedJobs->count(),
          'match_reasons' => $this->getMatchReasons($job, $relatedJobs),
        ]);
      } catch (\Exception $e) {
        Log::error('JobListing related API error: ' . $e->getMessage(), [
          'job_slug' => $slug,
          'trace' => $e->getTraceAsString(),
        ]);
        return $this->errorResponse('Failed to fetch related jobs');
      }
    });
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

  /**
   * Fetch related jobs using priority logic.
   */
  private function fetchRelatedJobs(JobListing $job): Collection
  {
    $query = JobListing::with(['category', 'locations', 'employer'])
      ->active()
      ->published()
      ->where('id', '!=', $job->id)
      ->orderBy('views_count', 'desc');

    // Priority 1: Same category
    if ($job->category_id) {
      $query->where('category_id', $job->category_id);
    }

    $relatedJobs = $query->limit(3)->get();

    // Priority 2: Same job type (if less than 3)
    if ($relatedJobs->count() < 3 && $job->job_type) {
      $excludedIds = $relatedJobs->pluck('id')->toArray();
      $excludedIds[] = $job->id;

      $more = JobListing::with(['category', 'locations', 'employer'])
        ->active()
        ->published()
        ->whereNotIn('id', $excludedIds)
        ->where('job_type', $job->job_type)
        ->orderBy('views_count', 'desc')
        ->limit(3 - $relatedJobs->count())
        ->get();

      $relatedJobs = $relatedJobs->merge($more);
    }

    // Priority 3: Similar title keywords (if still less than 3)
    if ($relatedJobs->count() < 3 && $job->title) {
      $keywords = $this->extractKeywords($job->title);
      if (!empty($keywords)) {
        $excludedIds = $relatedJobs->pluck('id')->toArray();
        $excludedIds[] = $job->id;

        $titleQuery = JobListing::with(['category', 'locations', 'employer'])
          ->active()
          ->published()
          ->whereNotIn('id', $excludedIds)
          ->orderBy('views_count', 'desc');

        $titleQuery->where(function ($q) use ($keywords) {
          foreach ($keywords as $keyword) {
            $q->orWhere('title', 'LIKE', "%{$keyword}%");
          }
        });

        $more = $titleQuery->limit(3 - $relatedJobs->count())->get();
        $relatedJobs = $relatedJobs->merge($more);
      }
    }

    // Fallback: any recent jobs
    if ($relatedJobs->count() < 3) {
      $excludedIds = $relatedJobs->pluck('id')->toArray();
      $excludedIds[] = $job->id;

      $fallback = JobListing::with(['category', 'locations', 'employer'])
        ->active()
        ->published()
        ->whereNotIn('id', $excludedIds)
        ->orderBy('views_count', 'desc')
        ->limit(3 - $relatedJobs->count())
        ->get();

      $relatedJobs = $relatedJobs->merge($fallback);
    }

    return $relatedJobs->take(3);
  }

  /**
   * Extract keywords from a title for search.
   */
  private function extractKeywords(string $title): array
  {
    $stopWords = [
      'a',
      'an',
      'the',
      'and',
      'or',
      'but',
      'for',
      'nor',
      'on',
      'at',
      'to',
      'by',
      'in',
      'of',
      'with',
      'without',
      'from',
      'into',
      'through',
      'during',
      'including',
      'etc'
    ];

    $words = preg_split('/\s+/', preg_replace('/[^\w\s]/', '', strtolower($title)));

    $keywords = array_filter($words, function ($word) use ($stopWords) {
      return strlen($word) > 2 && !in_array($word, $stopWords);
    });

    return array_values($keywords);
  }

  /**
   * Get match reasons for the related jobs.
   */
  private function getMatchReasons(JobListing $job, Collection $relatedJobs): array
  {
    $reasons = [];

    $jobLocationIds = $job->locations->pluck('id')->toArray();

    foreach ($relatedJobs as $related) {
      $reason = [];

      if ($related->category_id === $job->category_id) {
        $reason[] = 'Same category';
      }

      if ($related->job_type === $job->job_type) {
        $reason[] = 'Same job type';
      }

      if ($related->employer_id === $job->employer_id) {
        $reason[] = 'Same employer';
      }

      $relatedLocationIds = $related->locations->pluck('id')->toArray();
      if (!empty(array_intersect($jobLocationIds, $relatedLocationIds))) {
        $reason[] = 'Same location';
      }

      if (empty($reason)) {
        $keywords = $this->extractKeywords($job->title);
        foreach ($keywords as $keyword) {
          if (stripos($related->title, $keyword) !== false) {
            $reason[] = 'Similar title';
            break;
          }
        }
      }

      if (empty($reason)) {
        $reason[] = 'Recent listing';
      }

      $reasons[$related->id] = $reason;
    }

    return $reasons;
  }

    // ==========================================
    // RATE LIMITING & LOGGING HELPERS
    // ==========================================

  /**
   * Check API rate limit per IP and endpoint.
   */
  private function checkApiRateLimit(Request $request, string $endpoint): void
  {
    $key = 'api_rate_limit_' . $endpoint . '|' . $request->ip();
    if (RateLimiter::tooManyAttempts($key, self::RATE_LIMIT_ATTEMPTS)) {
      Log::warning('API rate limit exceeded', [
        'endpoint' => $endpoint,
        'ip' => $request->ip(),
        'available_in' => RateLimiter::availableIn($key),
      ]);
      abort(429, 'Too many requests. Please wait a moment.');
    }
    RateLimiter::hit($key, self::RATE_LIMIT_DECAY);
  }

  /**
   * Log API request for audit purposes.
   */
  private function logApiRequest(Request $request, string $endpoint): void
  {
    $data = [
      'endpoint' => $endpoint,
      'ip' => $request->ip(),
      'user_agent' => $request->userAgent(),
      'query' => $request->query(),
    ];

    if ($request->user()) {
      $data['user_id'] = $request->user()->id;
    }

    if (class_exists(SimpleLogger::class)) {
      SimpleLogger::system("API Request: {$endpoint}", $data);
    } else {
      Log::info("API Request: {$endpoint}", $data);
    }
  }

  /**
   * Generate a cache key for a request.
   */
  private function getCacheKey(Request $request, string $endpoint): string
  {
    $params = $request->query();
    ksort($params);
    return 'api_' . $endpoint . '_' . md5(json_encode($params));
  }

  // ==========================================
  // VALIDATION HELPERS
  // ==========================================

  private function sanitizePerPage(int|string $value): int
  {
    $perPage = (int) $value;
    return min(max($perPage, 1), self::MAX_PER_PAGE);
  }

  private function sanitizeLimit(int|string $value, int $max = 100): int
  {
    $limit = (int) $value;
    return min(max($limit, 1), $max);
  }

  // ==========================================
  // RESPONSE HELPERS
  // ==========================================

  private function successResponse(mixed $data, int $status = 200): JsonResponse
  {
    return response()->json([
      'success' => true,
      'data' => $data,
    ], $status);
  }

  private function errorResponse(string $message, int $status = 500): JsonResponse
  {
    return response()->json([
      'success' => false,
      'message' => $message,
    ], $status);
  }
}
