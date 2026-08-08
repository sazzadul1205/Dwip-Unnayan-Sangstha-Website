<?php

namespace App\Services;

use App\Models\pages\Page;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Models\pages\Blog;
use App\Models\pages\Program;
use App\Models\pages\Publication;
use App\Models\pages\AboutContent;
use App\Models\JobListing;

class PageMapService
{
  protected ContentService $contentService;

  public function __construct(ContentService $contentService)
  {
    $this->contentService = $contentService;
  }

  /**
   * Get all pages (frontend CMS + backend routes + dynamic content) as a structured map.
   */
  public function getAllPages(): array
  {
    return [
      'frontend' => $this->getFrontendPages(),
      'backend' => $this->getBackendPages(),
      'dynamic_content' => $this->getDynamicContentPages(),
    ];
  }

  /**
   * Get frontend pages from the CMS pages table.
   */
  public function getFrontendPages(): array
  {
    return Page::withTrashed()
      ->get()
      ->map(fn($page) => [
        'id' => $page->id,
        'slug' => $page->slug,
        'name' => $page->name,
        'title' => $page->title,
        'description' => $page->description,
        'url' => '/' . $page->slug,
        'is_active' => (bool) $page->is_active,
        'is_trashed' => $page->trashed(),
        'type' => 'cms_page',
        'component' => $this->getComponentForPage($page->slug),
        'created_at' => $page->created_at?->toISOString(),
        'updated_at' => $page->updated_at?->toISOString(),
      ])
      ->toArray();
  }

  /**
   * Get dynamic content pages (blogs, programs, publications, about, jobs).
   */
  public function getDynamicContentPages(): array
  {
    $pages = [];

    // Blogs
    $blogs = $this->contentService->getBlogs();
    foreach ($blogs as $blog) {
      $pages[] = [
        'id' => $blog->id,
        'slug' => $blog->slug,
        'name' => $blog->title,
        'title' => $blog->title,
        'url' => '/blog/' . $blog->slug,
        'type' => 'blog',
        'parent' => 'blog',
        'is_active' => (bool) $blog->is_active,
        'is_trashed' => $blog->trashed(),
        'image' => $blog->image,
        'author' => $blog->author,
        'date' => $blog->date,
        'created_at' => $blog->created_at?->toISOString(),
        'updated_at' => $blog->updated_at?->toISOString(),
      ];
    }

    // Programs
    $programs = $this->contentService->getPrograms();
    foreach ($programs as $program) {
      $pages[] = [
        'id' => $program->id,
        'slug' => $program->slug,
        'name' => $program->title,
        'title' => $program->title,
        'url' => '/projects-programs/' . $program->slug,
        'type' => 'program',
        'parent' => 'projects-programs',
        'is_active' => (bool) $program->is_active,
        'is_trashed' => $program->trashed(),
        'image' => $program->image,
        'display_order' => $program->display_order,
        'is_featured' => (bool) $program->is_featured,
        'created_at' => $program->created_at?->toISOString(),
        'updated_at' => $program->updated_at?->toISOString(),
      ];
    }

    // Publications
    $publications = $this->contentService->getPublications();
    foreach ($publications as $publication) {
      $pages[] = [
        'id' => $publication->id,
        'slug' => $publication->slug,
        'name' => $publication->title,
        'title' => $publication->title,
        'url' => '/publications/' . $publication->slug,
        'type' => 'publication',
        'parent' => 'publications',
        'is_active' => (bool) $publication->is_active,
        'is_trashed' => $publication->trashed(),
        'image' => $publication->image,
        'pdf_url' => $publication->pdf_url,
        'author' => $publication->author,
        'created_at' => $publication->created_at?->toISOString(),
        'updated_at' => $publication->updated_at?->toISOString(),
      ];
    }

    // About Content (detail pages)
    $aboutDetails = AboutContent::detail()->active()->get();
    foreach ($aboutDetails as $about) {
      $pages[] = [
        'id' => $about->id,
        'slug' => $about->slug,
        'name' => $about->title,
        'title' => $about->title,
        'url' => '/about/' . $about->slug,
        'type' => 'about_detail',
        'parent' => 'about',
        'is_active' => (bool) $about->is_active,
        'is_trashed' => $about->trashed(),
        'image' => $about->image,
        'icon' => $about->icon,
        'bg_color' => $about->bg_color,
        'created_at' => $about->created_at?->toISOString(),
        'updated_at' => $about->updated_at?->toISOString(),
      ];
    }

    // Jobs
    $jobs = JobListing::active()->get();
    foreach ($jobs as $job) {
      $pages[] = [
        'id' => $job->id,
        'slug' => $job->slug,
        'name' => $job->title,
        'title' => $job->title,
        'url' => '/jobs/' . $job->slug,
        'type' => 'job',
        'parent' => 'jobs',
        'is_active' => (bool) $job->is_active,
        'is_trashed' => $job->trashed(),
        'job_type' => $job->job_type,
        'location' => $job->locations?->pluck('name')->first(),
        'deadline' => $job->application_deadline?->toISOString(),
        'created_at' => $job->created_at?->toISOString(),
        'updated_at' => $job->updated_at?->toISOString(),
      ];
    }

    // Sort by type then name
    usort($pages, fn($a, $b) => strcmp($a['type'] . $a['name'], $b['type'] . $b['name']));

    return $pages;
  }

  /**
   * Get backend admin routes dynamically from the route collection.
   */
  public function getBackendPages(): array
  {
    $routes = Route::getRoutes();
    $backendPages = [];

    foreach ($routes as $route) {
      if (!$this->shouldIncludeRoute($route)) {
        continue;
      }

      $name = $route->getName();
      $uri = $route->uri();
      $action = $route->getAction();

      if (!$name || $name === 'generated::') {
        continue;
      }

      if (!str_starts_with($uri, 'backend/') && $uri !== 'dashboard') {
        continue;
      }

      $controller = $action['controller'] ?? null;
      $controllerName = $controller ? Str::afterLast($controller, '\\') : null;

      $backendPages[] = [
        'name' => $name,
        'uri' => '/' . $uri,
        'title' => $this->generateTitle($name, $uri),
        'controller' => $controllerName,
        'method' => $controller ? Str::after($controller, '@') : null,
        'middleware' => $route->middleware() ?? [],
        'is_active' => true,
        'type' => 'backend_route',
      ];
    }

    usort($backendPages, fn($a, $b) => strcmp($a['title'], $b['title']));

    return $backendPages;
  }

  /**
   * Determine the React component for a page based on its slug.
   */
  private function getComponentForPage(string $slug): string
  {
    $componentMap = [
      'home' => 'Frontend/Home/Home',
      'about' => 'Frontend/About/About',
      'blog' => 'Frontend/Blog/Blog',
      'blogs' => 'Frontend/Blog/Blog',
      'projects-programs' => 'Frontend/ProjectsAndPrograms/ProjectsAndPrograms',
      'publications' => 'Frontend/Publications/Publications',
      'jobs' => 'Frontend/Jobs/Jobs',
      'contact' => 'Frontend/Contact/Contact',
      'gallery' => 'Frontend/Gallery/Gallery',
    ];

    return $componentMap[$slug] ?? 'Frontend/DynamicPage';
  }

  /**
   * Determine if a route should be included in the backend map.
   */
  private function shouldIncludeRoute($route): bool
  {
    if (!in_array('GET', $route->methods())) {
      return false;
    }

    if (str_starts_with($route->uri(), 'api/')) {
      return false;
    }

    if ($route->uri() === '{fallbackPlaceholder}') {
      return false;
    }

    if (str_starts_with($route->uri(), 'storage/')) {
      return false;
    }

    if (str_starts_with($route->uri(), '_')) {
      return false;
    }

    return true;
  }

  /**
   * Generate a readable title from route name or URI.
   */
  private function generateTitle(string $routeName, string $uri): string
  {
    $name = str_replace(['backend.', 'admin.', 'cms.', 'listing.', 'applications.'], '', $routeName);

    if (str_contains($name, '.')) {
      $parts = explode('.', $name);
      $name = end($parts);
    }

    if (empty($name)) {
      $name = Str::afterLast($uri, '/');
    }

    $name = str_replace(['-', '_'], ' ', $name);
    return ucwords($name);
  }

  /**
   * Get a structured menu for the admin sidebar.
   */
  public function getAdminMenu(): array
  {
    $pages = $this->getBackendPages();

    $menu = [];
    foreach ($pages as $page) {
      $uri = $page['uri'];
      $segments = explode('/', trim($uri, '/'));
      $module = $segments[0] ?? 'other';

      if ($module === 'dashboard') {
        $menu['Dashboard'][] = $page;
        continue;
      }

      $moduleDisplay = ucwords(str_replace(['-', '_'], ' ', $module));
      $menu[$moduleDisplay][] = $page;
    }

    $sorted = [];
    if (isset($menu['Dashboard'])) {
      $sorted['Dashboard'] = $menu['Dashboard'];
      unset($menu['Dashboard']);
    }
    ksort($menu);
    $sorted = array_merge($sorted, $menu);

    return $sorted;
  }

  /**
   * Get all public URLs for sitemap generation.
   */
  public function getPublicUrls(): array
  {
    $urls = [];

    // CMS pages
    foreach ($this->getFrontendPages() as $page) {
      if ($page['is_active'] && !$page['is_trashed']) {
        $urls[] = $page['url'];
      }
    }

    // Dynamic content
    foreach ($this->getDynamicContentPages() as $page) {
      if ($page['is_active'] && !$page['is_trashed']) {
        $urls[] = $page['url'];
      }
    }

    return array_unique($urls);
  }

  /**
   * Get page tree structure for frontend navigation.
   */
  public function getNavigationTree(): array
  {
    $tree = [];

    // Main CMS pages
    $mainPages = Page::where('is_active', true)
      ->where('slug', 'not like', '%-details')
      ->orderBy('name')
      ->get();

    foreach ($mainPages as $page) {
      $node = [
        'id' => $page->id,
        'slug' => $page->slug,
        'name' => $page->name,
        'url' => '/' . $page->slug,
        'type' => 'page',
        'children' => [],
      ];

      // Add detail pages for this parent
      if ($page->slug === 'about') {
        $details = AboutContent::where('is_active', true)
          ->orderBy('display_order')
          ->get();
        foreach ($details as $detail) {
          $node['children'][] = [
            'id' => $detail->id,
            'slug' => $detail->slug,
            'name' => $detail->title,
            'url' => '/about/' . $detail->slug,
            'type' => 'about_detail',
          ];
        }
      }

      if ($page->slug === 'blog' || $page->slug === 'blogs') {
        $blogs = Blog::where('is_active', true)
          ->latest()
          ->limit(5)
          ->get();
        foreach ($blogs as $blog) {
          $node['children'][] = [
            'id' => $blog->id,
            'slug' => $blog->slug,
            'name' => $blog->title,
            'url' => '/blog/' . $blog->slug,
            'type' => 'blog',
          ];
        }
      }

      if ($page->slug === 'projects-programs') {
        $programs = Program::where('is_active', true)
          ->ordered()
          ->get();
        foreach ($programs as $program) {
          $node['children'][] = [
            'id' => $program->id,
            'slug' => $program->slug,
            'name' => $program->title,
            'url' => '/projects-programs/' . $program->slug,
            'type' => 'program',
          ];
        }
      }

      if ($page->slug === 'publications') {
        $publications = Publication::where('is_active', true)
          ->latest()
          ->get();
        foreach ($publications as $publication) {
          $node['children'][] = [
            'id' => $publication->id,
            'slug' => $publication->slug,
            'name' => $publication->title,
            'url' => '/publications/' . $publication->slug,
            'type' => 'publication',
          ];
        }
      }

      if ($page->slug === 'jobs') {
        $jobs = JobListing::where('is_active', true)
          ->orderBy('views_count', 'desc')
          ->limit(5)
          ->get();
        foreach ($jobs as $job) {
          $node['children'][] = [
            'id' => $job->id,
            'slug' => $job->slug,
            'name' => $job->title,
            'url' => '/jobs/' . $job->slug,
            'type' => 'job',
          ];
        }
      }

      $tree[] = $node;
    }

    return $tree;
  }
}
