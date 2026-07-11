<?php
// app/Http/Controllers/Frontend/PageController.php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\JobListing;
use App\Services\ContentService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class PageController extends Controller
{
  use SharedDataTrait;

  protected ContentService $contentService;

  public function __construct(ContentService $contentService)
  {
    $this->contentService = $contentService;
  }

  /**
   * Handle all public pages dynamically.
   */
  public function show(string $pageSlug = 'home', ?string $detailSlug = null): Response
  {
    $page = $this->getPageBySlug($pageSlug);

    if (!$page) {
      abort(404, 'Page not found');
    }

    $component = $this->resolveComponent($pageSlug, $detailSlug);
    $configSlug = $this->resolveConfigSlug($pageSlug, $detailSlug);

    $sectionConfigs = $this->contentService->getPageSections($configSlug);

    if ($sectionConfigs->isEmpty()) {
      abort(404, 'Page configuration not found');
    }

    $dataNeeds = $this->determineDataNeeds($sectionConfigs);
    $fetchedData = $this->fetchAllData($dataNeeds, $pageSlug, $detailSlug);

    $pageData = $this->buildPageData($sectionConfigs, $fetchedData, $pageSlug, $detailSlug);
    $shared = $this->getSharedData();

    $sectionConfig = [
      'sections' => $sectionConfigs->map(function ($config) {
        return [
          'id'                 => $config->id,
          'component'          => $config->component,
          'enabled'            => (bool) $config->is_enabled,
          'propName'           => $config->prop_name,
          'dataKey'            => $config->data_key,
          'order'              => $config->display_order,
          'customProps'        => $config->custom_props ?? [],
          'isFixedSection'     => (bool) $config->is_fixed_section,
          'isSpecialComponent' => (bool) $config->is_special_component,
        ];
      })->toArray(),
    ];

    $pageTitle = $page->title ?? $page->name;

    if ($detailSlug && $page->title) {
      $pageTitle = $page->title . ' - DUS';
    }

    $props = array_merge(
      $shared,
      [
        'storageUrl'    => config('app.storage_url', ''),
        'sectionConfig' => $sectionConfig,
        'pageData'      => $pageData,
        'pageName'      => $page->name,
        'pageTitle'     => $pageTitle,
        'pageSlug'      => $page->slug,
        'pageDescription' => $page->description ?? '',
      ]
    );

    return Inertia::render($component, $props);
  }

  /**
   * Get page by slug from database
   */
  private function getPageBySlug(string $slug): ?\App\Models\pages\Page
  {
    // Normalize slug for special cases
    if ($slug === 'blogs') {
      $slug = 'blog';
    }

    return \App\Models\pages\Page::where('slug', $slug)
      ->where('is_active', true)
      ->first();
  }

  /**
   * Normalize route slugs to the seeded page slugs used by the CMS.
   */
  private function resolveConfigSlug(string $pageSlug, ?string $detailSlug): string
  {
    $normalized = $pageSlug === 'blogs' ? 'blog' : $pageSlug;

    if ($detailSlug) {
      return $normalized . '-details';
    }

    return $normalized;
  }

  /**
   * Map page slug + detail flag to the correct Inertia component.
   */
  private function resolveComponent(string $pageSlug, ?string $detailSlug): string
  {
    $normalizedPageSlug = $pageSlug === 'blogs' ? 'blog' : $pageSlug;

    $specificPages = [
      'home' => 'Frontend/Home/Home',
      'about' => 'Frontend/About/About',
      'contact' => 'Frontend/ContactUs/ContactUs',
    ];

    $detailPages = [
      'about' => 'Frontend/AboutDetails/AboutDetails',
      'blog' => 'Frontend/BlogDetails/BlogDetails',
      'projects-programs' => 'Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails',
      'publications' => 'Frontend/PublicationDetails/PublicationDetails',
      'jobs' => 'Frontend/JobsDetails/JobsDetails',
    ];

    if ($detailSlug) {
      return $detailPages[$normalizedPageSlug] ?? 'Frontend/GenericPage';
    }

    return $specificPages[$normalizedPageSlug] ?? 'Frontend/GenericPage';
  }

  /**
   * Analyze section configs to determine what data we need.
   */
  private function determineDataNeeds(Collection $sectionConfigs): array
  {
    $needs = ['shared_data' => []];

    foreach ($sectionConfigs as $config) {
      switch ($config->data_table) {
        case 'shared_data':
          $type = $this->mapDataKeyToSharedType($config->data_key);
          if ($type) {
            $needs['shared_data'][] = $type;
          }
          break;
        case 'programs':
          $needs['programs'] = true;
          break;
        case 'blog':
        case 'blogs':
          $needs['blogs'] = true;
          break;
        case 'about_content':
          $needs['about_content'] = true;
          break;
        case 'jobs':
          $needs['jobs'] = true;
          break;
        case 'job_details':
          $needs['job_details'] = true;
          break;
        case 'publications':
          $needs['publications'] = true;
          break;
        case 'custom_section_data':
          $needs['custom'][] = $config->section_key;
          break;
        case 'pages':
          $needs['pages'] = true;
          break;
        default:
          Log::warning("Unknown data_table: {$config->data_table} for section {$config->id}");
          break;
      }
    }
    return $needs;
  }

  /**
   * Map data_key to SharedData type
   */
  private function mapDataKeyToSharedType(string $dataKey): ?string
  {
    $map = [
      'bannerData' => 'banner',
      'faqData' => 'faq',
      'upcomingEventsData' => 'upcoming-events',
      'topbarData' => 'topbar',
      'navbarData' => 'navbar',
      'footerData' => 'footer',
      'publicationsData' => 'publications',
      'storiesData' => 'stories',
    ];

    return $map[$dataKey] ?? null;
  }

  /**
   * Fetch all required data from the database using the ContentService.
   */
  private function fetchAllData(array $needs, string $pageSlug, ?string $detailSlug): array
  {
    $data = [];

    // Shared data
    if (!empty($needs['shared_data'])) {
      foreach ($needs['shared_data'] as $type) {
        $sharedItem = $this->contentService->getSharedData($type);
        if ($sharedItem) {
          $data['shared'][$type] = $sharedItem->data;
        }
      }
    }

    // Programs
    if (!empty($needs['programs'])) {
      $data['programs'] = $this->contentService->getPrograms();
    }

    // Blogs
    if (!empty($needs['blogs'])) {
      $data['blogs'] = $this->contentService->getBlogs();
    }

    // About content
    if (!empty($needs['about_content'])) {
      $data['about_content'] = $this->contentService->getAboutDetails();
    }

    // Jobs
    if (!empty($needs['jobs'])) {
      $data['jobs'] = JobListing::active()
        ->orderBy('views_count', 'desc')
        ->limit(5)
        ->get();
    }

    // Job details (for detail pages)
    if (!empty($needs['job_details']) && $detailSlug) {
      $data['job_details'] = JobListing::where('slug', $detailSlug)
        ->with(['category', 'locations', 'employer'])
        ->first();
    }

    // Publications
    if (!empty($needs['publications'])) {
      $data['publications'] = $this->contentService->getPublications();
    }

    // Pages
    if (!empty($needs['pages'])) {
      $data['pages'] = \App\Models\pages\Page::where('is_active', true)
        ->orderBy('name')
        ->get();
    }

    // Custom section data
    if (!empty($needs['custom'])) {
      foreach ($needs['custom'] as $sectionKey) {
        $customData = $this->contentService->getSectionData($pageSlug, $sectionKey);
        if ($customData) {
          if (method_exists($customData, 'getDataAttribute')) {
            $data['custom'][$sectionKey] = $customData->data;
          } else {
            $data['custom'][$sectionKey] = $customData;
          }
        }
      }
    }

    // Detail item
    if ($detailSlug) {
      $baseSlug = $pageSlug;
      if ($pageSlug === 'blogs') {
        $baseSlug = 'blog';
      }

      switch ($baseSlug) {
        case 'about':
          $detail = $this->contentService->getAboutContent($detailSlug);
          break;
        case 'blog':
          $detail = $this->contentService->getBlog($detailSlug);
          break;
        case 'projects-programs':
          $detail = $this->contentService->getProgram($detailSlug);
          break;
        case 'publications':
          $detail = $this->contentService->getPublication($detailSlug);
          break;
        default:
          $detail = $this->contentService->getSectionData($pageSlug, $detailSlug);
          break;
      }
      $data['detail'] = $detail;
    }

    return $data;
  }

  /**
   * Build the pageData array with keys expected by frontend components.
   */
  private function buildPageData(Collection $sectionConfigs, array $fetchedData, string $pageSlug, ?string $detailSlug): array
  {
    $pageData = [];

    foreach ($sectionConfigs as $config) {
      $dataTable = $config->data_table;
      $dataKey   = $config->data_key;

      switch ($dataTable) {
        case 'shared_data':
          $type = $this->mapDataKeyToSharedType($dataKey);
          if ($type && isset($fetchedData['shared'][$type])) {
            $pageData[$dataKey] = $fetchedData['shared'][$type];
          }
          break;
        case 'programs':
          if (isset($fetchedData['programs'])) {
            $pageData[$dataKey] = $fetchedData['programs'];
          }
          break;
        case 'blog':
        case 'blogs':
          if (isset($fetchedData['blogs'])) {
            if ($detailSlug && $pageSlug === 'blogs' && $dataKey === 'relatedBlogsData') {
              $pageData[$dataKey] = $this->filterRelatedBlogs($fetchedData['blogs'], $fetchedData['detail'] ?? null);
            } else {
              $pageData[$dataKey] = $fetchedData['blogs'];
            }
          }
          break;
        case 'about_content':
          if (isset($fetchedData['about_content'])) {
            $pageData[$dataKey] = $fetchedData['about_content'];
          }
          break;
        case 'jobs':
          if (isset($fetchedData['jobs'])) {
            $pageData[$dataKey] = $fetchedData['jobs'];
          }
          break;
        case 'job_details':
          if (isset($fetchedData['job_details'])) {
            $pageData[$dataKey] = $fetchedData['job_details'];
          }
          break;
        case 'publications':
          if (isset($fetchedData['publications'])) {
            if ($detailSlug && $pageSlug === 'publications' && $dataKey === 'relatedPublicationsData') {
              $pageData[$dataKey] = $this->filterRelatedPublications($fetchedData['publications'], $fetchedData['detail'] ?? null);
            } else {
              $pageData[$dataKey] = $fetchedData['publications'];
            }
          }
          break;
        case 'pages':
          if (isset($fetchedData['pages'])) {
            $pageData[$dataKey] = $fetchedData['pages'];
          }
          break;
        case 'custom_section_data':
          $sectionKey = $config->section_key;
          if (isset($fetchedData['custom'][$sectionKey])) {
            $pageData[$dataKey] = $fetchedData['custom'][$sectionKey];
          }
          break;
        default:
          if (isset($fetchedData[$dataTable])) {
            $pageData[$dataKey] = $fetchedData[$dataTable];
          }
          break;
      }
    }

    // Detail page handling
    if ($detailSlug && isset($fetchedData['detail'])) {
      $detail = $fetchedData['detail'];
      $baseSlug = $pageSlug;
      if ($pageSlug === 'blogs') {
        $baseSlug = 'blog';
      }

      switch ($baseSlug) {
        case 'about':
          $pageData['contentSectionData'] = $detail;
          break;
        case 'blog':
          $pageData['blogData'] = $this->normalizeBlogDetail($detail);
          break;
        case 'projects-programs':
          $pageData['programContentData'] = $detail;
          break;
        case 'publications':
          $pageData['publicationData'] = $this->normalizePublicationDetail($detail);
          break;
        case 'jobs':
          // If job_details was already set, use it; otherwise set from detail
          if (!isset($pageData['jobData']) && !isset($pageData['job_details'])) {
            $pageData['jobData'] = $this->normalizeJobDetail($detail);
          }
          break;
        default:
          $pageData['detailData'] = $detail;
          break;
      }
    }

    return $pageData;
  }

  /**
   * Filter related blogs for the detail page.
   */
  private function filterRelatedBlogs(Collection|array $blogs, Model|array|null $currentBlog = null): array
  {
    $items = collect($blogs);

    if ($items->isEmpty()) {
      return [];
    }

    $currentId = $currentBlog->id ?? $currentBlog['id'] ?? null;
    $currentSlug = $currentBlog->slug ?? $currentBlog['slug'] ?? null;

    return $items
      ->filter(function ($blog) use ($currentId, $currentSlug) {
        $blogId = $blog->id ?? $blog['id'] ?? null;
        $blogSlug = $blog->slug ?? $blog['slug'] ?? null;
        $isFeatured = $blog->is_featured ?? $blog['is_featured'] ?? false;

        if ($blogId !== null && $currentId !== null && $blogId === $currentId) {
          return false;
        }

        if ($blogSlug !== null && $currentSlug !== null && $blogSlug === $currentSlug) {
          return false;
        }

        return !($isFeatured === true || $isFeatured === 1);
      })
      ->values()
      ->take(3)
      ->all();
  }

  /**
   * Filter related publications for the detail page.
   */
  private function filterRelatedPublications(Collection|array $publications, Model|array|null $currentPublication = null): array
  {
    $items = collect($publications);

    if ($items->isEmpty()) {
      return [];
    }

    $currentId = $currentPublication->id ?? $currentPublication['id'] ?? null;
    $currentSlug = $currentPublication->slug ?? $currentPublication['slug'] ?? null;

    return $items
      ->filter(function ($publication) use ($currentId, $currentSlug) {
        $pubId = $publication->id ?? $publication['id'] ?? null;
        $pubSlug = $publication->slug ?? $publication['slug'] ?? null;
        $isFeatured = $publication->is_featured ?? $publication['is_featured'] ?? false;

        if ($pubId !== null && $currentId !== null && $pubId === $currentId) {
          return false;
        }

        if ($pubSlug !== null && $currentSlug !== null && $pubSlug === $currentSlug) {
          return false;
        }

        return !($isFeatured === true || $isFeatured === 1);
      })
      ->values()
      ->take(3)
      ->all();
  }

  /**
   * Normalize blog detail data to the shape expected by the frontend.
   */
  private function normalizeBlogDetail(Model|array $detail): array
  {
    if ($detail instanceof Model) {
      return [
        'id' => $detail->id,
        'slug' => $detail->slug,
        'title' => $detail->title,
        'excerpt' => $detail->excerpt,
        'fullContent' => $detail->full_content,
        'image' => $detail->image,
        'date' => $detail->date,
        'createdBy' => $detail->author,
        'timerRead' => $detail->read_time,
        'tags' => $detail->tags ?? [],
        'isFeatured' => (bool) ($detail->is_featured ?? false),
        'isActive' => (bool) ($detail->is_active ?? false),
      ];
    }

    return $detail;
  }

  /**
   * Normalize publication detail data to the shape expected by the frontend.
   */
  private function normalizePublicationDetail(Model|array $detail): array
  {
    if ($detail instanceof Model) {
      return [
        'id' => $detail->id,
        'slug' => $detail->slug,
        'title' => $detail->title,
        'excerpt' => $detail->excerpt,
        'fullContent' => $detail->full_content,
        'image' => $detail->image,
        'pdf_url' => $detail->pdf_url,
        'date' => $detail->date,
        'author' => $detail->author,
        'read_time' => $detail->read_time,
        'tags' => $detail->tags ?? [],
        'category' => $detail->category,
        'views' => $detail->views ?? 0,
        'isFeatured' => (bool) ($detail->is_featured ?? false),
        'isActive' => (bool) ($detail->is_active ?? false),
      ];
    }

    return $detail;
  }

  /**
   * Normalize job detail data to the shape expected by the frontend.
   */
  private function normalizeJobDetail(Model|array $detail): array
  {
    if ($detail instanceof Model) {
      return [
        'id' => $detail->id,
        'slug' => $detail->slug,
        'title' => $detail->title,
        'description' => $detail->description,
        'requirements' => $detail->requirements,
        'responsibilities' => $detail->responsibilities,
        'benefits' => $detail->benefits,
        'skills' => $detail->skills,
        'salary_range' => $detail->salary_range,
        'job_type' => $detail->job_type,
        'job_type_label' => $detail->job_type_label,
        'experience_level' => $detail->experience_level,
        'experience_level_label' => $detail->experience_level_label,
        'application_deadline' => $detail->application_deadline,
        'how_to_apply' => $detail->how_to_apply,
        'apply_link' => $detail->apply_link,
        'is_remote' => $detail->is_remote,
        'education_requirement' => $detail->education_requirement,
        'views_count' => $detail->views_count,
        'is_active' => $detail->is_active,
        'image' => $detail->image,
        'employer' => $detail->employer?->name,
        'category' => $detail->category?->name,
        'locations' => $detail->locations?->map(function ($location) {
          return ['name' => $location->name];
        }) ?? [],
        'isExpired' => $detail->isExpired ? $detail->isExpired() : false,
      ];
    }

    return $detail;
  }
}
