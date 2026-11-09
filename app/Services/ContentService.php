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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;

class ContentService
{
  protected int $cacheSeconds = 300;

  /* ==========================================
     | PAGE & SECTION METHODS
     |========================================== */

  public function getPage(string $slug): ?Page
  {
    $page = $this->cache()->remember("page.{$slug}", $this->cacheSeconds, function () use ($slug) {
      return Page::where('slug', $slug)->active()->first() ?? false;
    });

    return $page === false ? null : $page;
  }

  public function getPageSections(string $pageSlug): Collection
  {
    return $this->cache()->remember("sections.{$pageSlug}", $this->cacheSeconds, function () use ($pageSlug) {
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
    $data = $this->cache()->remember($cacheKey, $this->cacheSeconds, function () use ($pageSlug, $sectionKey) {
      $sectionConfig = SectionConfig::forPage($pageSlug)
        ->where('section_key', $sectionKey)
        ->first();

      if (!$sectionConfig) {
        return false;
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
      } ?? false;
    });

    return $data === false ? null : $data;
  }

  /* ==========================================
     | SHARED DATA METHODS
     |========================================== */

  public function getSharedData(string $type): ?SharedData
  {
    $key = "shared.{$type}";
    $result = $this->cache()->remember($key, $this->cacheSeconds, function () use ($type) {
      return SharedData::ofType($type)->active()->first() ?? false;
    });

    return $result === false ? null : $result;
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
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($limit) {
      return Blog::active()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getFeaturedBlogs(?int $limit = null): Collection
  {
    $key = "blogs.featured." . ($limit ?? 'all');
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($limit) {
      return Blog::active()
        ->featured()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getBlog(string $slug): Blog
  {
    return $this->cache()->remember("blog.{$slug}", $this->cacheSeconds, function () use ($slug) {
      return Blog::where('slug', $slug)->active()->firstOrFail();
    });
  }

  public function getRelatedBlogs(int $blogId, array $tags = [], int $limit = 3): Collection
  {
    $key = "blogs.related.{$blogId}." . md5(implode(',', $tags) . $limit);
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($blogId, $tags, $limit) {
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
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($limit) {
      return Program::active()
        ->ordered()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getFeaturedPrograms(?int $limit = null): Collection
  {
    $key = "programs.featured." . ($limit ?? 'all');
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($limit) {
      return Program::active()
        ->featured()
        ->ordered()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getProgram(string $slug): Program
  {
    return $this->cache()->remember("program.{$slug}", $this->cacheSeconds, function () use ($slug) {
      return Program::where('slug', $slug)->active()->firstOrFail();
    });
  }

  /* ==========================================
     | ABOUT CONTENT METHODS
     |========================================== */

  public function getAboutContent(string $slug): AboutContent
  {
    return $this->cache()->remember("about.{$slug}", $this->cacheSeconds, function () use ($slug) {
      return AboutContent::where('slug', $slug)->active()->firstOrFail();
    });
  }

  public function getMainAboutContent(): ?AboutContent
  {
    return $this->cache()->remember('about.main', $this->cacheSeconds, function () {
      return AboutContent::main()->active()->first();
    });
  }

  public function getAboutDetails(): Collection
  {
    return $this->cache()->remember('about.details', $this->cacheSeconds, function () {
      return AboutContent::detail()->active()->ordered()->get();
    });
  }

  /* ==========================================
     | PUBLICATION METHODS
     |========================================== */

  public function getPublications(?int $limit = null): Collection
  {
    $key = "publications.all." . ($limit ?? 'all');
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($limit) {
      return Publication::active()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getFeaturedPublications(?int $limit = null): Collection
  {
    $key = "publications.featured." . ($limit ?? 'all');
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($limit) {
      return Publication::active()
        ->featured()
        ->latest()
        ->when($limit, fn($q) => $q->limit($limit))
        ->get();
    });
  }

  public function getPublication(string $slug): Publication
  {
    return $this->cache()->remember("publication.{$slug}", $this->cacheSeconds, function () use ($slug) {
      return Publication::where('slug', $slug)->active()->firstOrFail();
    });
  }

  public function getRelatedPublications(int $publicationId, array $tags = [], int $limit = 3): Collection
  {
    $key = "publications.related.{$publicationId}." . md5(implode(',', $tags) . $limit);
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($publicationId, $tags, $limit) {
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
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($limit) {
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
    return $this->cache()->remember($key, $this->cacheSeconds, function () use ($pageSlug, $sectionKey) {
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
    $this->cache()->flush();
  }

  public function getPages(): Collection
  {
    return $this->cache()->remember('pages.active', $this->cacheSeconds, function () {
      return Page::where('is_active', true)
        ->orderBy('name')
        ->get();
    });
  }

  public function getJobListing(string $slug): ?JobListing
  {
    $job = $this->cache()->remember("job.{$slug}", $this->cacheSeconds, function () use ($slug) {
      return JobListing::where('slug', $slug)
        ->with(['category', 'locations', 'employer'])
        ->first() ?? false;
    });

    return $job === false ? null : $job;
  }

  private function cache(): \Illuminate\Contracts\Cache\Repository
  {
    return Cache::store('frontend');
  }
}
