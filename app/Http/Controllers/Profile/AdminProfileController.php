<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminProfileController extends Controller
{
  protected \Illuminate\Contracts\Filesystem\Filesystem $disk;
  protected string $iconPath = 'images';
  protected array $allowedIconExtensions = ['png', 'ico', 'jpg', 'jpeg', 'svg', 'webp'];
  protected array $iconFileNames = ['icon.png', 'icon.ico', 'icon.svg', 'icon.jpg', 'icon.jpeg', 'icon.webp', 'icon.gif'];

  public function __construct()
  {
    $this->disk = Storage::disk('public');
  }

  /**
   * Show the admin profile edit form.
   */
  public function edit(): Response|JsonResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.edit')) {
      return $this->unauthorizedResponse('You do not have permission to edit admin profile.');
    }

    $primaryRole = $user->roles()->orderBy('level', 'desc')->first();

    return Inertia::render('Backend/Profile/Admin/Edit', [
      'user' => [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'primary_role' => $primaryRole ? $primaryRole->name : 'Admin',
      ],
      'currentIcon' => $this->getCurrentIcon(),
      'availableIcons' => $this->getAvailableIcons(),
    ]);
  }

  /**
   * Update the admin's profile information.
   */
  public function update(Request $request): \Illuminate\Http\RedirectResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.update')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to update admin profile.');
    }

    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'email' => [
        'required',
        'email',
        Rule::unique('users')->ignore($user->id),
      ],
    ]);

    $user->update($validated);

    SimpleLogger::security(
      "Admin profile updated: {$user->email}",
      [
        'user_id' => $user->id,
        'email' => $user->email,
        'ip' => $request->ip(),
        'changes' => array_keys($validated),
      ]
    );

    return redirect()->back()->with('success', 'Profile updated successfully.');
  }

  /**
   * Update the admin's password.
   */
  public function updatePassword(Request $request): \Illuminate\Http\RedirectResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.update_password')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to update password.');
    }

    $request->validate([
      'current_password' => ['required', 'current_password'],
      'password' => ['required', 'string', 'min:8', 'confirmed'],
    ]);

    $user->update([
      'password' => Hash::make($request->password),
    ]);

    SimpleLogger::security(
      "Admin password updated: {$user->email}",
      [
        'user_id' => $user->id,
        'email' => $user->email,
        'ip' => $request->ip(),
      ]
    );

    return back()->with('success', 'Password updated successfully.');
  }

  /**
   * Update the site icon – with rate limiting.
   */
  public function updateIcon(Request $request): JsonResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.edit')) {
      return $this->jsonError('You do not have permission to update the icon.', 403);
    }

    // Rate limiting: 5 uploads per minute per user
    $throttleKey = 'icon_upload|' . $user->id;
    if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
      Log::warning('Icon upload rate limit exceeded', ['user_id' => $user->id]);
      return $this->jsonError('Too many upload attempts. Please wait a moment.', 429);
    }

    try {
      $validator = validator($request->all(), [
        'icon' => 'required|file|image|max:2048',
      ]);

      if ($validator->fails()) {
        return $this->jsonError('Validation failed', 422, $validator->errors()->toArray());
      }

      $file = $request->file('icon');
      if (!$file) {
        return $this->jsonError('No file uploaded', 400);
      }

      $extension = strtolower($file->getClientOriginalExtension());

      if (!in_array($extension, $this->allowedIconExtensions)) {
        return $this->jsonError(
          'Invalid file type. Allowed: ' . implode(', ', $this->allowedIconExtensions),
          422
        );
      }

      // Delete old icons
      $this->deleteOldIcons();

      // Ensure directory exists
      if (!$this->disk->exists($this->iconPath)) {
        $this->disk->makeDirectory($this->iconPath);
      }

      // Store the file
      $filename = 'icon.' . $extension;
      $path = $this->disk->putFileAs($this->iconPath, $file, $filename);

      if (!$path) {
        throw new \Exception('Failed to store file');
      }

      // Clear rate limiter on success
      RateLimiter::clear($throttleKey);

      // Ensure storage link exists
      $this->ensureStorageLinkExists();

      SimpleLogger::security(
        "Site icon updated by {$user->email}",
        [
          'user_id' => $user->id,
          'filename' => $filename,
          'extension' => $extension,
          'ip' => $request->ip(),
        ]
      );

      return response()->json([
        'success' => true,
        'message' => 'Icon updated successfully!',
        'data' => [
          'icon' => $this->getIconUrl($filename),
        ],
      ]);
    } catch (\Exception $e) {
      Log::error('Icon update failed: ' . $e->getMessage(), [
        'user_id' => $user->id,
        'trace' => $e->getTraceAsString(),
      ]);
      return $this->jsonError('Failed to update icon: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Reset icon to default.
   */
  public function resetIcon(Request $request): JsonResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.edit')) {
      return $this->jsonError('You do not have permission to reset the icon.', 403);
    }

    try {
      $this->deleteOldIcons();

      SimpleLogger::security(
        "Site icon reset to default by {$user->email}",
        [
          'user_id' => $user->id,
          'ip' => $request->ip(),
        ]
      );

      return response()->json([
        'success' => true,
        'message' => 'Icon reset to default successfully!',
      ]);
    } catch (\Exception $e) {
      Log::error('Icon reset failed: ' . $e->getMessage(), [
        'user_id' => $user->id,
      ]);
      return $this->jsonError('Failed to reset icon: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Get current icon info.
   */
  protected function getCurrentIcon(): ?array
  {
    try {
      foreach ($this->iconFileNames as $file) {
        $path = $this->iconPath . '/' . $file;
        if ($this->disk->exists($path)) {
          return [
            'name' => $file,
            'url' => $this->getIconUrl($file),
            'size' => $this->formatBytes($this->disk->size($path)),
            'last_modified' => date('Y-m-d H:i:s', $this->disk->lastModified($path)),
            'extension' => pathinfo($file, PATHINFO_EXTENSION),
          ];
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to get current icon: ' . $e->getMessage());
    }

    return null;
  }

  /**
   * Get available icons.
   */
  protected function getAvailableIcons(): array
  {
    try {
      if (!$this->disk->exists($this->iconPath)) {
        return [];
      }

      $files = $this->disk->files($this->iconPath);
      $icons = [];

      foreach ($files as $file) {
        $name = basename($file);
        if (str_starts_with($name, 'icon.')) {
          $icons[] = [
            'name' => $name,
            'url' => $this->getIconUrl($name),
            'size' => $this->formatBytes($this->disk->size($file)),
            'extension' => pathinfo($name, PATHINFO_EXTENSION),
            'last_modified' => date('Y-m-d H:i:s', $this->disk->lastModified($file)),
          ];
        }
      }

      return $icons;
    } catch (\Exception $e) {
      Log::error('Failed to get available icons: ' . $e->getMessage());
      return [];
    }
  }

  /**
   * Delete all old icon files.
   */
  protected function deleteOldIcons(): void
  {
    try {
      foreach ($this->iconFileNames as $file) {
        $path = $this->iconPath . '/' . $file;
        if ($this->disk->exists($path)) {
          $this->disk->delete($path);
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to delete old icons: ' . $e->getMessage());
    }
  }

  /**
   * Get the authenticated user.
   */
  protected function getAuthenticatedUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

  /**
   * Format bytes to human-readable string.
   */
  protected function formatBytes(int $bytes): string
  {
    $units = ['B', 'KB', 'MB', 'GB'];
    $i = 0;
    while ($bytes >= 1024 && $i < count($units) - 1) {
      $bytes /= 1024;
      $i++;
    }
    return round($bytes, 2) . ' ' . $units[$i];
  }

  /**
   * Get URL for an icon.
   */
  protected function getIconUrl(string $filename): string
  {
    if (!file_exists(public_path('storage'))) {
      $this->ensureStorageLinkExists();
    }

    return asset('storage/' . $this->iconPath . '/' . $filename);
  }

  /**
   * Ensure the storage symbolic link exists.
   */
  protected function ensureStorageLinkExists(): void
  {
    $linkPath = public_path('storage');
    $targetPath = storage_path('app/public');

    if (!file_exists($linkPath)) {
      try {
        if (function_exists('symlink')) {
          @symlink($targetPath, $linkPath);
          Log::info('Storage symbolic link created successfully');
        }
      } catch (\Exception $e) {
        Log::warning('Could not create storage link: ' . $e->getMessage());
      }
    }
  }

  /**
   * Return a JSON error response.
   */
  protected function jsonError(string $message, int $status = 400, ?array $errors = null): JsonResponse
  {
    $response = [
      'success' => false,
      'message' => $message,
    ];

    if ($errors) {
      $response['errors'] = $errors;
    }

    return response()->json($response, $status);
  }

  /**
   * Return an unauthorized redirect response.
   */
  protected function unauthorizedResponse(string $message): JsonResponse
  {
    return response()->json([
      'success' => false,
      'message' => $message,
    ], 403);
  }
}
