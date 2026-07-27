<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Blog;
use App\Models\User;
use App\Services\SimpleLogger;
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

class BlogController extends Controller
{
  /**
   * Max image size in bytes (5MB).
   */
  protected int $maxImageSize = 5 * 1024 * 1024;

  /**
   * Display blogs – with caching for admin list.
   */
  public function index(): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('blogs.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view blogs.');
    }

    try {
      // Cache the list for 5 minutes
      $items = Cache::remember('blog_admin_list', 300, function () {
        return Blog::withTrashed()->orderBy('created_at', 'desc')->get();
      });

      return Inertia::render('Backend/CMS/Blogs/Index', ['items' => $items]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch blogs: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/Blogs/Index', [
        'items' => [],
        'flash' => ['error' => 'Failed to load blogs. Please try again.'],
      ]);
    }
  }

  /**
   * Store a new blog – with rate limiting.
   */
  public function store(Request $request): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('blogs.create')) {
      return redirect()->back()->with('error', 'You do not have permission to create blogs.');
    }

    $this->checkRateLimit('blog_create', $user->id);

    try {
      $validated = $this->validateBlog($request);

      $data = $this->prepareData($validated, $request);

      // Process image if it's a base64 string
      if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
        $uploadedPath = $this->uploadImage($data['image']);
        $data['image'] = $uploadedPath ?? null;
      }

      // Generate slug if not provided
      if (empty($data['slug'])) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // Set defaults if missing
      $data['date'] = $data['date'] ?? now()->format('F j, Y');
      $data['author'] = $data['author'] ?? 'Admin';
      $data['read_time'] = (int) ($data['read_time'] ?? 5);
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      // Ensure tags are stored as JSON
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      $blog = Blog::create($data);

      // Clear cache
      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('blog_create', $user->id));

      SimpleLogger::cms(
        "Blog created: {$blog->title}",
        [
          'blog_id' => $blog->id,
          'title' => $blog->title,
          'slug' => $blog->slug,
          'author' => $blog->author,
          'is_active' => $blog->is_active,
          'is_featured' => $blog->is_featured,
          'created_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Blog created successfully!');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('Blog creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->except(['image', 'full_content']),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create blog: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update a blog – with rate limiting.
   */
  public function update(Request $request, int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('blogs.update')) {
      return redirect()->back()->with('error', 'You do not have permission to update blogs.');
    }

    $this->checkRateLimit('blog_update', $user->id);

    try {
      $blog = Blog::withTrashed()->findOrFail($id);

      $validated = $this->validateBlog($request, $id);

      $data = $this->prepareData($validated, $request);

      // Track changes for logging
      $oldTitle = $blog->title;
      $oldStatus = $blog->is_active;
      $oldFeatured = $blog->is_featured;

      // Process image if it's a base64 string
      if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
        // Delete old image if exists
        if ($blog->image && !filter_var($blog->image, FILTER_VALIDATE_URL)) {
          $this->deleteImageFile($blog->image);
        }

        $uploadedPath = $this->uploadImage($data['image']);
        $data['image'] = $uploadedPath ?? null;
      }

      // Regenerate slug if title changed and slug not manually set
      if (empty($data['slug']) || ($data['title'] !== $blog->title && $data['slug'] === $blog->slug)) {
        $data['slug'] = $this->generateUniqueSlug($data['title'], $id);
      }

      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);
      $data['read_time'] = (int) ($data['read_time'] ?? 5);

      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      $blog->update($data);

      // Clear cache
      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('blog_update', $user->id));

      // Log changes
      $changes = [];
      if ($oldTitle !== $blog->title) {
        $changes['title'] = ['old' => $oldTitle, 'new' => $blog->title];
      }
      if ($oldStatus !== $blog->is_active) {
        $changes['status'] = ['old' => $oldStatus ? 'active' : 'inactive', 'new' => $blog->is_active ? 'active' : 'inactive'];
      }
      if ($oldFeatured !== $blog->is_featured) {
        $changes['featured'] = ['old' => $oldFeatured ? 'yes' : 'no', 'new' => $blog->is_featured ? 'yes' : 'no'];
      }

      if (!empty($changes)) {
        SimpleLogger::cms(
          "Blog updated: {$blog->title}",
          [
            'blog_id' => $blog->id,
            'changes' => $changes,
            'updated_by' => $user->email,
            'ip' => $request->ip(),
          ]
        );
      }

      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Blog updated successfully!');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('Blog update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'blog_id' => $id,
        'input' => $request->except(['image', 'full_content']),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update blog: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle blog active status – with rate limiting.
   */
  public function toggleStatus(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('blogs.update')) {
      return redirect()->back()->with('error', 'You do not have permission to change blog status.');
    }

    $this->checkRateLimit('blog_toggle_status', $user->id);

    try {
      $blog = Blog::findOrFail($id);
      $blog->is_active = !$blog->is_active;
      $blog->save();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('blog_toggle_status', $user->id));

      $status = $blog->is_active ? 'activated' : 'deactivated';

      SimpleLogger::cms(
        "Blog {$status}: {$blog->title}",
        [
          'blog_id' => $id,
          'new_status' => $blog->is_active ? 'active' : 'inactive',
          'updated_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', "✅ Blog {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Blog status toggle failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle blog status.');
    }
  }

  /**
   * Toggle featured status – with rate limiting.
   */
  public function toggleFeatured(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('blogs.update')) {
      return redirect()->back()->with('error', 'You do not have permission to change featured status.');
    }

    $this->checkRateLimit('blog_toggle_featured', $user->id);

    try {
      $blog = Blog::findOrFail($id);

      // If making this blog featured, remove featured status from others
      if (!$blog->is_featured) {
        Blog::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
      }

      $blog->is_featured = !$blog->is_featured;
      $blog->save();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('blog_toggle_featured', $user->id));

      $status = $blog->is_featured ? 'featured' : 'unfeatured';

      SimpleLogger::cms(
        "Blog {$status}: {$blog->title}",
        [
          'blog_id' => $id,
          'is_featured' => $blog->is_featured,
          'updated_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', "✅ Blog {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Blog featured toggle failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle featured status.');
    }
  }

  /**
   * Soft delete a blog – with rate limiting.
   */
  public function destroy(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('blogs.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to delete blogs.');
    }

    $this->checkRateLimit('blog_delete', $user->id);

    try {
      $blog = Blog::findOrFail($id);

      SimpleLogger::cms(
        "Blog moved to trash: {$blog->title}",
        [
          'blog_id' => $blog->id,
          'title' => $blog->title,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      $blog->delete();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('blog_delete', $user->id));

      return redirect()->back()->with('success', '🗑️ Blog moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('Blog deletion failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete blog.');
    }
  }

  /**
   * Restore a soft-deleted blog – with rate limiting.
   */
  public function restore(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('blogs.restore')) {
      return redirect()->back()->with('error', 'You do not have permission to restore blogs.');
    }

    $this->checkRateLimit('blog_restore', $user->id);

    try {
      $blog = Blog::withTrashed()->findOrFail($id);
      $blog->restore();

      $this->clearCache();

      RateLimiter::clear($this->getThrottleKey('blog_restore', $user->id));

      SimpleLogger::cms(
        "Blog restored: {$blog->title}",
        [
          'blog_id' => $blog->id,
          'title' => $blog->title,
          'restored_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🔄 Blog restored successfully.');
    } catch (\Exception $e) {
      Log::error('Blog restoration failed: ' . $e->getMessage(), ['blog_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore blog.');
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
    return "blog_{$action}|{$userId}";
  }

  /**
   * Clear the blog cache.
   */
  private function clearCache(): void
  {
    Cache::forget('blog_admin_list');
    // Also clear frontend cache if you have one
    Cache::forget('frontend_blog_list');
  }

  /**
   * Validate blog data.
   */
  private function validateBlog(Request $request, ?int $excludeId = null): array
  {
    $rules = [
      'title' => 'required|string|max:255',
      'slug' => 'nullable|string|unique:blogs,slug,' . ($excludeId ?? 'NULL'),
      'excerpt' => 'nullable|string|max:500',
      'full_content' => 'nullable|string',
      'image' => 'nullable|string',
      'date' => 'nullable|string|max:255',
      'author' => 'nullable|string|max:255',
      'read_time' => 'nullable|integer|min:1|max:60',
      'tags' => 'nullable|array',
      'tags.*' => 'string|max:50',
      'is_featured' => 'nullable|boolean',
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

    // Cast booleans
    $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

    return $data;
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
  private function uploadImage(string $base64String): ?string
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
      if (strlen($imageContent) > $this->maxImageSize) {
        Log::warning('Image too large: ' . strlen($imageContent) . ' bytes (max: ' . $this->maxImageSize . ')');
        return null;
      }

      $extension = $this->getImageExtension($base64String);
      $filename = date('Ymd_His') . '_' . uniqid() . '.' . $extension;
      $path = 'Blogs/' . $filename;

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
    if (preg_match('/^data:image\/([^;]+);base64,/', $base64String, $matches)) {
      $mime = $matches[1];
      $map = [
        'jpeg' => 'jpg',
        'jpg' => 'jpg',
        'png' => 'png',
        'gif' => 'gif',
        'webp' => 'webp',
        'svg+xml' => 'svg',
        'bmp' => 'bmp',
        'tiff' => 'tiff',
        'x-icon' => 'ico',
        'vnd.microsoft.icon' => 'ico',
      ];
      return $map[$mime] ?? 'png';
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

    while (Blog::withTrashed()
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
