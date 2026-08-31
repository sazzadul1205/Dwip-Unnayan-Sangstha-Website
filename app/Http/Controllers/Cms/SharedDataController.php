<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\SharedData;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SharedDataController extends Controller
{
  protected int $maxImageSize = 5 * 1024 * 1024;

  /**
   * Display shared data management page – with caching.
   */
  public function index(): Response|RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('shared_data.view')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view shared data.');
    }

    try {
      $sharedData = Cache::remember('shared_data_list', 300, function () {
        return SharedData::whereIn('type', [
          'topbar',
          'navbar',
          'footer',
          'faq',
          'upcoming-events',
          'stories',
        ])->get();
      });

      return Inertia::render('Backend/CMS/Shared/Index', [
        'sharedData' => $sharedData,
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch shared data: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/Shared/Index', [
        'sharedData' => [],
        'flash' => ['error' => 'Failed to load shared data. Please try again.'],
      ]);
    }
  }

  /**
   * Update shared data – with rate limiting.
   */
  public function update(Request $request, int $id): RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('shared_data.update')) {
      return redirect()->back()->with('error', 'You do not have permission to update shared data.');
    }

    $this->checkRateLimit('shared_data_update', $user->id);

    try {
      $shared = SharedData::findOrFail($id);

      $validated = $request->validate([
        'data' => 'required|array',
        'is_active' => 'nullable|boolean',
      ]);

      DB::beginTransaction();

      // Decode old data
      $oldData = $this->decodeData($shared->data);

      // Process data – handle image uploads
      $processedData = $this->processData($validated['data'], $oldData, $shared->type);

      // Always store as JSON string
      $dataToSave = json_encode($processedData);

      $shared->update([
        'data' => $dataToSave,
        'is_active' => $request->boolean('is_active', true),
      ]);

      // Clear cache for this type and the list
      $this->clearCache($shared->type);

      DB::commit();

      RateLimiter::clear($this->getThrottleKey('shared_data_update', $user->id));

      SimpleLogger::cms(
        "Shared data updated: {$shared->type}",
        [
          'shared_id' => $id,
          'type' => $shared->type,
          'updated_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return redirect()->back()->with('success', ucfirst($shared->type) . ' updated successfully.');
    } catch (ValidationException $e) {
      return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
      DB::rollBack();

      Log::error('Failed to update shared data', [
        'type' => $shared->type ?? 'unknown',
        'id' => $id,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);

      return back()->with('error', 'Failed to update: ' . $e->getMessage())->withInput();
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
    return "shared_{$action}|{$userId}";
  }

  private function clearCache(string $type): void
  {
    Cache::forget('shared.' . $type);
    Cache::forget('shared_data_' . $type);
    Cache::forget('shared_data_list');
    app(\App\Services\ContentService::class)->clearCache();
  }

  private function decodeData(mixed $data): array
  {
    if (is_string($data)) {
      $decoded = json_decode($data, true);
      return is_array($decoded) ? $decoded : [];
    }
    return is_array($data) ? $data : [];
  }

  private function processData(array $newData, array $oldData, string $type): array
  {
    $processed = match ($type) {
      'navbar' => $this->processNavbarData($newData, $oldData),
      'footer' => $this->processFooterData($newData, $oldData),
      'upcoming-events' => $this->processUpcomingEventsData($newData, $oldData),
      'topbar' => $this->processTopbarData($newData, $oldData),
      default => $this->processArrayRecursive($newData, $oldData),
    };

    if ($type === 'footer') {
      $processed = $this->processLinkIcons($newData, $oldData, $processed);
    }

    return $processed;
  }

  /**
   * Process topbar data – no image uploads needed since flags removed
   */
  private function processTopbarData(array $newData, array $oldData): array
  {
    // Process contactInfo (text only)
    if (isset($newData['contactInfo']) && is_array($newData['contactInfo'])) {
      $oldContact = $oldData['contactInfo'] ?? [];
      $newData['contactInfo'] = $this->processArrayRecursive($newData['contactInfo'], $oldContact);
    }

    // Process languages (text only - no flags)
    if (isset($newData['languages']) && is_array($newData['languages'])) {
      $oldLanguages = $oldData['languages'] ?? [];
      foreach ($newData['languages'] as $index => $lang) {
        if (is_array($lang)) {
          $oldLang = $oldLanguages[$index] ?? [];
          $newData['languages'][$index] = $this->processArrayRecursive($lang, $oldLang);
        }
      }
    }

    // Process socialLinks (text only)
    if (isset($newData['socialLinks']) && is_array($newData['socialLinks'])) {
      $oldLinks = $oldData['socialLinks'] ?? [];
      foreach ($newData['socialLinks'] as $index => $link) {
        if (is_array($link)) {
          $oldLink = $oldLinks[$index] ?? [];
          $newData['socialLinks'][$index] = $this->processArrayRecursive($link, $oldLink);
        }
      }
    }

    return $newData;
  }

  private function processNavbarData(array $newData, array $oldData): array
  {
    if (isset($newData['logo']['src']) && $this->isBase64Image($newData['logo']['src'])) {
      if (!empty($oldData['logo']['src'] ?? '')) {
        $this->deleteImage($oldData['logo']['src']);
      }
      $newData['logo']['src'] = $this->uploadLogo($newData['logo']['src'], 'navbar');
    } elseif (isset($newData['logo']['src']) && empty($newData['logo']['src'])) {
      if (!empty($oldData['logo']['src'] ?? '')) {
        $this->deleteImage($oldData['logo']['src']);
      }
    }

    foreach ($newData as $key => $value) {
      if (is_array($value) && $key !== 'logo') {
        $oldValue = $oldData[$key] ?? [];
        $newData[$key] = $this->processArrayRecursive($value, $oldValue);
      }
    }

    return $newData;
  }

  private function processFooterData(array $newData, array $oldData): array
  {
    if (isset($newData['logo']['src']) && $this->isBase64Image($newData['logo']['src'])) {
      if (!empty($oldData['logo']['src'] ?? '')) {
        $this->deleteImage($oldData['logo']['src']);
      }
      $newData['logo']['src'] = $this->uploadLogo($newData['logo']['src'], 'footer');
    } elseif (isset($newData['logo']['src']) && empty($newData['logo']['src'])) {
      if (!empty($oldData['logo']['src'] ?? '')) {
        $this->deleteImage($oldData['logo']['src']);
      }
    }

    foreach ($newData as $key => $value) {
      if (is_array($value) && $key !== 'logo') {
        $oldValue = $oldData[$key] ?? [];
        $newData[$key] = $this->processArrayRecursive($value, $oldValue);
      }
    }

    return $newData;
  }

  private function processLinkIcons(array $newData, array $oldData, array $processed): array
  {
    $iconFields = [
      'quickLinkLinkIcon',
      'OurProgramLinkIcon',
    ];

    foreach ($iconFields as $field) {
      if (isset($newData[$field]) && $this->isBase64Image($newData[$field])) {
        if (!empty($oldData[$field] ?? '') && !$this->isBase64Image($oldData[$field])) {
          $this->deleteImage($oldData[$field]);
        }
        $processed[$field] = $this->uploadLinkIcon($newData[$field]);
      } elseif (isset($newData[$field]) && empty($newData[$field])) {
        if (!empty($oldData[$field] ?? '')) {
          $this->deleteImage($oldData[$field]);
        }
        $processed[$field] = '';
      } elseif (isset($newData[$field])) {
        $processed[$field] = $newData[$field];
      }
    }

    return $processed;
  }

  private function processUpcomingEventsData(array $newData, array $oldData): array
  {
    if (isset($newData['section']) && is_array($newData['section'])) {
      $oldSection = $oldData['section'] ?? [];
      $newData['section'] = $this->processArrayRecursive($newData['section'], $oldSection);
    }

    if (isset($newData['image']) && is_array($newData['image'])) {
      if (isset($newData['image']['src']) && $this->isBase64Image($newData['image']['src'])) {
        if (!empty($oldData['image']['src'] ?? '')) {
          $this->deleteImage($oldData['image']['src']);
        }
        $newData['image']['src'] = $this->uploadEventImage($newData['image']['src'], 'event-cover');
      }
    }

    if (isset($newData['events']) && is_array($newData['events'])) {
      $oldEvents = $oldData['events'] ?? [];

      foreach ($newData['events'] as $index => $event) {
        if (isset($event['image']) && $this->isBase64Image($event['image'])) {
          if (!empty($oldEvents[$index]['image'] ?? '')) {
            $this->deleteImage($oldEvents[$index]['image']);
          }
          $newData['events'][$index]['image'] = $this->uploadEventImage($event['image'], 'event-' . ($index + 1));
        }

        if (is_array($event)) {
          $oldEvent = $oldEvents[$index] ?? [];
          foreach ($event as $key => $value) {
            if ($key !== 'image' && is_array($value)) {
              $newData['events'][$index][$key] = $this->processArrayRecursive(
                $value,
                $oldEvent[$key] ?? []
              );
            }
          }
        }
      }
    }

    return $newData;
  }

  private function uploadLogo(string $base64String, string $type): string
  {
    try {
      $imageContent = $this->decodeBase64Image($base64String);
      $extension = $this->getImageExtension($base64String) ?: 'png';
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = 'images/logos/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Failed to upload logo: ' . $e->getMessage());
      return $base64String;
    }
  }

  private function uploadEventImage(string $base64String, string $prefix = 'event'): string
  {
    try {
      $imageContent = $this->decodeBase64Image($base64String);
      $extension = $this->getImageExtension($base64String) ?: 'jpg';
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = 'UpcomingEvent/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Failed to upload event image: ' . $e->getMessage());
      return $base64String;
    }
  }

  private function uploadLinkIcon(string $base64String): string
  {
    try {
      $imageContent = $this->decodeBase64Image($base64String);
      $extension = $this->getImageExtension($base64String) ?: 'png';
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = 'images/icons/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Failed to upload link icon: ' . $e->getMessage());
      return $base64String;
    }
  }

  private function uploadGenericImage(string $base64String): string
  {
    try {
      $imageContent = $this->decodeBase64Image($base64String);
      $extension = $this->getImageExtension($base64String) ?: 'png';
      $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
      $path = 'uploads/shared/' . $filename;

      Storage::disk('public')->put($path, $imageContent);

      return '/storage/' . $path;
    } catch (\Exception $e) {
      Log::error('Failed to upload generic image: ' . $e->getMessage());
      return $base64String;
    }
  }

  private function processArrayRecursive(array $data, array $oldData): array
  {
    foreach ($data as $key => $value) {
      if (is_array($value)) {
        $oldValue = $oldData[$key] ?? [];
        $data[$key] = $this->processArrayRecursive($value, $oldValue);
      } elseif (is_string($value) && $this->isBase64Image($value)) {
        if (!empty($oldData[$key] ?? '') && !$this->isBase64Image($oldData[$key])) {
          $this->deleteImage($oldData[$key]);
        }
        $data[$key] = $this->uploadGenericImage($value);
      }
    }

    return $data;
  }

  private function decodeBase64Image(string $base64String): string
  {
    $imageData = explode(',', $base64String);
    $encodedData = $imageData[1] ?? $base64String;
    $decoded = base64_decode($encodedData);

    if ($decoded === false) {
      throw new \Exception('Failed to decode base64 image');
    }

    if (strlen($decoded) === 0) {
      throw new \Exception('Decoded image is empty');
    }

    return $decoded;
  }

  private function deleteImage(string $imagePath): bool
  {
    if (empty($imagePath)) {
      return false;
    }

    if (str_starts_with($imagePath, 'http') || $this->isBase64Image($imagePath)) {
      return false;
    }

    $path = str_replace('/storage/', '', $imagePath);
    $path = ltrim($path, '/');

    if (empty($path) || $path === '/' || $path === 'storage') {
      return false;
    }

    try {
      if (Storage::disk('public')->exists($path)) {
        return Storage::disk('public')->delete($path);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to delete image: ' . $e->getMessage(), ['path' => $path]);
    }

    return false;
  }

  private function isBase64Image(string $string): bool
  {
    return str_starts_with($string, 'data:image/');
  }

  private function getImageExtension(string $base64String): ?string
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
}
