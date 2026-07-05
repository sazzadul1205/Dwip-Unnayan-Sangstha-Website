<?php
// app/Http/Controllers/Api/JobListingApiController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class JobListingApiController extends Controller
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
   * Get job listings with search, fixed sort by views, and limit support
   * 
   * @param Request $request
   * @return JsonResponse
   * 
   * Query Parameters:
   * - search: Search by title, description, requirements, skills, keywords
   * - limit: Number of results to return (max 100) - if provided, returns all results up to limit
   * - page: Page number for pagination
   * - per_page: Items per page (default 15, max 100)
   * - show_all: If true, returns all records (ignores pagination)
   * 
   * Note: Results are always sorted by views_count DESC (most viewed first)
   */
  public function index(Request $request): JsonResponse
  {
    try {
      $query = JobListing::with(['category', 'locations', 'employer']);

      // Apply active filter by default (unless show_all is true)
      if (!$request->boolean('show_all')) {
        $query->active()->published();
      } elseif ($request->has('is_active')) {
        $query->where('is_active', $request->boolean('is_active'));
      }

      // ============================================
      // 1. SEARCH ONLY
      // ============================================
      if ($request->filled('search')) {
        $searchTerm = $request->search;
        $query->search($searchTerm);
      }

      // ============================================
      // 2. FIXED SORT BY VIEWS (Most viewed first)
      // ============================================
      $query->orderBy('views_count', 'desc');

      // ============================================
      // 3. LIMIT SUPPORT
      // ============================================
      // Handle limit (returns all results up to limit)
      if ($request->has('limit')) {
        $limit = $this->sanitizeLimit($request->limit);
        $data = $query->limit($limit)->get();
        return $this->successResponse($data);
      }

      // Handle pagination
      if ($request->has('page')) {
        $perPage = $this->sanitizePerPage($request->per_page ?? self::DEFAULT_PER_PAGE);
        $data = $query->paginate($perPage);
        return $this->successResponse($data);
      }

      // Default: return paginated results
      $perPage = $this->sanitizePerPage($request->per_page ?? self::DEFAULT_PER_PAGE);
      $data = $query->paginate($perPage);

      return $this->successResponse($data);
    } catch (\Exception $e) {
      Log::error('JobListing API error: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString()
      ]);

      return $this->errorResponse('Failed to fetch job listings');
    }
  }

  /**
   * Get a single job listing by ID or slug
   * 
   * @param string $identifier
   * @param Request $request
   * @return JsonResponse
   */
  public function show(string $identifier, Request $request): JsonResponse
  {
    try {
      $query = JobListing::with(['category', 'locations', 'employer']);

      // If identifier is numeric, find by ID, otherwise find by slug
      if (is_numeric($identifier)) {
        $job = $query->find($identifier);
      } else {
        $job = $query->where('slug', $identifier)->first();
      }

      if (!$job) {
        return $this->errorResponse('Job listing not found', 404);
      }

      // Increment view count
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
   * Get related jobs for a specific job by slug
   * Returns exactly 3 related jobs based on:
   * 1. Same category (priority)
   * 2. Same job type (secondary)
   * 3. Similar title keywords (tertiary)
   * 
   * @param string $slug
   * @param Request $request
   * @return JsonResponse
   */
  public function related(string $slug, Request $request): JsonResponse
  {
    try {
      // Find the job by slug
      $job = JobListing::with(['category', 'locations', 'employer'])
        ->where('slug', $slug)
        ->first();

      if (!$job) {
        return $this->errorResponse('Job listing not found', 404);
      }

      // Start building the query for related jobs
      $query = JobListing::with(['category', 'locations', 'employer'])
        ->active()
        ->published()
        ->where('id', '!=', $job->id) // Exclude the current job
        ->orderBy('views_count', 'desc'); // Sort by views

      // ============================================
      // PRIORITY 1: Same category
      // ============================================
      if ($job->category_id) {
        $query->where('category_id', $job->category_id);
      }

      // ============================================
      // PRIORITY 2: If we have less than 3, add by job type
      // ============================================
      $relatedJobs = $query->limit(3)->get();

      if ($relatedJobs->count() < 3 && $job->job_type) {
        // Get IDs of already selected jobs
        $excludedIds = $relatedJobs->pluck('id')->toArray();
        $excludedIds[] = $job->id;

        $moreJobs = JobListing::with(['category', 'locations', 'employer'])
          ->active()
          ->published()
          ->whereNotIn('id', $excludedIds)
          ->where('job_type', $job->job_type)
          ->orderBy('views_count', 'desc')
          ->limit(3 - $relatedJobs->count())
          ->get();

        $relatedJobs = $relatedJobs->merge($moreJobs);
      }

      // ============================================
      // PRIORITY 3: If we still have less than 3, add by similar title keywords
      // ============================================
      if ($relatedJobs->count() < 3 && $job->title) {
        // Extract keywords from title (remove common words)
        $keywords = $this->extractKeywords($job->title);

        if (!empty($keywords)) {
          $excludedIds = $relatedJobs->pluck('id')->toArray();
          $excludedIds[] = $job->id;

          // Build a search query using keywords
          $titleQuery = JobListing::with(['category', 'locations', 'employer'])
            ->active()
            ->published()
            ->whereNotIn('id', $excludedIds)
            ->orderBy('views_count', 'desc');

          // Add search conditions for each keyword
          $titleQuery->where(function ($q) use ($keywords) {
            foreach ($keywords as $keyword) {
              $q->orWhere('title', 'LIKE', "%{$keyword}%");
            }
          });

          $moreJobs = $titleQuery
            ->limit(3 - $relatedJobs->count())
            ->get();

          $relatedJobs = $relatedJobs->merge($moreJobs);
        }
      }

      // ============================================
      // FALLBACK: If still less than 3, get any recent jobs
      // ============================================
      if ($relatedJobs->count() < 3) {
        $excludedIds = $relatedJobs->pluck('id')->toArray();
        $excludedIds[] = $job->id;

        $fallbackJobs = JobListing::with(['category', 'locations', 'employer'])
          ->active()
          ->published()
          ->whereNotIn('id', $excludedIds)
          ->orderBy('views_count', 'desc')
          ->limit(3 - $relatedJobs->count())
          ->get();

        $relatedJobs = $relatedJobs->merge($fallbackJobs);
      }

      // Ensure we always return exactly 3 (or less if not enough jobs exist)
      $relatedJobs = $relatedJobs->take(3);

      return $this->successResponse([
        'current_job' => $job,
        'related_jobs' => $relatedJobs,
        'count' => $relatedJobs->count(),
        'match_reasons' => $this->getMatchReasons($job, $relatedJobs)
      ]);
    } catch (\Exception $e) {
      Log::error('JobListing related API error: ' . $e->getMessage(), [
        'job_slug' => $slug,
        'trace' => $e->getTraceAsString()
      ]);

      return $this->errorResponse('Failed to fetch related jobs');
    }
  }

  /**
   * Extract keywords from a title for search
   */
  private function extractKeywords(string $title): array
  {
    // Common words to exclude
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

    // Remove special characters and split
    $words = preg_split('/\s+/', preg_replace('/[^\w\s]/', '', strtolower($title)));

    // Filter stop words and short words
    $keywords = array_filter($words, function ($word) use ($stopWords) {
      return strlen($word) > 2 && !in_array($word, $stopWords);
    });

    return array_values($keywords);
  }

  /**
   * Get match reasons for the related jobs
   */
  private function getMatchReasons(JobListing $job, $relatedJobs): array
  {
    $reasons = [];

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

      // Check if any locations match
      $jobLocationIds = $job->locations->pluck('id')->toArray();
      $relatedLocationIds = $related->locations->pluck('id')->toArray();
      if (!empty(array_intersect($jobLocationIds, $relatedLocationIds))) {
        $reason[] = 'Same location';
      }

      // Check title similarity
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

  /**
   * Sanitize and validate per page value
   */
  private function sanitizePerPage($value): int
  {
    $perPage = (int) $value;
    return min(max($perPage, 1), self::MAX_PER_PAGE);
  }

  /**
   * Sanitize and validate limit value
   */
  private function sanitizeLimit($value, int $max = 100): int
  {
    $limit = (int) $value;
    return min(max($limit, 1), $max);
  }

  /**
   * Return success response
   */
  private function successResponse($data, int $status = 200): JsonResponse
  {
    return response()->json([
      'success' => true,
      'data' => $data
    ], $status);
  }

  /**
   * Return error response
   */
  private function errorResponse(string $message, int $status = 500): JsonResponse
  {
    return response()->json([
      'success' => false,
      'message' => $message
    ], $status);
  }
}
