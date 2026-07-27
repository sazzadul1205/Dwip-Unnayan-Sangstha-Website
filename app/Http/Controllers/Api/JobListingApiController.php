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
  private const DEFAULT_PER_PAGE = 10; // ✅ Changed to 10 for infinite scroll

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
   * Get job listings with infinite scroll support.
   * @return JsonResponse
   */
  public function index(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'job_listings');
    $this->logApiRequest($request, 'job_listings');

    // ✅ Don't cache for infinite scroll to ensure real-time data
    // $cacheKey = $this->getCacheKey($request, 'job_listings');
    // return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {

    try {
      $query = JobListing::with(['category', 'locations', 'employer']);

      // Apply active filter by default (unless show_all is true)
      if (!$request->boolean('show_all')) {
        $query->active()->published();
      } elseif ($request->has('is_active')) {
        $query->where('is_active', $request->boolean('is_active'));
      }

      // ✅ Search
      if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
          $q->where('title', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%")
            ->orWhereHas('category', fn($cat) => $cat->where('name', 'like', "%{$search}%"))
            ->orWhereHas('locations', fn($loc) => $loc->where('name', 'like', "%{$search}%"));
        });
      }

      // ✅ Filter by job type
      if ($request->filled('job_type')) {
        $query->where('job_type', $request->job_type);
      }

      // ✅ Filter by category
      if ($request->filled('category')) {
        $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
      }

      // ✅ Filter by location
      if ($request->filled('location')) {
        $query->whereHas('locations', fn($q) => $q->where('locations.id', $request->location));
      }

      // ✅ Filter by experience level
      if ($request->filled('experience_level')) {
        $query->where('experience_level', $request->experience_level);
      }

      // ✅ Fixed sort by views (most viewed first) - but can be overridden
      $sort = $request->input('sort', 'views');
      $this->applySorting($query, $sort);

      // ✅ Handle limit (for backward compatibility)
      if ($request->has('limit')) {
        $limit = $this->sanitizeLimit($request->input('limit'));
        $data = $query->limit($limit)->get();
        return $this->successResponse($data);
      }

      // ✅ Handle pagination for infinite scroll
      if ($request->has('page')) {
        $perPage = $this->sanitizePerPage($request->input('per_page', self::DEFAULT_PER_PAGE));
        $data = $query->paginate($perPage);
        return $this->successResponse($data);
      }

      // ✅ Default: return paginated results
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
    // }); // Remove cache
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

  /**
   * Get job filter options (for frontend dropdowns).
   */
  public function filterOptions(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'filter_options');

    try {
      // Get categories with job counts
      $categories = \App\Models\JobCategory::whereHas('jobListings', function ($query) {
        $query->where('is_active', true)
          ->whereNull('deleted_at')
          ->where('application_deadline', '>=', now());
      })
        ->active()
        ->orderBy('name')
        ->get()
        ->map(fn($category) => [
          'id' => $category->id,
          'name' => $category->name,
          'slug' => $category->slug,
          'count' => $category->jobListings()->where('is_active', true)->count(),
        ]);

      // Get locations with job counts
      $locations = \App\Models\Location::whereHas('jobListings', function ($query) {
        $query->where('is_active', true)
          ->whereNull('deleted_at')
          ->where('application_deadline', '>=', now());
      })
        ->active()
        ->orderBy('name')
        ->get()
        ->map(fn($location) => [
          'id' => $location->id,
          'name' => $location->name,
          'count' => $location->jobListings()->where('is_active', true)->count(),
        ]);

      // Get distinct job types
      $jobTypes = JobListing::where('is_active', true)
        ->whereNull('deleted_at')
        ->where('application_deadline', '>=', now())
        ->distinct()
        ->pluck('job_type')
        ->toArray();

      // Get distinct experience levels
      $experienceLevels = JobListing::where('is_active', true)
        ->whereNull('deleted_at')
        ->where('application_deadline', '>=', now())
        ->distinct()
        ->pluck('experience_level')
        ->toArray();

      return response()->json([
        'success' => true,
        'data' => [
          'categories' => $categories,
          'locations' => $locations,
          'job_types' => $jobTypes,
          'experience_levels' => $experienceLevels,
        ],
      ]);
    } catch (\Exception $e) {
      Log::error('Filter options error: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch filter options',
      ], 500);
    }
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

  /**
   * Apply sorting to the query.
   */
  private function applySorting($query, string $sort): void
  {
    switch ($sort) {
      case 'latest':
        $query->orderBy('created_at', 'desc');
        break;
      case 'oldest':
        $query->orderBy('created_at', 'asc');
        break;
      case 'views':
        $query->orderBy('views_count', 'desc');
        break;
      case 'popular':
        $query->orderBy('applications_count', 'desc');
        break;
      case 'salary_high':
        $query->orderByRaw('COALESCE(salary_max, salary_min, 0) DESC');
        break;
      case 'salary_low':
        $query->orderByRaw('COALESCE(salary_min, salary_max, 0) ASC');
        break;
      case 'deadline_soon':
        $query->orderBy('application_deadline', 'asc');
        break;
      default:
        $query->orderBy('created_at', 'desc');
    }
  }

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
    // ✅ Format response consistently for paginated data
    if (is_object($data) && method_exists($data, 'toArray')) {
      $data = $data->toArray();
    }

    // Check if it's a paginated response (has data, links, meta)
    if (is_array($data) && isset($data['data']) && isset($data['links']) && isset($data['meta'])) {
      return response()->json([
        'success' => true,
        'data' => $data['data'],
        'meta' => $data['meta'],
        'links' => $data['links'],
      ], $status);
    }

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
