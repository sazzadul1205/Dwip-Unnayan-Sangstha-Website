<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Database\Query\Builder;

class ContentApiController extends Controller
{
  /**
   * Maximum items per page
   */
  private const MAX_PER_PAGE = 100;

  /**
   * Default items per page
   */
  private const DEFAULT_PER_PAGE = 15;

  /**
   * Cache duration in seconds (5 minutes)
   */
  private const CACHE_DURATION = 300;

  /**
   * Rate limit max attempts per minute
   */
  private const RATE_LIMIT_ATTEMPTS = 60;

  /**
   * Rate limit decay in seconds (1 minute)
   */
  private const RATE_LIMIT_DECAY = 60;

  /**
   * Get pages with query parameters – with rate limiting and logging.
   */
  public function pages(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'pages');
    $this->logApiRequest($request, 'pages');

    $cacheKey = $this->getCacheKey($request, 'pages');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = DB::table('pages')
          ->where('is_active', 1)
          ->select('id', 'slug', 'name', 'title', 'description', 'is_active', 'created_at', 'updated_at');

        $this->applyFilters($query, $request, [
          'slug' => 'where',
          'search' => 'search',
        ]);

        if ($request->has('slugs')) {
          $slugs = array_filter(explode(',', $request->slugs));
          if (!empty($slugs)) {
            $query->whereIn('slug', $slugs);
          }
        }

        $this->applySorting($query, $request, ['id', 'slug', 'name', 'title', 'created_at', 'updated_at']);

        return $this->paginateOrGet($query, $request);
      } catch (\Exception $e) {
        Log::error('Pages API error: ' . $e->getMessage(), [
          'trace' => $e->getTraceAsString(),
          'request' => $request->all(),
        ]);
        return $this->errorResponse('Failed to fetch pages');
      }
    });
  }

  /**
   * Get section configs – with rate limiting and logging.
   */
  public function sectionConfigs(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'section_configs');
    $this->logApiRequest($request, 'section_configs');

    $cacheKey = $this->getCacheKey($request, 'section_configs');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = DB::table('section_configs')
          ->where('is_enabled', 1)
          ->orderBy('display_order');

        $this->applyFilters($query, $request, [
          'page_slug' => 'where',
          'component' => 'where',
          'data_table' => 'where',
          'is_fixed_section' => 'whereInt',
          'search' => 'search',
        ]);

        if ($request->has('components')) {
          $components = array_filter(explode(',', $request->components));
          if (!empty($components)) {
            $query->whereIn('component', $components);
          }
        }

        $this->applyRangeFilters($query, $request, [
          'display_order' => ['min' => 'display_order_min', 'max' => 'display_order_max']
        ]);

        if ($request->has('search')) {
          $search = '%' . $request->search . '%';
          $query->where(function ($q) use ($search) {
            $q->where('component', 'like', $search)
              ->orWhere('data_key', 'like', $search)
              ->orWhere('section_key', 'like', $search);
          });
        }

        $this->applySorting($query, $request, ['id', 'display_order', 'component', 'page_slug', 'created_at']);

        return $this->paginateOrGet($query, $request, self::DEFAULT_PER_PAGE * 3);
      } catch (\Exception $e) {
        Log::error('Section configs API error: ' . $e->getMessage());
        return $this->errorResponse('Failed to fetch section configs');
      }
    });
  }

  /**
   * Get shared data – with rate limiting and logging.
   */
  public function sharedData(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'shared_data');
    $this->logApiRequest($request, 'shared_data');

    $cacheKey = $this->getCacheKey($request, 'shared_data');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = DB::table('shared_data')->where('is_active', 1);

        $this->applyFilters($query, $request, [
          'type' => 'where',
          'search' => 'search',
        ]);

        if ($request->has('types')) {
          $types = array_filter(explode(',', $request->types));
          if (!empty($types)) {
            $query->whereIn('type', $types);
          }
        }

        if ($request->has('json_search')) {
          $search = '%' . $request->json_search . '%';
          $query->where('data', 'like', $search);
        }

        $this->applySorting($query, $request, ['id', 'type', 'created_at', 'updated_at']);

        return $this->paginateOrGet($query, $request, self::DEFAULT_PER_PAGE * 3);
      } catch (\Exception $e) {
        Log::error('Shared data API error: ' . $e->getMessage());
        return $this->errorResponse('Failed to fetch shared data');
      }
    });
  }

  /**
   * Get custom section data – with rate limiting and logging.
   */
  public function customSectionData(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'custom_section_data');
    $this->logApiRequest($request, 'custom_section_data');

    $cacheKey = $this->getCacheKey($request, 'custom_section_data');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = DB::table('custom_section_data')->where('is_active', 1);

        $this->applyFilters($query, $request, [
          'page_slug' => 'where',
          'section_key' => 'where',
          'is_active' => 'whereInt',
          'search' => 'search',
        ]);

        if ($request->has('section_keys')) {
          $keys = array_filter(explode(',', $request->section_keys));
          if (!empty($keys)) {
            $query->whereIn('section_key', $keys);
          }
        }

        $this->applySorting($query, $request, ['id', 'page_slug', 'section_key', 'is_active', 'created_at']);

        return $this->paginateOrGet($query, $request, self::DEFAULT_PER_PAGE * 3);
      } catch (\Exception $e) {
        Log::error('Custom section data API error: ' . $e->getMessage());
        return $this->errorResponse('Failed to fetch custom section data');
      }
    });
  }

  /**
   * Get programs – with rate limiting and logging.
   */
  public function programs(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'programs');
    $this->logApiRequest($request, 'programs');

    $cacheKey = $this->getCacheKey($request, 'programs');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = DB::table('programs')->where('is_active', 1);

        $this->applyFilters($query, $request, [
          'slug' => 'where',
          'is_featured' => 'whereInt',
          'category' => 'where',
          'search' => 'search',
        ]);

        if ($request->has('slugs')) {
          $slugs = array_filter(explode(',', $request->slugs));
          if (!empty($slugs)) {
            $query->whereIn('slug', $slugs);
          }
        }

        if ($request->has('categories')) {
          $categories = array_filter(explode(',', $request->categories));
          if (!empty($categories)) {
            $query->whereIn('category', $categories);
          }
        }

        $this->applyRangeFilters($query, $request, [
          'display_order' => ['min' => 'display_order_min', 'max' => 'display_order_max'],
          'created_at' => ['min' => 'created_from', 'max' => 'created_to']
        ]);

        $this->applySorting($query, $request, ['id', 'title', 'display_order', 'is_featured', 'created_at', 'updated_at']);

        if ($request->has('limit')) {
          $query->limit($this->sanitizeLimit($request->limit));
        }

        return $this->paginateOrGet($query, $request);
      } catch (\Exception $e) {
        Log::error('Programs API error: ' . $e->getMessage());
        return $this->errorResponse('Failed to fetch programs');
      }
    });
  }

  /**
   * Get blogs – with rate limiting and logging.
   */
  public function blogs(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'blogs');
    $this->logApiRequest($request, 'blogs');

    $cacheKey = $this->getCacheKey($request, 'blogs');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = DB::table('blogs')->where('is_active', 1);

        $this->applyFilters($query, $request, [
          'slug' => 'where',
          'is_featured' => 'whereInt',
          'author' => 'whereLike',
          'category' => 'where',
          'search' => 'search',
        ]);

        if ($request->has('slugs')) {
          $slugs = array_filter(explode(',', $request->slugs));
          if (!empty($slugs)) {
            $query->whereIn('slug', $slugs);
          }
        }

        if ($request->has('categories')) {
          $categories = array_filter(explode(',', $request->categories));
          if (!empty($categories)) {
            $query->whereIn('category', $categories);
          }
        }

        if ($request->has('tag')) {
          $tag = $request->tag;
          $query->where(function ($q) use ($tag) {
            $q->where('tags', 'like', '%"' . $tag . '"%')
              ->orWhere('tags', 'like', '%' . $tag . '%');
          });
        }

        if ($request->has('tags')) {
          $tags = array_filter(explode(',', $request->tags));
          if (!empty($tags)) {
            $query->where(function ($q) use ($tags) {
              foreach ($tags as $tag) {
                $tag = trim($tag);
                $q->orWhere('tags', 'like', '%"' . $tag . '"%')
                  ->orWhere('tags', 'like', '%' . $tag . '%');
              }
            });
          }
        }

        $this->applyRangeFilters($query, $request, [
          'created_at' => ['min' => 'created_from', 'max' => 'created_to'],
          'published_at' => ['min' => 'published_from', 'max' => 'published_to']
        ]);

        $this->applySorting($query, $request, ['id', 'title', 'author', 'is_featured', 'created_at', 'updated_at', 'published_at']);

        if ($request->has('limit')) {
          $query->limit($this->sanitizeLimit($request->limit));
        }

        return $this->paginateOrGet($query, $request);
      } catch (\Exception $e) {
        Log::error('Blogs API error: ' . $e->getMessage());
        return $this->errorResponse('Failed to fetch blogs');
      }
    });
  }

  /**
   * Get about content – with rate limiting and logging.
   */
  public function aboutContent(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'about_content');
    $this->logApiRequest($request, 'about_content');

    $cacheKey = $this->getCacheKey($request, 'about_content');

    return Cache::remember($cacheKey, self::CACHE_DURATION, function () use ($request) {
      try {
        $query = DB::table('about_content')->where('is_active', 1);

        $this->applyFilters($query, $request, [
          'slug' => 'where',
          'search' => 'search',
        ]);

        if ($request->has('slugs')) {
          $slugs = array_filter(explode(',', $request->slugs));
          if (!empty($slugs)) {
            $query->whereIn('slug', $slugs);
          }
        }

        $this->applyRangeFilters($query, $request, [
          'display_order' => ['min' => 'display_order_min', 'max' => 'display_order_max']
        ]);

        $this->applySorting($query, $request, ['id', 'title', 'slug', 'display_order', 'created_at', 'updated_at']);

        if ($request->has('limit')) {
          $query->limit($this->sanitizeLimit($request->limit));
        }

        return $this->paginateOrGet($query, $request);
      } catch (\Exception $e) {
        Log::error('About content API error: ' . $e->getMessage());
        return $this->errorResponse('Failed to fetch about content');
      }
    });
  }

  /**
   * Get jobs – with rate limiting, logging, and NO caching (data changes frequently).
   */
  public function jobs(Request $request): JsonResponse
  {
    $this->checkApiRateLimit($request, 'jobs');
    $this->logApiRequest($request, 'jobs');

    try {
      $query = DB::table('job_listings')->where('is_active', 1);

      $this->applyFilters($query, $request, [
        'slug' => 'where',
        'type' => 'where', // mapped to job_type
        'department' => 'whereLike',
        'location' => 'whereLike',
        'is_active' => 'whereInt',
        'category_id' => 'whereInt',
        'experience_level' => 'where',
        'is_salary_negotiable' => 'whereInt',
        'search' => 'search',
      ]);

      if ($request->has('types')) {
        $types = array_filter(explode(',', $request->types));
        if (!empty($types)) {
          $query->whereIn('job_type', $types);
        }
      }

      $this->applyRangeFilters($query, $request, [
        'views_count' => ['min' => 'min_views', 'max' => 'max_views'],
        'created_at' => ['min' => 'created_from', 'max' => 'created_to'],
        'application_deadline' => ['min' => 'deadline_after', 'max' => 'deadline_before'],
        'salary_min' => ['min' => 'salary_min', 'max' => null],
        'salary_max' => ['min' => null, 'max' => 'salary_max'],
      ]);

      if ($request->has('keyword_search')) {
        $search = '%' . $request->keyword_search . '%';
        $keyword = $request->keyword_search;
        $query->where(function ($q) use ($search, $keyword) {
          $q->where('keywords', 'like', $search)
            ->orWhereJsonContains('keywords', $keyword);
        });
      }

      if ($request->has('skill_search')) {
        $query->whereJsonContains('skills', $request->skill_search);
      }

      $this->applySorting($query, $request, [
        'id',
        'title',
        'job_type',
        'views_count',
        'created_at',
        'updated_at',
        'application_deadline',
        'salary_min',
        'salary_max',
        'is_active',
        'category_id',
        'experience_level'
      ]);

      if ($request->has('most_viewed')) {
        $limit = $this->sanitizeLimit($request->most_viewed, 20);
        $query->orderBy('views_count', 'desc')->limit($limit);
      } elseif ($request->has('latest')) {
        $limit = $this->sanitizeLimit($request->latest, 20);
        $query->orderBy('created_at', 'desc')->limit($limit);
      } elseif (!$request->has('sort_by') && !$request->has('page')) {
        $query->orderBy('views_count', 'desc')->limit(5);
      }

      if (!$request->has('page') && !$request->has('most_viewed') && !$request->has('latest')) {
        $limit = $request->has('limit') ? $this->sanitizeLimit($request->limit) : 5;
        $query->limit($limit);
      }

      $data = $query->get();

      if ($request->has('format') && $request->input('format') === 'react') {
        $data = $data->map(fn($job) => $this->formatJobForReact($job));
      }

      if ($request->has('page')) {
        $perPage = $this->sanitizePerPage($request->per_page ?? 15);
        $paginated = $query->paginate($perPage);

        if ($request->has('format') && $request->input('format') === 'react') {
          $paginated->getCollection()->transform(fn($job) => $this->formatJobForReact($job));
        }

        return response()->json(['data' => $paginated]);
      }

      return response()->json(['data' => $data]);
    } catch (\Exception $e) {
      Log::error('Jobs API error: ' . $e->getMessage());
      return $this->errorResponse('Failed to fetch jobs');
    }
  }

    // ==========================================
    // PRIVATE HELPER METHODS
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

    // Add user ID if authenticated
    if ($request->user()) {
      $data['user_id'] = $request->user()->id;
    }

    // Use SimpleLogger if available, otherwise fallback to Log
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
    // Include all query parameters to differentiate cached responses
    $params = $request->query();
    ksort($params); // stable order
    $key = 'api_' . $endpoint . '_' . md5(json_encode($params));
    return $key;
  }

  /**
   * Apply common filters to query builder.
   */
  private function applyFilters(Builder $query, Request $request, array $filters): void
  {
    foreach ($filters as $param => $type) {
      if (!$request->has($param)) {
        continue;
      }

      $value = $request->$param;

      switch ($type) {
        case 'where':
          $query->where($param, $value);
          break;
        case 'whereInt':
          $query->where($param, (int) $value);
          break;
        case 'whereLike':
          $query->where($param, 'like', '%' . $value . '%');
          break;
        case 'search':
          $search = '%' . $value . '%';
          $query->where(function ($q) use ($search) {
            $q->where('name', 'like', $search)
              ->orWhere('title', 'like', $search)
              ->orWhere('description', 'like', $search);
          });
          break;
      }
    }
  }

  /**
   * Apply range filters to query builder.
   */
  private function applyRangeFilters(Builder $query, Request $request, array $ranges): void
  {
    foreach ($ranges as $column => $params) {
      if (isset($params['min']) && $request->has($params['min'])) {
        $query->where($column, '>=', (int) $request->{$params['min']});
      }
      if (isset($params['max']) && $request->has($params['max'])) {
        $query->where($column, '<=', (int) $request->{$params['max']});
      }
    }
  }

  /**
   * Apply sorting to query builder.
   */
  private function applySorting(Builder $query, Request $request, array $allowedSorts): void
  {
    $sortBy = $request->sort_by ?? 'id';
    $sortOrder = $request->sort_order ?? 'asc';

    if (in_array($sortBy, $allowedSorts) && in_array(strtolower($sortOrder), ['asc', 'desc'])) {
      $query->orderBy($sortBy, $sortOrder);
    }
  }

  /**
   * Paginate or get all results.
   */
  private function paginateOrGet(Builder $query, Request $request, ?int $defaultPerPage = null): JsonResponse
  {
    if ($request->has('page')) {
      $perPage = $this->sanitizePerPage($request->per_page ?? $defaultPerPage ?? self::DEFAULT_PER_PAGE);
      return response()->json(['data' => $query->paginate($perPage)]);
    }

    return response()->json(['data' => $query->get()]);
  }

  /**
   * Sanitize and validate per page value.
   */
  private function sanitizePerPage(int|string $value): int
  {
    $perPage = (int) $value;
    return min(max($perPage, 1), self::MAX_PER_PAGE);
  }

  /**
   * Sanitize and validate limit value.
   */
  private function sanitizeLimit(int|string $value, int $max = 100): int
  {
    $limit = (int) $value;
    return min(max($limit, 1), $max);
  }

  /**
   * Return error response.
   */
  private function errorResponse(string $message, int $status = 500): JsonResponse
  {
    return response()->json([
      'data' => [],
      'error' => $message,
    ], $status);
  }

  /**
   * Format job for React frontend.
   */
  private function formatJobForReact(\stdClass $job): array
  {
    return [
      'id' => $job->id,
      'type' => $this->formatJobType($job->job_type ?? 'full-time'),
      'department' => $this->getDepartmentFromTitle($job->title ?? ''),
      'location' => $job->location ?? 'Bangladesh',
      'title' => $job->title,
      'description' => $job->description ?? 'No description available.',
      'link' => "/jobs/{$job->slug}",
      'views' => $job->views_count ?? 0,
      'slug' => $job->slug,
      'is_active' => $job->is_active ?? true,
    ];
  }

  /**
   * Format job type to match React's expected format.
   */
  private function formatJobType(?string $type): string
  {
    if (!$type) {
      return 'Full time';
    }

    $mapping = [
      'full-time' => 'Full time',
      'part-time' => 'Part time',
      'contract' => 'Contract',
      'internship' => 'Internship',
      'remote' => 'Remote',
      'hybrid' => 'Hybrid',
    ];

    return $mapping[$type] ?? ucfirst(str_replace('-', ' ', $type));
  }

  /**
   * Extract department from job title.
   */
  private function getDepartmentFromTitle(string $title): string
  {
    $keywords = [
      'Manager' => 'Management',
      'Developer' => 'IT & Development',
      'Engineer' => 'IT & Development',
      'Designer' => 'Creative',
      'Marketing' => 'Marketing',
      'Sales' => 'Sales',
      'HR' => 'Human Resources',
      'Finance' => 'Finance',
      'Accountant' => 'Finance',
      'Support' => 'Customer Support',
      'Analyst' => 'Data & Analytics',
      'Specialist' => 'Operations',
      'Coordinator' => 'Operations',
      'Executive' => 'Management',
      'Officer' => 'Operations',
      'Assistant' => 'Operations',
      'Intern' => 'Entry Level',
    ];

    foreach ($keywords as $keyword => $department) {
      if (stripos($title, $keyword) !== false) {
        return $department;
      }
    }

    return 'General';
  }
}
