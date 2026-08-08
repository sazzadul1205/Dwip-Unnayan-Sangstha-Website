<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Publication;
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

class PublicationController extends Controller
{
  /**
   * Max file sizes in bytes.
   */
  protected int $maxImageSize = 5 * 1024 * 1024;  // 5MB
  protected int $maxPdfSize = 20 * 1024 * 1024;   // 20MB

  /**
   * Display publications – with caching.
   */
  public function index(): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view publications.');
    }

    try {
      $items = Publication::withTrashed()->orderBy('created_at', 'desc')->get();
      return Inertia::render('Backend/CMS/Publications/Index', ['items' => $items]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch publications: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/Publications/Index', [
        'items' => [],
        'flash' => ['error' => 'Failed to load publications. Please try again.'],
      ]);
    }
  }

  /**
   * Store a new publication – with rate limiting.
   */
  public function store(Request $request): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.create')) {
      return redirect()->back()->with('error', 'You do not have permission to create publications.');
    }

    $this->checkRateLimit('publication_create', $user->id);

    try {
      $validated = $request->validate([
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:publications,slug',
        'excerpt' => 'nullable|string',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'pdf_url' => 'nullable|string',
        'date' => 'nullable|string|max:255',
        'author' => 'nullable|string|max:255',
        'read_time' => 'nullable|string|max:255',
        'tags' => 'nullable|array',
        'tags.*' => 'string|max:50',
        'category' => 'nullable|string|max:255',
        'views' => 'nullable|integer|min:0',
        'is_featured' => 'nullable|boolean',
        'is_active' => 'nullable|boolean',
      ]);

      $data = $this->prepareData($validated);

      // Process image if base64
      if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
        $uploadedPath = $this->uploadImage($data['image']);
        $data['image'] = $uploadedPath ?? null;
      }

      // Process PDF if base64
      if (!empty($data['pdf_url']) && $this->isBase64Pdf($data['pdf_url'])) {
        $uploadedPath = $this->uploadPdf($data['pdf_url']);
        $data['pdf_url'] = $uploadedPath ?? null;
      }

      // Generate slug if not provided
      if (empty($data['slug'])) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // Set defaults
      $data['date'] = $data['date'] ?? now()->format('Y-m-d');
      $data['author'] = $data['author'] ?? 'Admin';
      $data['read_time'] = $data['read_time'] ?? '3 minutes';
      $data['views'] = (int) ($data['views'] ?? 0);
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      // Normalize tags
      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      $publication = Publication::create($data);

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('publication_create', $user->id));

      SimpleLogger::cms(
        "Publication created: {$publication->title}",
        [
          'publication_id' => $publication->id,
          'title' => $publication->title,
          'slug' => $publication->slug,
          'is_active' => $publication->is_active,
          'is_featured' => $publication->is_featured,
          'created_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Publication created successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('Publication creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->except(['image', 'pdf_url', 'full_content']),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create publication: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update a publication – with rate limiting.
   */
  public function update(Request $request, int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.update')) {
      return redirect()->back()->with('error', 'You do not have permission to update publications.');
    }

    $this->checkRateLimit('publication_update', $user->id);

    try {
      $publication = Publication::withTrashed()->findOrFail($id);

      $validated = $request->validate([
        'title' => 'required|string|max:255',
        'slug' => 'nullable|string|unique:publications,slug,' . $id,
        'excerpt' => 'nullable|string',
        'full_content' => 'nullable|string',
        'image' => 'nullable|string',
        'pdf_url' => 'nullable|string',
        'date' => 'nullable|string|max:255',
        'author' => 'nullable|string|max:255',
        'read_time' => 'nullable|string|max:255',
        'tags' => 'nullable|array',
        'tags.*' => 'string|max:50',
        'category' => 'nullable|string|max:255',
        'views' => 'nullable|integer|min:0',
        'is_featured' => 'nullable|boolean',
        'is_active' => 'nullable|boolean',
      ]);

      $data = $this->prepareData($validated);

      $oldTitle = $publication->title;
      $oldStatus = $publication->is_active;
      $oldFeatured = $publication->is_featured;

      // Process image if base64
      if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
        if ($publication->image && !filter_var($publication->image, FILTER_VALIDATE_URL)) {
          $this->deleteImageFile($publication->image);
        }
        $uploadedPath = $this->uploadImage($data['image']);
        $data['image'] = $uploadedPath ?? null;
      }

      // Process PDF if base64
      if (!empty($data['pdf_url']) && $this->isBase64Pdf($data['pdf_url'])) {
        if ($publication->pdf_url && !filter_var($publication->pdf_url, FILTER_VALIDATE_URL)) {
          $this->deletePdfFile($publication->pdf_url);
        }
        $uploadedPath = $this->uploadPdf($data['pdf_url']);
        $data['pdf_url'] = $uploadedPath ?? null;
      }

      // Regenerate slug if title changed and slug not manually set
      if (empty($data['slug']) || ($data['title'] !== $publication->title && $data['slug'] === $publication->slug)) {
        $data['slug'] = $this->generateUniqueSlug($data['title'], $id);
      }

      $data['views'] = (int) ($data['views'] ?? $publication->views ?? 0);
      $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      if (isset($data['tags']) && is_array($data['tags'])) {
        $data['tags'] = array_values(array_unique(array_filter($data['tags'])));
      }

      $publication->update($data);

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('publication_update', $user->id));

      // Log changes
      $changes = [];
      if ($oldTitle !== $publication->title) {
        $changes['title'] = ['old' => $oldTitle, 'new' => $publication->title];
      }
      if ($oldStatus !== $publication->is_active) {
        $changes['status'] = ['old' => $oldStatus ? 'active' : 'inactive', 'new' => $publication->is_active ? 'active' : 'inactive'];
      }
      if ($oldFeatured !== $publication->is_featured) {
        $changes['featured'] = ['old' => $oldFeatured ? 'yes' : 'no', 'new' => $publication->is_featured ? 'yes' : 'no'];
      }

      if (!empty($changes)) {
        SimpleLogger::cms(
          "Publication updated: {$publication->title}",
          [
            'publication_id' => $publication->id,
            'changes' => $changes,
            'updated_by' => $user->email,
            'ip' => $request->ip(),
          ]
        );
      }

      session()->forget('_old_input');

      return redirect()->back()->with('success', '✅ Publication updated successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      Log::error('Publication update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'publication_id' => $id,
        'input' => $request->except(['image', 'pdf_url', 'full_content']),
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update publication: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle publication active status – with rate limiting.
   */
  public function toggleStatus(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.update')) {
      return redirect()->back()->with('error', 'You do not have permission to change publication status.');
    }

    $this->checkRateLimit('publication_toggle_status', $user->id);

    try {
      $publication = Publication::findOrFail($id);
      $publication->is_active = !$publication->is_active;
      $publication->save();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('publication_toggle_status', $user->id));

      $status = $publication->is_active ? 'activated' : 'deactivated';

      SimpleLogger::cms(
        "Publication {$status}: {$publication->title}",
        [
          'publication_id' => $id,
          'new_status' => $publication->is_active ? 'active' : 'inactive',
          'updated_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', "✅ Publication {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Publication status toggle failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle publication status.');
    }
  }

  /**
   * Toggle featured status – with rate limiting.
   */
  public function toggleFeatured(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.update')) {
      return redirect()->back()->with('error', 'You do not have permission to change featured status.');
    }

    $this->checkRateLimit('publication_toggle_featured', $user->id);

    try {
      $publication = Publication::findOrFail($id);

      // If making this publication featured, remove featured status from others
      if (!$publication->is_featured) {
        Publication::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
      }

      $publication->is_featured = !$publication->is_featured;
      $publication->save();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('publication_toggle_featured', $user->id));

      $status = $publication->is_featured ? 'featured' : 'unfeatured';

      SimpleLogger::cms(
        "Publication {$status}: {$publication->title}",
        [
          'publication_id' => $id,
          'is_featured' => $publication->is_featured,
          'updated_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', "✅ Publication {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Publication featured toggle failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle featured status.');
    }
  }

  /**
   * Soft delete a publication – with rate limiting.
   */
  public function destroy(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to delete publications.');
    }

    $this->checkRateLimit('publication_delete', $user->id);

    try {
      $publication = Publication::findOrFail($id);
      $publication->delete();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('publication_delete', $user->id));

      SimpleLogger::cms(
        "Publication moved to trash: {$publication->title}",
        [
          'publication_id' => $id,
          'title' => $publication->title,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🗑️ Publication moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('Publication deletion failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete publication.');
    }
  }

  /**
   * Restore a soft-deleted publication – with rate limiting.
   */
  public function restore(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.restore')) {
      return redirect()->back()->with('error', 'You do not have permission to restore publications.');
    }

    $this->checkRateLimit('publication_restore', $user->id);

    try {
      $publication = Publication::withTrashed()->findOrFail($id);
      $publication->restore();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('publication_restore', $user->id));

      SimpleLogger::cms(
        "Publication restored: {$publication->title}",
        [
          'publication_id' => $id,
          'title' => $publication->title,
          'restored_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🔄 Publication restored successfully.');
    } catch (\Exception $e) {
      Log::error('Publication restoration failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore publication.');
    }
  }

  /**
   * Force delete a publication – also deletes files – with rate limiting.
   */
  public function forceDelete(int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('publications.destroy')) {
      return redirect()->back()->with('error', 'You do not have permission to permanently delete publications.');
    }

    $this->checkRateLimit('publication_force_delete', $user->id);

    try {
      $publication = Publication::withTrashed()->findOrFail($id);

      // Delete image
      if ($publication->image && !filter_var($publication->image, FILTER_VALIDATE_URL)) {
        $this->deleteImageFile($publication->image);
      }

      // Delete PDF
      if ($publication->pdf_url && !filter_var($publication->pdf_url, FILTER_VALIDATE_URL)) {
        $this->deletePdfFile($publication->pdf_url);
      }

      // Delete embedded images
      $this->deleteImagesFromContent($publication->full_content);

      $publication->forceDelete();

      $this->clearCache();
      RateLimiter::clear($this->getThrottleKey('publication_force_delete', $user->id));

      SimpleLogger::cms(
        "Publication permanently deleted: {$publication->title}",
        [
          'publication_id' => $id,
          'title' => $publication->title,
          'deleted_by' => $user->email,
          'ip' => request()->ip(),
        ]
      );

      return redirect()->back()->with('success', '🗑️ Publication permanently deleted.');
    } catch (\Exception $e) {
      Log::error('Publication force deletion failed: ' . $e->getMessage(), ['publication_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete publication.');
    }
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  private function getAuthUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

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

  private function getThrottleKey(string $action, int $userId): string
  {
    return "publication_{$action}|{$userId}";
  }

  /**
   * Clear the publication cache.
   */
  private function clearCache(): void
  {
    Cache::forget('cms_publication_list');
    Cache::forget('frontend_publication_list');
    // Clear frontend content service cache
    app(\App\Services\ContentService::class)->clearCache();
  }

  private function prepareData(array $validated): array
  {
    $data = $validated;
    $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);
    return $data;
  }

  private function generateUniqueSlug(string $title, ?int $excludeId = null): string
  {
    $slug = Str::slug($title);
    $originalSlug = $slug;
    $counter = 1;

    while (Publication::withTrashed()
      ->where('slug', $slug)
      ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
      ->exists()
    ) {
      $slug = $originalSlug . '-' . $counter;
      $counter++;
    }

    return $slug;
  }

  private function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
  }

  private function isBase64Pdf(string $string): bool
  {
    return str_starts_with($string, 'data:application/pdf;base64,');
  }

  private function uploadImage(string $base64String): ?string
  {
    try {
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

      if (strlen($imageContent) > $this->maxImageSize) {
        Log::warning('Image too large: ' . strlen($imageContent) . ' bytes');
        return null;
      }

      $extension = $this->getImageExtension($base64String);
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = 'Publications/' . $filename;

      if (!Storage::disk('public')->put($path, $imageContent)) {
        Log::error('Failed to store image: ' . $path);
        return null;
      }

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Image upload failed: ' . $e->getMessage());
      return null;
    }
  }

  private function uploadPdf(string $base64String): ?string
  {
    try {
      if (!str_starts_with($base64String, 'data:application/pdf;base64,')) {
        Log::warning('Invalid base64 PDF format');
        return null;
      }

      $pdfData = explode(',', $base64String);
      if (count($pdfData) < 2) {
        Log::warning('Invalid base64 PDF data');
        return null;
      }

      $pdfContent = base64_decode($pdfData[1]);
      if ($pdfContent === false) {
        Log::warning('Failed to decode base64 PDF');
        return null;
      }

      if (strlen($pdfContent) > $this->maxPdfSize) {
        Log::warning('PDF too large: ' . strlen($pdfContent) . ' bytes');
        return null;
      }

      $filename = Str::uuid() . '.pdf';
      $path = 'Publications/pdfs/' . date('Y/m/d') . '/' . $filename;

      $directory = dirname($path);
      if (!Storage::disk('public')->exists($directory)) {
        Storage::disk('public')->makeDirectory($directory);
      }

      if (!Storage::disk('public')->put($path, $pdfContent)) {
        Log::error('Failed to store PDF: ' . $path);
        return null;
      }

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('PDF upload failed: ' . $e->getMessage());
      return null;
    }
  }

  private function getImageExtension(string $base64String): string
  {
    $mimeMap = [
      'image/jpeg' => 'jpg',
      'image/jpg'  => 'jpg',
      'image/png'  => 'png',
      'image/gif'  => 'gif',
      'image/webp' => 'webp',
      'image/svg+xml' => 'svg',
      'image/svg'  => 'svg',
      'image/bmp'  => 'bmp',
      'image/tiff' => 'tiff',
      'image/x-icon' => 'ico',
      'image/vnd.microsoft.icon' => 'ico',
    ];

    if (preg_match('/^data:([^;]+);base64,/', $base64String, $matches)) {
      return $mimeMap[$matches[1]] ?? 'png';
    }

    return 'png';
  }

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

  private function deletePdfFile(string $pdfPath): void
  {
    try {
      $relativePath = str_replace('/storage/', '', $pdfPath);
      if (Storage::disk('public')->exists($relativePath)) {
        Storage::disk('public')->delete($relativePath);
        Log::info('PDF deleted: ' . $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to delete PDF: ' . $e->getMessage());
    }
  }

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
}
