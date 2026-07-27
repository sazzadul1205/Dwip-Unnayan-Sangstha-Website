<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Page;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
  /**
   * List of protected page slugs that cannot be deactivated or deleted.
   */
  protected array $protectedSlugs = [
    'home',
    'about',
    'services',
    'contact',
    'blog',
    'programs',
  ];

  /**
   * Check if a page is protected.
   */
  protected function isProtected(Page $page): bool
  {
    // Pages with "-details" suffix are always protected
    if (str_ends_with($page->slug, '-details')) {
      return true;
    }

    return in_array($page->slug, $this->protectedSlugs, true);
  }

  /**
   * Display pages – with caching for admin list.
   */
  public function index(): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view pages.');
    }

    try {
      $items = Cache::remember('cms_page_list', 300, function () {
        return Page::withTrashed()->get();
      });

      return Inertia::render('Backend/CMS/Index', [
        'items' => $items,
        'protectedPages' => $this->protectedSlugs,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch pages: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/Index', [
        'items' => [],
        'protectedPages' => $this->protectedSlugs,
        'flash' => ['error' => 'Failed to load pages. Please try again.'],
      ]);
    }
  }

  /**
   * Store a new page – with rate limiting.
   */
  public function store(Request $request): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.create')) {
      return redirect()->back()->with('error', 'You do not have permission to create pages.');
    }

    $this->checkRateLimit('page_create', $user->id);

    try {
      $validated = $request->validate([
        'slug' => 'required|string|unique:pages,slug',
        'name' => 'required|string|max:255',
        'title' => 'nullable|string|max:255',
        'description' => 'nullable|string',
        'is_active' => 'nullable|boolean',
      ]);

      $data = $validated;
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      $page = Page::create($data);

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('page_create', $user->id));

      SimpleLogger::cms(
        "Page created: {$page->name}",
        [
          'page_id' => $page->id,
          'slug' => $page->slug,
          'is_active' => $page->is_active,
          'created_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return redirect()->back()->with('success', '✅ Page created successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('Page creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->all(),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create page: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update a page – with rate limiting.
   */
  public function update(Request $request, int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.update')) {
      return redirect()->back()->with('error', 'You do not have permission to update pages.');
    }

    $this->checkRateLimit('page_update', $user->id);

    try {
      $page = Page::withTrashed()->findOrFail($id);

      // Prevent deactivating protected pages
      if ($this->isProtected($page) && $request->has('is_active') && !$request->boolean('is_active')) {
        return back()->with('error', 'Cannot deactivate a protected page.');
      }

      $validated = $request->validate([
        'slug' => 'required|string|unique:pages,slug,' . $id,
        'name' => 'required|string|max:255',
        'title' => 'nullable|string|max:255',
        'description' => 'nullable|string',
        'is_active' => 'nullable|boolean',
      ]);

      $data = $validated;
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      $oldName = $page->name;
      $oldStatus = $page->is_active;

      $page->update($data);

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('page_update', $user->id));

      $changes = [];
      if ($oldName !== $page->name) {
        $changes['name'] = ['old' => $oldName, 'new' => $page->name];
      }
      if ($oldStatus !== $page->is_active) {
        $changes['status'] = ['old' => $oldStatus ? 'active' : 'inactive', 'new' => $page->is_active ? 'active' : 'inactive'];
      }

      if (!empty($changes)) {
        SimpleLogger::cms(
          "Page updated: {$page->name}",
          [
            'page_id' => $page->id,
            'changes' => $changes,
            'updated_by' => $user->email,
            'ip' => $request->ip(),
          ]
        );
      }

      return redirect()->back()->with('success', '✅ Page updated successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('Page update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'page_id' => $id,
        'input' => $request->all(),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update page: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle page status – with rate limiting.
   */
  public function toggleStatus(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.update')) {
      return redirect()->back()->with('error', 'You do not have permission to change page status.');
    }

    $this->checkRateLimit('page_toggle_status', $user->id);

    try {
      $page = Page::findOrFail($id);

      if ($this->isProtected($page)) {
        return back()->with('error', 'Cannot deactivate a protected page.');
      }

      $page->is_active = !$page->is_active;
      $page->save();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('page_toggle_status', $user->id));

      $status = $page->is_active ? 'activated' : 'deactivated';

      SimpleLogger::cms(
        "Page {$status}: {$page->name}",
        [
          'page_id' => $id,
          'new_status' => $page->is_active ? 'active' : 'inactive',
          'updated_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', "✅ Page {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Page status toggle failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle page status.');
    }
  }

  /**
   * Soft delete a page – with rate limiting.
   */
  public function destroy(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to delete pages.');
    }

    $this->checkRateLimit('page_delete', $user->id);

    try {
      $page = Page::findOrFail($id);

      if ($this->isProtected($page)) {
        return back()->with('error', 'Cannot delete a protected page.');
      }

      $page->delete();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('page_delete', $user->id));

      SimpleLogger::cms(
        "Page moved to trash: {$page->name}",
        [
          'page_id' => $id,
          'slug' => $page->slug,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🗑️ Page moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('Page deletion failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete page.');
    }
  }

  /**
   * Restore a soft-deleted page – with rate limiting.
   */
  public function restore(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.restore')) {
      return redirect()->back()->with('error', 'You do not have permission to restore pages.');
    }

    $this->checkRateLimit('page_restore', $user->id);

    try {
      $page = Page::withTrashed()->findOrFail($id);
      $page->restore();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('page_restore', $user->id));

      SimpleLogger::cms(
        "Page restored: {$page->name}",
        [
          'page_id' => $id,
          'slug' => $page->slug,
          'restored_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🔄 Page restored successfully.');
    } catch (\Exception $e) {
      Log::error('Page restoration failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore page.');
    }
  }

  /**
   * Force delete a page – with rate limiting.
   */
  public function forceDelete(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('pages.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to permanently delete pages.');
    }

    $this->checkRateLimit('page_force_delete', $user->id);

    try {
      $page = Page::withTrashed()->findOrFail($id);

      if ($this->isProtected($page)) {
        return back()->with('error', 'Cannot delete a protected page.');
      }

      $page->forceDelete();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('page_force_delete', $user->id));

      SimpleLogger::cms(
        "Page permanently deleted: {$page->name}",
        [
          'page_id' => $id,
          'slug' => $page->slug,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🗑️ Page permanently deleted.');
    } catch (\Exception $e) {
      Log::error('Page force deletion failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete page.');
    }
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

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
   * Check rate limit for admin actions.
   */
  private function checkRateLimit(string $action, int $userId, int $maxAttempts = 10, int $decaySeconds = 3600): void
  {
    $key = $this->getThrottleKey($action, $userId);
    if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
      Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
      throw ValidationException::withMessages([
        'rate_limit' => 'Too many attempts. Please wait a moment.',
      ]);
    }
    RateLimiter::hit($key, $decaySeconds);
  }

  /**
   * Get throttle key.
   */
  private function getThrottleKey(string $action, int $userId): string
  {
    return "page_{$action}|{$userId}";
  }

  /**
   * Clear the page cache.
   */
  private function clearCache(): void
  {
    Cache::forget('cms_page_list');
    // Also clear frontend page cache if needed
    Cache::forget('frontend_page_list');
  }
}
