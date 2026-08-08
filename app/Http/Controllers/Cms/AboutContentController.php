<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\AboutContent;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AboutContentController extends Controller
{
  /**
   * Max image size in bytes (5MB for main images, 2MB for icons).
   */
  protected int $maxImageSize = 5 * 1024 * 1024;
  protected int $maxIconSize = 2 * 1024 * 1024;

  /**
   * Display about content items – with caching.
   */
  public function index(): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view about content.');
    }

    try {
      $items = AboutContent::withTrashed()->orderBy('display_order')->get();
      return Inertia::render('Backend/CMS/About/Index', ['items' => $items]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch about content: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/About/Index', [
        'items' => [],
        'flash' => ['error' => 'Failed to load about content. Please try again.'],
      ]);
    }
  }

  /**
   * Store new about content – with rate limiting.
   */
  public function store(Request $request): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.create')) {
      return redirect()->back()->with('error', 'You do not have permission to create about content.');
    }

    $this->checkRateLimit('about_create', $user->id);

    try {
      $validated = $this->validateAboutContent($request);

      $data = $this->prepareData($validated, $request);

      // Process image uploads
      $this->processImages($data, $request);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      // Set default display order if not provided
      if (!isset($data['display_order']) || $data['display_order'] === '') {
        $data['display_order'] = AboutContent::withTrashed()->max('display_order') + 1;
      }

      // Generate slug if not provided
      if (empty($data['slug'])) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // Cast booleans
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      AboutContent::create($data);

      // Clear cache
      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_create', $user->id));

      SimpleLogger::cms(
        "About content created: {$data['title']}",
        [
          'type' => $data['type'] ?? 'detail',
          'created_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return redirect()->back()->with('success', '✅ About content created successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('About content creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->except(['image', 'icon', 'full_content']),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create about content: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update about content – with rate limiting.
   */
  public function update(Request $request, int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.update')) {
      return redirect()->back()->with('error', 'You do not have permission to update about content.');
    }

    $this->checkRateLimit('about_update', $user->id);

    try {
      $about = AboutContent::withTrashed()->findOrFail($id);

      $validated = $this->validateAboutContent($request, $id);

      $data = $this->prepareData($validated, $request);

      // Process images – delete old ones when replacing
      $this->processImages($data, $request, $about);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      // Cast booleans
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      $about->update($data);

      // Clear cache
      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_update', $user->id));

      SimpleLogger::cms(
        "About content updated: {$data['title']}",
        [
          'about_id' => $id,
          'type' => $data['type'] ?? 'detail',
          'updated_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return redirect()->back()->with('success', '✅ About content updated successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('About content update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'about_id' => $id,
        'input' => $request->except(['image', 'icon', 'full_content']),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update about content: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle active status – with rate limiting.
   */
  public function toggleStatus(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.update')) {
      return redirect()->back()->with('error', 'You do not have permission to change about content status.');
    }

    $this->checkRateLimit('about_toggle', $user->id);

    try {
      $about = AboutContent::findOrFail($id);
      $about->is_active = !$about->is_active;
      $about->save();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_toggle', $user->id));

      $status = $about->is_active ? 'activated' : 'deactivated';

      SimpleLogger::cms(
        "About content {$status}: {$about->title}",
        [
          'about_id' => $id,
          'new_status' => $about->is_active ? 'active' : 'inactive',
          'updated_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', "✅ About content {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('About content status toggle failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle about content status.');
    }
  }

  /**
   * Toggle featured status – with rate limiting.
   */
  public function toggleFeatured(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.update')) {
      return redirect()->back()->with('error', 'You do not have permission to change featured status.');
    }

    $this->checkRateLimit('about_featured', $user->id);

    try {
      $about = AboutContent::findOrFail($id);

      // If making this item featured, remove featured status from others
      if (!$about->is_featured) {
        AboutContent::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
      }

      $about->is_featured = !$about->is_featured;
      $about->save();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_featured', $user->id));

      $status = $about->is_featured ? 'featured' : 'unfeatured';

      SimpleLogger::cms(
        "About content {$status}: {$about->title}",
        [
          'about_id' => $id,
          'is_featured' => $about->is_featured,
          'updated_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', "✅ About content {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('About content featured toggle failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle featured status.');
    }
  }

  /**
   * Update display order (drag & drop) – with rate limiting.
   */
  public function updateOrder(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.update')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('about_order', $user->id);

    try {
      $validated = $request->validate([
        'orders' => 'required|array',
        'orders.*.id' => 'required|integer|exists:about_content,id',
        'orders.*.display_order' => 'required|integer|min:0',
      ]);

      foreach ($validated['orders'] as $order) {
        AboutContent::where('id', $order['id'])->update([
          'display_order' => $order['display_order'],
        ]);
      }

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_order', $user->id));

      SimpleLogger::cms(
        "About content order updated",
        [
          'count' => count($validated['orders']),
          'updated_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return response()->json(['success' => true, 'message' => 'Order updated successfully.']);
    } catch (\Exception $e) {
      Log::error('About content order update failed: ' . $e->getMessage());
      return response()->json(['error' => 'Failed to update order.'], 500);
    }
  }

  /**
   * Soft delete – with rate limiting.
   */
  public function destroy(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to delete about content.');
    }

    $this->checkRateLimit('about_delete', $user->id);

    try {
      $about = AboutContent::findOrFail($id);
      $about->delete();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_delete', $user->id));

      SimpleLogger::cms(
        "About content deleted: {$about->title}",
        [
          'about_id' => $id,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🗑️ About content moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('About content deletion failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete about content.');
    }
  }

  /**
   * Restore soft-deleted – with rate limiting.
   */
  public function restore(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.restore')) {
      return redirect()->back()->with('error', 'You do not have permission to restore about content.');
    }

    $this->checkRateLimit('about_restore', $user->id);

    try {
      $about = AboutContent::withTrashed()->findOrFail($id);
      $about->restore();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_restore', $user->id));

      SimpleLogger::cms(
        "About content restored: {$about->title}",
        [
          'about_id' => $id,
          'restored_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🔄 About content restored successfully.');
    } catch (\Exception $e) {
      Log::error('About content restoration failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore about content.');
    }
  }

  /**
   * Force delete – also deletes embedded images – with rate limiting.
   */
  public function forceDelete(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('about.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to permanently delete about content.');
    }

    $this->checkRateLimit('about_force_delete', $user->id);

    try {
      $about = AboutContent::withTrashed()->findOrFail($id);

      // Delete main image
      if ($about->image && !filter_var($about->image, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($about->image);
      }

      // Delete icon
      if ($about->icon && !filter_var($about->icon, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($about->icon);
      }

      // Delete images embedded in the content
      $this->deleteImagesFromContent($about->full_content);

      $about->forceDelete();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('about_force_delete', $user->id));

      SimpleLogger::cms(
        "About content permanently deleted: {$about->title}",
        [
          'about_id' => $id,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🗑️ About content permanently deleted.');
    } catch (\Exception $e) {
      Log::error('About content force deletion failed: ' . $e->getMessage(), ['about_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete about content.');
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
    return "about_{$action}|{$userId}";
  }

  /**
   * Clear the about content cache.
   */
  private function clearCache(): void
  {
    Cache::forget('about_content_list');
    // Clear frontend content service cache
    app(\App\Services\ContentService::class)->clearCache();
  }

  /**
   * Validate about content data.
   */
  private function validateAboutContent(Request $request, ?int $excludeId = null): array
  {
    $rules = [
      'slug' => 'required|string|unique:about_content,slug,' . ($excludeId ?? 'NULL'),
      'title' => 'required|string|max:255',
      'type' => 'required|string|in:main,detail',
      'content' => 'nullable|string',
      'full_content' => 'nullable|string',
      'image' => 'nullable|string',
      'icon' => 'nullable|string',
      'bg_color' => 'nullable|string|max:255',
      'btn_text' => 'nullable|string|max:255',
      'btn_link' => 'nullable|string|max:255',
      'display_order' => 'nullable|integer|min:0',
      'is_featured' => 'nullable|boolean',
      'tags' => 'nullable|array',
      'is_active' => 'nullable|boolean',
    ];

    return $request->validate($rules);
  }

  /**
   * Prepare data from validated input.
   */
  private function prepareData(array $validated, Request $request): array
  {
    $data = $validated;

    // Ensure boolean values are cast correctly
    $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

    // Ensure tags are stored as JSON
    if (isset($data['tags']) && is_array($data['tags'])) {
      $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
    }

    return $data;
  }

  /**
   * Process image and icon uploads.
   */
  private function processImages(array &$data, Request $request, ?AboutContent $existing = null): void
  {
    // Process main image
    if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
      if ($existing && $existing->image && !filter_var($existing->image, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($existing->image);
      }

      $uploadedPath = $this->uploadImage($data['image']);
      $data['image'] = $uploadedPath ?? null;
    }

    // Process icon
    if (!empty($data['icon']) && $this->isBase64Image($data['icon'])) {
      if ($existing && $existing->icon && !filter_var($existing->icon, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($existing->icon);
      }

      $uploadedPath = $this->uploadImage($data['icon'], 'About/icons');
      $data['icon'] = $uploadedPath ?? null;
    }
  }

  /**
   * Check if string is a base64 image.
   */
  private function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
  }

  /**
   * Upload image and return the path.
   */
  private function uploadImage(string $base64String, string $subPath = 'About'): ?string
  {
    try {
      // Validate base64 format
      if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches)) {
        Log::warning('Invalid base64 image format');
        return null;
      }

      $imageData = explode(',', $base64String);
      if (count($imageData) < 2) {
        Log::warning('Invalid base64 image data');
        return null;
      }

      $imageContent = base64_decode($imageData[1]);
      if ($imageContent === false) {
        Log::warning('Failed to decode base64 image');
        return null;
      }

      // Check file size
      $maxSize = str_contains($subPath, 'icons') ? $this->maxIconSize : $this->maxImageSize;
      if (strlen($imageContent) > $maxSize) {
        Log::warning('Image too large: ' . strlen($imageContent) . ' bytes (max: ' . $maxSize . ')');
        return null;
      }

      $extension = $this->getImageExtension($base64String);
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = $subPath . '/' . $filename;

      $stored = Storage::disk('public')->put($path, $imageContent);

      if (!$stored) {
        Log::error('Failed to store image: ' . $path);
        return null;
      }

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Image upload failed: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Get image extension from base64 string.
   */
  private function getImageExtension(string $base64String): string
  {
    $mimeMap = [
      'image/jpeg' => 'jpg',
      'image/jpg' => 'jpg',
      'image/png' => 'png',
      'image/gif' => 'gif',
      'image/webp' => 'webp',
      'image/svg+xml' => 'svg',
      'image/svg' => 'svg',
      'image/bmp' => 'bmp',
      'image/tiff' => 'tiff',
      'image/x-icon' => 'ico',
      'image/vnd.microsoft.icon' => 'ico',
    ];

    if (preg_match('/^data:([^;]+);base64,/', $base64String, $matches)) {
      return $mimeMap[$matches[1]] ?? 'png';
    }

    return 'png';
  }

  /**
   * Delete image file from storage.
   */
  private function deleteImageFile(string $imagePath): void
  {
    try {
      $relativePath = str_replace('/storage/', '', $imagePath);
      if (Storage::disk('public')->exists($relativePath)) {
        Storage::disk('public')->delete($relativePath);
        Log::info('Image deleted: ' . $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to delete image: ' . $e->getMessage());
    }
  }

  /**
   * Delete images embedded in HTML content (only from editor-images folder).
   */
  private function deleteImagesFromContent(?string $content): void
  {
    if (empty($content)) {
      return;
    }

    preg_match_all('/<img[^>]+src="([^"]+)"/i', $content, $matches);
    if (empty($matches[1])) {
      return;
    }

    foreach ($matches[1] as $src) {
      if (str_starts_with($src, '/storage/editor-images/')) {
        $relativePath = str_replace('/storage/', '', $src);
        try {
          if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
            Log::info('Embedded image deleted: ' . $relativePath);
          }
        } catch (\Exception $e) {
          Log::warning('Failed to delete embedded image: ' . $e->getMessage());
        }
      }
    }
  }

  /**
   * Generate a unique slug.
   */
  private function generateUniqueSlug(string $title, ?int $excludeId = null): string
  {
    $slug = Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (AboutContent::withTrashed()
      ->where('slug', $slug)
      ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
      ->exists()
    ) {
      $slug = $originalSlug . '-' . $counter;
      $counter++;
    }

    return $slug;
  }
}
