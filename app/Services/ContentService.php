<?php

namespace App\Services;

use App\Models\pages\AboutContent;
use App\Models\pages\Blog;
use App\Models\pages\CustomSectionData;
use App\Models\JobListing;
use App\Models\pages\Page;
use App\Models\pages\Program;
use App\Models\pages\SectionConfig;
use App\Models\pages\SharedData;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ContentService
{
  /**
   * Cache duration in minutes.
   */
  protected int $cacheMinutes = 60;

    /* ==========================================
     | PAGE & SECTION METHODS
     |========================================== */

  /**
   * Get a page by slug.
   */
  public function getPage(string $slug): ?Page
  {
    return Cache::remember("page.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return Page::where('slug', $slug)->active()->first();
    });
  }

  /**
   * Get all enabled sections for a page, ordered by display_order.
   */
  public function getPageSections(string $pageSlug): Collection
  {
    return Cache::remember("sections.{$pageSlug}", $this->cacheMinutes, function () use ($pageSlug) {
      return SectionConfig::forPage($pageSlug)
        ->enabled()
        ->ordered()
        ->get();
    });
  }

  /**
   * Get data for a specific section (custom_section_data, about_content, etc.)
   */
  public function getSectionData(string $pageSlug, string $sectionKey)
  {
    $cacheKey = "section_data.{$pageSlug}.{$sectionKey}";

    return Cache::remember($cacheKey, $this->cacheMinutes, function () use ($pageSlug, $sectionKey) {
      $sectionConfig = SectionConfig::forPage($pageSlug)
        ->where('section_key', $sectionKey)
        ->first();

      if (!$sectionConfig) {
        return null;
      }

      return match ($sectionConfig->data_table) {
        'custom_section_data' => CustomSectionData::forPage($pageSlug)
          ->forSection($sectionKey)
          ->active()
          ->first(),

        'about_content' => AboutContent::where('slug', $sectionKey)
          ->active()
          ->first(),

        'blogs' => Blog::active()->latest()->get(),

        'programs' => Program::active()->ordered()->get(),

        'shared_data' => SharedData::ofType($sectionKey)->active()->first(),

        default => null,
      };
    });
  }

    /* ==========================================
     | SHARED DATA METHODS
     |========================================== */

  /**
   * Get shared data by type (topbar, navbar, footer, faq, upcoming-events).
   */
   public function getSharedData(string $type): ?SharedData
  {
    // DEBUG: Check what's in the database
    $dbResult = SharedData::ofType($type)->active()->first();
    
    Log::info("getSharedData({$type}) - Direct DB query", [
      'found' => $dbResult ? 'yes' : 'no',
      'id' => $dbResult ? $dbResult->id : null,
      'has_data' => $dbResult && $dbResult->data ? 'yes' : 'no',
      'data_preview' => $dbResult ? substr(json_encode($dbResult->data), 0, 200) : null,
    ]);
    
    $result = Cache::remember("shared.{$type}", $this->cacheMinutes, function () use ($type) {
      return SharedData::ofType($type)->active()->first();
    });
    
    Log::info("getSharedData({$type}) - From Cache", [
      'found' => $result ? 'yes' : 'no',
      'has_data' => $result && $result->data ? 'yes' : 'no',
    ]);
    
    return $result;
  }

  /**
   * Get topbar data.
   */
  public function getTopbar(): ?SharedData
  {
    return $this->getSharedData('topbar');
  }

  /**
   * Get navbar data.
   */
  public function getNavbar(): ?SharedData
  {
    return $this->getSharedData('navbar');
  }

  /**
   * Get footer data.
   */
  public function getFooter(): ?SharedData
  {
    return $this->getSharedData('footer');
  }

  /**
   * Get FAQ data.
   */
  public function getFaqs(): ?SharedData
  {
    return $this->getSharedData('faq');
  }

  /**
   * Get upcoming events data.
   */
  public function getUpcomingEvents(): ?SharedData
  {
    return $this->getSharedData('upcoming-events');
  }

    /* ==========================================
     | BLOG METHODS
     |========================================== */

  /**
   * Get all active blogs, optionally limited.
   */
  public function getBlogs(?int $limit = null): Collection
  {
    return Cache::remember("blogs.all." . ($limit ?? 'all'), $this->cacheMinutes, function () use ($limit) {
      return Blog::active()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  /**
   * Get featured blogs, optionally limited.
   */
  public function getFeaturedBlogs(?int $limit = null): Collection
  {
    return Cache::remember("blogs.featured." . ($limit ?? 'all'), $this->cacheMinutes, function () use ($limit) {
      return Blog::active()
        ->featured()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  /**
   * Get a single blog by slug.
   */
  public function getBlog(string $slug): Blog
  {
    return Cache::remember("blog.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return Blog::where('slug', $slug)->active()->firstOrFail();
    });
  }

  /**
   * Get related blogs excluding a given blog ID, optionally filtered by tags.
   */
  public function getRelatedBlogs(int $blogId, array $tags = [], int $limit = 3): Collection
  {
    $cacheKey = "blogs.related.{$blogId}." . md5(implode(',', $tags) . $limit);

    return Cache::remember($cacheKey, $this->cacheMinutes, function () use ($blogId, $tags, $limit) {
      $query = Blog::active()->where('id', '!=', $blogId);

      if (!empty($tags)) {
        $query->where(function ($q) use ($tags) {
          foreach ($tags as $tag) {
            $q->orWhereJsonContains('tags', $tag);
          }
        });
      }

      return $query->latest()->limit($limit)->get();
    });
  }

    /* ==========================================
     | PROGRAM METHODS
     |========================================== */

  /**
   * Get all active programs, optionally limited.
   */
  public function getPrograms(?int $limit = null): Collection
  {
    return Cache::remember("programs.all." . ($limit ?? 'all'), $this->cacheMinutes, function () use ($limit) {
      return Program::active()
        ->ordered()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  /**
   * Get featured programs, optionally limited.
   */
  public function getFeaturedPrograms(?int $limit = null): Collection
  {
    return Cache::remember("programs.featured." . ($limit ?? 'all'), $this->cacheMinutes, function () use ($limit) {
      return Program::active()
        ->featured()
        ->ordered()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  /**
   * Get a single program by slug.
   */
  public function getProgram(string $slug): Program
  {
    return Cache::remember("program.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return Program::where('slug', $slug)->active()->firstOrFail();
    });
  }

    /* ==========================================
     | ABOUT CONTENT METHODS
     |========================================== */

  /**
   * Get about content by slug.
   */
  public function getAboutContent(string $slug): AboutContent
  {
    return Cache::remember("about.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return AboutContent::where('slug', $slug)->active()->firstOrFail();
    });
  }

  /**
   * Get the main about page content (type = 'main').
   */
  public function getMainAboutContent(): ?AboutContent
  {
    return Cache::remember('about.main', $this->cacheMinutes, function () {
      return AboutContent::main()->active()->first();
    });
  }

  /**
   * Get all detail about pages (type = 'detail').
   */
  public function getAboutDetails(): Collection
  {
    return Cache::remember('about.details', $this->cacheMinutes, function () {
      return AboutContent::detail()->active()->ordered()->get();
    });
  }

    /* ==========================================
     | JOBS METHODS (if JobListing model exists)
     |========================================== */

  /**
   * Get active job listings, optionally limited.
   */
  public function getJobs(?int $limit = 5): Collection
  {
    if (!class_exists(JobListing::class)) {
      return collect();
    }

    return Cache::remember("jobs." . ($limit ?? 'all'), $this->cacheMinutes, function () use ($limit) {
      return JobListing::active()
        ->orderBy('views_count', 'desc')
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

    /* ==========================================
     | CUSTOM SECTION DATA (direct access)
     |========================================== */

  /**
   * Get custom section data for a page and section key.
   */
  public function getCustomSectionData(string $pageSlug, string $sectionKey): ?CustomSectionData
  {
    return Cache::remember("custom.{$pageSlug}.{$sectionKey}", $this->cacheMinutes, function () use ($pageSlug, $sectionKey) {
      return CustomSectionData::forPage($pageSlug)
        ->forSection($sectionKey)
        ->active()
        ->first();
    });
  }

    /* ==========================================
     | UTILITY: CLEAR CACHE
     |========================================== */

  /**
   * Clear all cached content data.
   * Useful after CMS updates.
   */
  public function clearCache(): void
  {
    // In a real implementation, you'd want to clear specific keys or use tags.
    // For simplicity, we'll just flush the cache store used for content.
    Cache::flush();
  }
}
