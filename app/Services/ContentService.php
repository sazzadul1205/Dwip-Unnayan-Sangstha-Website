<?php

namespace App\Services;

use App\Models\pages\AboutContent;
use App\Models\pages\Blog;
use App\Models\pages\CustomSectionData;
use App\Models\JobListing;
use App\Models\pages\Page;
use App\Models\pages\Program;
use App\Models\pages\Publication;
use App\Models\pages\SectionConfig;
use App\Models\pages\SharedData;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ContentService
{
  protected int $cacheMinutes = 60;

  /* ==========================================
     | PAGE & SECTION METHODS
     |========================================== */

  public function getPage(string $slug): ?Page
  {
    return Cache::remember("page.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return Page::where('slug', $slug)->active()->first();
    });
  }

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
   * @return mixed (type depends on data_table)
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

        'publications' => Publication::active()->latest()->get(),

        'shared_data' => SharedData::ofType($sectionKey)->active()->first(),

        default => null,
      };
    });
  }

  /* ==========================================
     | SHARED DATA METHODS
     |========================================== */

  public function getSharedData(string $type): ?SharedData
  {
    $key = "shared.{$type}";
    $cached = Cache::get($key);

    if ($cached instanceof SharedData) {
      return $cached;
    }

    $result = SharedData::ofType($type)->active()->first();
    if ($result) {
      Cache::put($key, $result, $this->cacheMinutes * 60);
    }
    return $result;
  }

  /* ==========================================
 | SHARED DATA METHODS
 |========================================== */

  public function getTopbar(): ?SharedData
  {
    return $this->getSharedData('topbar');
  }

  public function getNavbar(): ?SharedData
  {
    return $this->getSharedData('navbar');
  }

  public function getFooter(): ?SharedData
  {
    return $this->getSharedData('footer');
  }

  public function getFaqs(): ?SharedData
  {
    return $this->getSharedData('faq');
  }

  public function getUpcomingEvents(): ?SharedData
  {
    return $this->getSharedData('upcoming-events');
  }

  public function getStories(): ?SharedData
  {
    return $this->getSharedData('stories');
  }

  /* ==========================================
     | BLOG METHODS
     |========================================== */

  public function getBlogs(?int $limit = null): Collection
  {
    $key = "blogs.all." . ($limit ?? 'all');
    return Cache::remember($key, $this->cacheMinutes, function () use ($limit) {
      return Blog::active()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getFeaturedBlogs(?int $limit = null): Collection
  {
    $key = "blogs.featured." . ($limit ?? 'all');
    return Cache::remember($key, $this->cacheMinutes, function () use ($limit) {
      return Blog::active()
        ->featured()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getBlog(string $slug): Blog
  {
    return Cache::remember("blog.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return Blog::where('slug', $slug)->active()->firstOrFail();
    });
  }

  public function getRelatedBlogs(int $blogId, array $tags = [], int $limit = 3): Collection
  {
    $key = "blogs.related.{$blogId}." . md5(implode(',', $tags) . $limit);
    return Cache::remember($key, $this->cacheMinutes, function () use ($blogId, $tags, $limit) {
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

  public function getPrograms(?int $limit = null): Collection
  {
    $key = "programs.all." . ($limit ?? 'all');
    return Cache::remember($key, $this->cacheMinutes, function () use ($limit) {
      return Program::active()
        ->ordered()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getFeaturedPrograms(?int $limit = null): Collection
  {
    $key = "programs.featured." . ($limit ?? 'all');
    return Cache::remember($key, $this->cacheMinutes, function () use ($limit) {
      return Program::active()
        ->featured()
        ->ordered()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getProgram(string $slug): Program
  {
    return Cache::remember("program.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return Program::where('slug', $slug)->active()->firstOrFail();
    });
  }

  /* ==========================================
     | ABOUT CONTENT METHODS
     |========================================== */

  public function getAboutContent(string $slug): AboutContent
  {
    return Cache::remember("about.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return AboutContent::where('slug', $slug)->active()->firstOrFail();
    });
  }

  public function getMainAboutContent(): ?AboutContent
  {
    return Cache::remember('about.main', $this->cacheMinutes, function () {
      return AboutContent::main()->active()->first();
    });
  }

  public function getAboutDetails(): Collection
  {
    return Cache::remember('about.details', $this->cacheMinutes, function () {
      return AboutContent::detail()->active()->ordered()->get();
    });
  }

  /* ==========================================
     | PUBLICATION METHODS
     |========================================== */

  public function getPublications(?int $limit = null): Collection
  {
    $key = "publications.all." . ($limit ?? 'all');
    return Cache::remember($key, $this->cacheMinutes, function () use ($limit) {
      return Publication::active()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getFeaturedPublications(?int $limit = null): Collection
  {
    $key = "publications.featured." . ($limit ?? 'all');
    return Cache::remember($key, $this->cacheMinutes, function () use ($limit) {
      return Publication::active()
        ->featured()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getPublication(string $slug): Publication
  {
    return Cache::remember("publication.{$slug}", $this->cacheMinutes, function () use ($slug) {
      return Publication::where('slug', $slug)->active()->firstOrFail();
    });
  }

  public function getRelatedPublications(int $publicationId, array $tags = [], int $limit = 3): Collection
  {
    $key = "publications.related.{$publicationId}." . md5(implode(',', $tags) . $limit);
    return Cache::remember($key, $this->cacheMinutes, function () use ($publicationId, $tags, $limit) {
      $query = Publication::active()->where('id', '!=', $publicationId);
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
     | JOBS METHODS
     |========================================== */

  public function getJobs(?int $limit = 5): Collection
  {
    if (!class_exists(JobListing::class)) {
      return collect();
    }
    $key = "jobs." . ($limit ?? 'all');
    return Cache::remember($key, $this->cacheMinutes, function () use ($limit) {
      return JobListing::active()
        ->orderBy('views_count', 'desc')
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  /* ==========================================
     | CUSTOM SECTION DATA
     |========================================== */

  public function getCustomSectionData(string $pageSlug, string $sectionKey): ?CustomSectionData
  {
    $key = "custom.{$pageSlug}.{$sectionKey}";
    return Cache::remember($key, $this->cacheMinutes, function () use ($pageSlug, $sectionKey) {
      return CustomSectionData::forPage($pageSlug)
        ->forSection($sectionKey)
        ->active()
        ->first();
    });
  }

  /* ==========================================
     | UTILITY
     |========================================== */

  public function clearCache(): void
  {
    Cache::flush();
  }
}
