<?php
// app/Http/Controllers/Profile/AdminProfileController.php

namespace App\Http\Controllers\Profile;

// Models
use App\Models\User;

// Controllers
use App\Http\Controllers\Controller;

// Requests
use Illuminate\Http\Request;

// Facades
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

// Validation
use Illuminate\Validation\Rule;

// Inertia
use Inertia\Inertia;

class AdminProfileController extends Controller
{
  /**
   * @var \Illuminate\Contracts\Filesystem\Filesystem
   */
  protected $disk;

  /**
   * @var string
   */
  protected string $iconPath = 'images';

  public function __construct()
  {
    $this->disk = Storage::disk('public');
    $this->iconPath = 'images';
  }

  /**
   * Show the admin profile edit form with icon management.
   */
  public function edit()
  {
    $user = Auth::user();

    if (!$user instanceof User) {
      abort(401);
    }

    // Check permission instead of role
    if (!$user->hasPermission('admin_profile.edit')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to edit admin profile.');
    }

    // Get user's highest role for display
    $primaryRole = $user->roles()->orderBy('level', 'desc')->first();

    // Get current icon info - ADDED
    $currentIcon = $this->getCurrentIcon();
    $availableIcons = $this->getAvailableIcons();

    return Inertia::render('Backend/Profile/Admin/Edit', [
      'user' => [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'primary_role' => $primaryRole ? $primaryRole->name : 'Admin',
      ],
      'currentIcon' => $currentIcon,            // ADDED
      'availableIcons' => $availableIcons,      // ADDED
    ]);
  }

  /**
   * Update the admin's profile information (name, email).
   */
  public function update(Request $request)
  {
    $user = Auth::user();

    if (!$user instanceof User) {
      abort(401);
    }

    // Check permission instead of role
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

    return redirect()->back()->with('success', 'Profile updated successfully.');
  }

  /**
   * Update the admin's password.
   */
  public function updatePassword(Request $request)
  {
    $user = Auth::user();

    if (!$user instanceof User) {
      abort(401);
    }

    // Check permission instead of role
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

    return back()->with('success', 'Password updated successfully.');
  }

  /**
   * Update the site icon.
   */
  public function updateIcon(Request $request)
  {
    $user = Auth::user();

    if (!$user instanceof User) {
      abort(401);
    }

    // Check permission
    if (!$user->hasPermission('admin_profile.edit')) {
      return response()->json([
        'success' => false,
        'message' => 'You do not have permission to update the icon.'
      ], 403);
    }

    try {
      // Validate the request
      $validator = validator($request->all(), [
        'icon' => 'required|file|image|max:2048',
      ]);

      if ($validator->fails()) {
        return response()->json([
          'success' => false,
          'message' => 'Validation failed',
          'errors' => $validator->errors()
        ], 422);
      }

      $file = $request->file('icon');
      if (!$file) {
        return response()->json([
          'success' => false,
          'message' => 'No file uploaded'
        ], 400);
      }

      $extension = strtolower($file->getClientOriginalExtension());

      // Allowed extensions
      $allowed = ['png', 'ico', 'jpg', 'jpeg', 'svg', 'webp'];
      if (!in_array($extension, $allowed)) {
        return response()->json([
          'success' => false,
          'message' => 'Invalid file type. Allowed: ' . implode(', ', $allowed),
        ], 422);
      }

      // Delete old icon files
      $this->deleteOldIcons();

      // Generate new filename
      $filename = 'icon.' . $extension;

      // Ensure directories exist
      if (!$this->disk->exists($this->iconPath)) {
        $this->disk->makeDirectory($this->iconPath);
      }

      // Store the file
      $path = $this->disk->putFileAs($this->iconPath, $file, $filename);

      if (!$path) {
        throw new \Exception('Failed to store file');
      }

      // If it's a raster image, try to create additional formats
      if (!in_array($extension, ['svg', 'ico'])) {
        try {
          // Create PNG version
          $pngPath = $this->iconPath . '/icon.png';
          $this->disk->put($pngPath, file_get_contents($file->getPathname()));
        } catch (\Exception $e) {
          Log::warning('Failed to create additional formats: ' . $e->getMessage());
        }
      }

      // Ensure storage link exists
      $this->ensureStorageLinkExists();

      return response()->json([
        'success' => true,
        'message' => 'Icon updated successfully!',
        'data' => [
          'icon' => $this->getIconUrl($filename),
        ],
      ]);
    } catch (\Exception $e) {
      Log::error('Icon update failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to update icon: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Reset icon to default.
   */
  public function resetIcon()
  {
    $user = Auth::user();

    if (!$user instanceof User) {
      abort(401);
    }

    // Check permission
    if (!$user->hasPermission('admin_profile.edit')) {
      return response()->json([
        'success' => false,
        'message' => 'You do not have permission to reset the icon.'
      ], 403);
    }

    try {
      $this->deleteOldIcons();

      return response()->json([
        'success' => true,
        'message' => 'Icon reset to default successfully!',
      ]);
    } catch (\Exception $e) {
      Log::error('Icon reset failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to reset icon: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Get current icon info.
   */
  protected function getCurrentIcon(): ?array
  {
    try {
      $iconFiles = ['icon.png', 'icon.ico', 'icon.svg', 'icon.jpg', 'icon.jpeg', 'icon.webp'];

      foreach ($iconFiles as $file) {
        $path = $this->iconPath . '/' . $file;
        if ($this->disk->exists($path)) {
          return [
            'name' => $file,
            'url' => $this->getIconUrl($file),
            'size' => $this->formatBytes($this->disk->size($path)),
            'last_modified' => date('Y-m-d H:i:s', $this->disk->lastModified($path)),
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
      $iconFiles = ['icon.png', 'icon.ico', 'icon.svg', 'icon.jpg', 'icon.jpeg', 'icon.webp', 'icon.gif'];

      foreach ($iconFiles as $file) {
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
   * Format bytes.
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
}
