<?php
// app/Http/Controllers/Profile/AdminProfileController.php
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

  /**
   * Define all icon types this controller manages.
   * Each type has a filename prefix and allowed extensions.
   */
  protected array $iconTypes = [
    'site_icon' => [
      'prefix' => 'icon',
      'extensions' => ['png', 'ico', 'jpg', 'jpeg', 'svg', 'webp'],
    ],
    'favicon' => [
      'prefix' => 'favicon',
      'extensions' => ['png', 'ico', 'svg'],
    ],
    'preloader' => [
      'prefix' => 'preloader',
      'extensions' => ['png', 'svg', 'gif'],
    ],
    'logo' => [
      'prefix' => 'logo',
      'extensions' => ['png', 'svg', 'jpg', 'jpeg'],
    ],
    'apple_touch' => [
      'prefix' => 'apple-touch-icon',
      'extensions' => ['png'],
    ],
    'og_image' => [
      'prefix' => 'og-image',
      'extensions' => ['png', 'jpg', 'jpeg'],
    ],
    // You can add more as needed
  ];

  public function __construct()
  {
    $this->disk = Storage::disk('public');
  }

  /**
   * Show the admin profile edit form with all icon types.
   */
  public function edit(): Response|JsonResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.edit')) {
      return $this->unauthorizedResponse('You do not have permission to edit admin profile.');
    }

    $primaryRole = $user->roles()->orderBy('level', 'desc')->first();

    // Gather current icons for all types
    $allIcons = [];
    foreach (array_keys($this->iconTypes) as $type) {
      $allIcons[$type] = [
        'current' => $this->getCurrentIconForType($type),
        'available' => $this->getAvailableIconsForType($type),
      ];
    }

    return Inertia::render('Backend/Profile/Admin/Edit', [
      'user' => [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'primary_role' => $primaryRole ? $primaryRole->name : 'Admin',
      ],
      'icons' => $allIcons, // all types with current & available
      // Keep old keys for backward compatibility (will be deprecated)
      'currentIcon' => $this->getCurrentIconForType('site_icon'),
      'availableIcons' => $this->getAvailableIconsForType('site_icon'),
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
   * Update a specific icon type – with rate limiting.
   */
  public function updateIcon(Request $request): JsonResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.edit')) {
      return $this->jsonError('You do not have permission to update the icon.', 403);
    }

    // Validate type
    $type = $request->input('type', 'site_icon');
    if (!isset($this->iconTypes[$type])) {
      return $this->jsonError('Invalid icon type.', 422);
    }
    $typeConfig = $this->iconTypes[$type];
    $prefix = $typeConfig['prefix'];
    $allowedExtensions = $typeConfig['extensions'];

    // Rate limiting: 5 uploads per minute per user (per type? we use global for simplicity)
    $throttleKey = 'icon_upload|' . $user->id;
    if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
      Log::warning('Icon upload rate limit exceeded', ['user_id' => $user->id, 'type' => $type]);
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

      if (!in_array($extension, $allowedExtensions)) {
        return $this->jsonError(
          'Invalid file type. Allowed: ' . implode(', ', $allowedExtensions),
          422
        );
      }

      // Delete old files for this type
      $this->deleteIconsForType($type);

      // Ensure directory exists
      if (!$this->disk->exists($this->iconPath)) {
        $this->disk->makeDirectory($this->iconPath);
      }

      // Store the file with the type's prefix
      $filename = $prefix . '.' . $extension;
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
          'type' => $type,
          'filename' => $filename,
          'extension' => $extension,
          'ip' => $request->ip(),
        ]
      );

      return response()->json([
        'success' => true,
        'message' => ucfirst(str_replace('_', ' ', $type)) . ' icon updated successfully!',
        'data' => [
          'icon' => $this->getIconUrl($filename),
          'type' => $type,
        ],
      ]);
    } catch (\Exception $e) {
      Log::error('Icon update failed: ' . $e->getMessage(), [
        'user_id' => $user->id,
        'type' => $type,
        'trace' => $e->getTraceAsString(),
      ]);
      return $this->jsonError('Failed to update icon: ' . $e->getMessage(), 500);
    }
  }

  /**
   * Reset a specific icon type to default (delete all files for that type).
   */
  public function resetIcon(Request $request): JsonResponse
  {
    $user = $this->getAuthenticatedUser();

    if (!$user->hasPermission('admin_profile.edit')) {
      return $this->jsonError('You do not have permission to reset the icon.', 403);
    }

    $type = $request->input('type', 'site_icon');
    if (!isset($this->iconTypes[$type])) {
      return $this->jsonError('Invalid icon type.', 422);
    }

    try {
      $this->deleteIconsForType($type);

      SimpleLogger::security(
        "Site icon reset to default by {$user->email}",
        [
          'user_id' => $user->id,
          'type' => $type,
          'ip' => $request->ip(),
        ]
      );

      return response()->json([
        'success' => true,
        'message' => ucfirst(str_replace('_', ' ', $type)) . ' icon reset to default successfully!',
      ]);
    } catch (\Exception $e) {
      Log::error('Icon reset failed: ' . $e->getMessage(), [
        'user_id' => $user->id,
        'type' => $type,
      ]);
      return $this->jsonError('Failed to reset icon: ' . $e->getMessage(), 500);
    }
  }

    // ---------- Helper Methods ----------

  /**
   * Get the current icon info for a given type.
   */
  protected function getCurrentIconForType(string $type): ?array
  {
    if (!isset($this->iconTypes[$type])) {
      return null;
    }
    $prefix = $this->iconTypes[$type]['prefix'];
    $allowedExtensions = $this->iconTypes[$type]['extensions'];

    try {
      // Try each allowed extension
      foreach ($allowedExtensions as $ext) {
        $filename = $prefix . '.' . $ext;
        $path = $this->iconPath . '/' . $filename;
        if ($this->disk->exists($path)) {
          return [
            'name' => $filename,
            'url' => $this->getIconUrl($filename),
            'size' => $this->formatBytes($this->disk->size($path)),
            'last_modified' => date('Y-m-d H:i:s', $this->disk->lastModified($path)),
            'extension' => $ext,
            'type' => $type,
          ];
        }
      }
    } catch (\Exception $e) {
      Log::error("Failed to get current icon for type {$type}: " . $e->getMessage());
    }

    return null;
  }

  /**
   * Get all available icon files for a given type (all extensions).
   */
  protected function getAvailableIconsForType(string $type): array
  {
    if (!isset($this->iconTypes[$type])) {
      return [];
    }
    $prefix = $this->iconTypes[$type]['prefix'];
    $allowedExtensions = $this->iconTypes[$type]['extensions'];

    try {
      if (!$this->disk->exists($this->iconPath)) {
        return [];
      }

      $files = $this->disk->files($this->iconPath);
      $icons = [];

      foreach ($files as $file) {
        $name = basename($file);
        // Check if file starts with prefix and has allowed extension
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        if (str_starts_with($name, $prefix . '.') && in_array($ext, $allowedExtensions)) {
          $icons[] = [
            'name' => $name,
            'url' => $this->getIconUrl($name),
            'size' => $this->formatBytes($this->disk->size($file)),
            'extension' => $ext,
            'last_modified' => date('Y-m-d H:i:s', $this->disk->lastModified($file)),
            'type' => $type,
          ];
        }
      }

      return $icons;
    } catch (\Exception $e) {
      Log::error("Failed to get available icons for type {$type}: " . $e->getMessage());
      return [];
    }
  }

  /**
   * Delete all files belonging to a specific icon type.
   */
  protected function deleteIconsForType(string $type): void
  {
    if (!isset($this->iconTypes[$type])) {
      return;
    }
    $prefix = $this->iconTypes[$type]['prefix'];
    $allowedExtensions = $this->iconTypes[$type]['extensions'];

    try {
      foreach ($allowedExtensions as $ext) {
        $filename = $prefix . '.' . $ext;
        $path = $this->iconPath . '/' . $filename;
        if ($this->disk->exists($path)) {
          $this->disk->delete($path);
        }
      }
    } catch (\Exception $e) {
      Log::error("Failed to delete icons for type {$type}: " . $e->getMessage());
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
   * Get URL for an icon file.
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
   * Return an unauthorized JSON response.
   */
  protected function unauthorizedResponse(string $message): JsonResponse
  {
    return response()->json([
      'success' => false,
      'message' => $message,
    ], 403);
  }
}
