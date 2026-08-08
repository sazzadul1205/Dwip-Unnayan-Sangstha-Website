<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Services\PageMapService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PageMapController extends Controller
{
  protected PageMapService $pageMapService;

  public function __construct(PageMapService $pageMapService)
  {
    $this->pageMapService = $pageMapService;
  }

  /**
   * Get the authenticated user.
   */
  private function getAuthUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

  /**
   * Display the page map in the admin interface.
   */
  public function index(): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view the page map.');
    }

    $cacheKey = 'page_map_data';
    $pageMap = Cache::remember($cacheKey, 300, function () {
      return [
        'frontend' => $this->pageMapService->getFrontendPages(),
        'dynamic_content' => $this->pageMapService->getDynamicContentPages(),
        'backend' => $this->pageMapService->getBackendPages(),
        'navigation_tree' => $this->pageMapService->getNavigationTree(),
        'admin_menu' => $this->pageMapService->getAdminMenu(),
      ];
    });

    return Inertia::render('Backend/PageMap/Index', [
      'pageMap' => $pageMap,
      'frontendCount' => count($pageMap['frontend']),
      'dynamicCount' => count($pageMap['dynamic_content']),
      'backendCount' => count($pageMap['backend']),
      'totalPages' => count($pageMap['frontend']) + count($pageMap['dynamic_content']) + count($pageMap['backend']),
    ]);
  }

  /**
   * Export page map as JSON.
   */
  public function exportJson(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.view')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $pageMap = $this->pageMapService->getAllPages();

    return response()->json([
      'success' => true,
      'data' => $pageMap,
      'meta' => [
        'frontend_count' => count($pageMap['frontend']),
        'dynamic_count' => count($pageMap['dynamic_content']),
        'backend_count' => count($pageMap['backend']),
        'total' => count($pageMap['frontend']) + count($pageMap['dynamic_content']) + count($pageMap['backend']),
        'generated_at' => now()->toISOString(),
      ],
    ]);
  }

  /**
   * Get admin menu structure for sidebar.
   */
  public function adminMenu(): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.view')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $menu = $this->pageMapService->getAdminMenu();

    return response()->json([
      'success' => true,
      'menu' => $menu,
    ]);
  }

  /**
   * Get navigation tree for frontend.
   */
  public function navigationTree(): JsonResponse
  {
    $tree = Cache::remember('navigation_tree', 300, function () {
      return $this->pageMapService->getNavigationTree();
    });

    return response()->json([
      'success' => true,
      'data' => $tree,
    ]);
  }

  /**
   * Get public URLs for sitemap.
   */
  public function sitemapUrls(): JsonResponse
  {
    $urls = Cache::remember('sitemap_urls', 3600, function () {
      return $this->pageMapService->getPublicUrls();
    });

    return response()->json([
      'success' => true,
      'urls' => $urls,
      'count' => count($urls),
    ]);
  }

  /**
   * Clear page map cache.
   */
  public function clearCache(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('cache.manage')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    Cache::forget('page_map_data');
    Cache::forget('navigation_tree');
    Cache::forget('sitemap_urls');

    return response()->json([
      'success' => true,
      'message' => 'Page map cache cleared successfully.',
    ]);
  }
}
