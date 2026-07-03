<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Services\ContentService;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

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
   *
   * @param  string  $pageSlug     (home, about, blogs, contact, projects-programs)
   * @param  string|null  $detailSlug  (optional slug for detail pages)
   */
  public function show(string $pageSlug = 'home', ?string $detailSlug = null): Response
  {
    // 1. Determine which Inertia component to render
    $component = $this->resolveComponent($pageSlug, $detailSlug);

    // 2. Get the page slug used for section configs
    $configSlug = $this->resolveConfigSlug($pageSlug, $detailSlug);

    // 3. Fetch section configs from the database using the service
    $sectionConfigs = $this->contentService->getPageSections($configSlug);

    if ($sectionConfigs->isEmpty()) {
      abort(404, 'Page configuration not found');
    }

    // 4. Determine data requirements from configs
    $dataNeeds = $this->determineDataNeeds($sectionConfigs);

    // 5. Fetch all required data
    $fetchedData = $this->fetchAllData($dataNeeds, $pageSlug, $detailSlug);

    // 6. Build the pageData array with the correct keys
    $pageData = $this->buildPageData($sectionConfigs, $fetchedData, $pageSlug, $detailSlug);

    // 7. Get shared layout data (topbar, navbar, footer) from the trait
    $shared = $this->getSharedData();

    // 8. Prepare the section config structure for the frontend
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

    // 9. Render the Inertia component with all data
    return Inertia::render($component, array_merge(
      $shared,
      [
        'storageUrl'    => config('app.storage_url', ''),
        'sectionConfig' => $sectionConfig,
        'pageData'      => $pageData,
      ]
    ));
  }

  /**
   * Normalize route slugs to the seeded page slugs used by the CMS.
   */
  private function resolveConfigSlug(string $pageSlug, ?string $detailSlug): string
  {
    $normalized = $pageSlug === 'blogs' || $pageSlug === 'blog' ? 'blog' : $pageSlug;

    if ($detailSlug) {
      return $normalized === 'blog' ? 'blog-details' : $normalized . '-details';
    }

    return $normalized;
  }

  /**
   * Map page slug + detail flag to the correct Inertia component.
   */
  private function resolveComponent(string $pageSlug, ?string $detailSlug): string
  {
    $normalizedPageSlug = $pageSlug === 'blog' ? 'blogs' : $pageSlug;

    $pageMap = [
      'home'              => 'Frontend/Home/Home',
      'about'             => 'Frontend/About/About',
      'blogs'             => 'Frontend/Blogs/Blogs',
      'contact'           => 'Frontend/ContactUs/ContactUs',
      'projects-programs' => 'Frontend/ProjectsAndPrograms/ProjectsAndPrograms',
    ];

    $detailMap = [
      'about'             => 'Frontend/AboutDetails/AboutDetails',
      'blogs'             => 'Frontend/BlogDetails/BlogDetails',
      'projects-programs' => 'Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails',
    ];

    if ($detailSlug) {
      return $detailMap[$normalizedPageSlug] ?? abort(404);
    }

    return $pageMap[$normalizedPageSlug] ?? 'Frontend/DynamicPage';
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
        case 'blogs':  // ← Add support for plural
          $needs['blogs'] = true;
          break;
        case 'about_content':
          $needs['about_content'] = true;
          break;
        case 'jobs':
          $needs['jobs'] = true;
          break;
        case 'custom_section_data':
          $needs['custom'][] = $config->section_key;
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
    ];

    return $map[$dataKey] ?? null;
  }

  /**
   * Fetch all required data from the database using the ContentService.
   */
  private function fetchAllData(array $needs, string $pageSlug, ?string $detailSlug): array
  {
    $data = [];

    // Shared data (topbar, navbar, footer, faq, upcoming-events)
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

    // About content (main and detail pages)
    if (!empty($needs['about_content'])) {
      // For about page, we might need all detail items, or just the main one.
      // We'll fetch all active about content; the frontend will filter.
      $data['about_content'] = $this->contentService->getAboutDetails();
    }

    // Jobs
    if (!empty($needs['jobs'])) {
      // We might need a method in ContentService to get jobs
      // For now, we can use the model directly or add a method.
      $data['jobs'] = \App\Models\JobListing::active()
        ->orderBy('views_count', 'desc')
        ->limit(5)
        ->get();
    }

    // Custom section data
    if (!empty($needs['custom'])) {
      foreach ($needs['custom'] as $sectionKey) {
        $customData = $this->contentService->getSectionData($pageSlug, $sectionKey);
        if ($customData) {
          // If it's a model with a 'data' attribute, get it; otherwise assume it's already the data.
          if (method_exists($customData, 'getDataAttribute')) {
            $data['custom'][$sectionKey] = $customData->data;
          } else {
            $data['custom'][$sectionKey] = $customData;
          }
        }
      }
    }

    // Detail item (if detailSlug is provided)
    if ($detailSlug) {
      $detail = null;
      switch ($pageSlug) {
        case 'about':
          $detail = $this->contentService->getAboutContent($detailSlug);
          break;
        case 'blog':
        case 'blogs':
          $detail = $this->contentService->getBlog($detailSlug);
          break;
        case 'projects-programs':
          $detail = $this->contentService->getProgram($detailSlug);
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
        case 'blogs':  // ← Add support for plural
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
        case 'custom_section_data':
          $sectionKey = $config->section_key;
          if (isset($fetchedData['custom'][$sectionKey])) {
            $pageData[$dataKey] = $fetchedData['custom'][$sectionKey];
          }
          break;
      }
    }

    // If it's a detail page, add the detail item with the correct key
    if ($detailSlug && isset($fetchedData['detail'])) {
      $detail = $fetchedData['detail'];
      switch ($pageSlug) {
        case 'about':
          $pageData['contentSectionData'] = $detail;
          break;
        case 'blog':
        case 'blogs':
          $pageData['blogData'] = $this->normalizeBlogDetail($detail);
          break;
        case 'projects-programs':
          $pageData['programContentData'] = $detail;
          break;
      }
    }

    return $pageData;
  }

  /**
   * Filter related blogs for the detail page.
   */
  private function filterRelatedBlogs($blogs, $currentBlog = null): array
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
   * Normalize blog detail data to the shape expected by the frontend.
   */
  private function normalizeBlogDetail($detail): array
  {
    if ($detail instanceof \Illuminate\Database\Eloquent\Model) {
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
}
