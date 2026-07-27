<?php

namespace App\Traits;

use App\Models\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Trait HasRoles
 *
 * Adds RBAC role + permission functionality to Eloquent models (usually User model).
 *
 * @mixin Model
 * @property-read \Illuminate\Support\Collection<int, Role> $roles
 * @property-read array<int, string> $permissions
 * @method BelongsToMany belongsToMany($related, $table = null, $foreignPivotKey = null, $relatedPivotKey = null, $parentKey = null, $relatedKey = null, $relation = null)
 * @method bool relationLoaded(string $key)
 * @method $this load($relations)
 */
trait HasRoles
{
  /**
   * Cache duration for role/permission checks (5 minutes).
   */
  protected int $rbacCacheDuration = 300;

    /* =========================================================
     | RELATIONSHIPS
     |========================================================= */

  /**
   * Get all active roles assigned to the user.
   */
  public function roles(): BelongsToMany
  {
    return $this->belongsToMany(
      Role::class,
      'user_roles',
      'user_id',
      'role_id'
    )
      ->select('roles.id', 'roles.name', 'roles.slug', 'roles.level', 'roles.description')
      ->withPivot([
        'assigned_by',
        'assigned_at',
        'expires_at',
        'is_active',
        'created_at',
        'updated_at',
      ])
      ->wherePivot('is_active', true)
      ->where(function (Builder $q): void {
        $q->whereNull('expires_at')
          ->orWhere('expires_at', '>', now());
      })
      ->withTimestamps();
  }

  /**
   * Get all permissions directly from roles (cached).
   *
   * @return array<int, string>
   */
  public function getPermissionsAttribute(): array
  {
    $cacheKey = 'user_permissions_' . $this->getKey();

    return Cache::remember($cacheKey, $this->rbacCacheDuration, function () {
      if (!$this->relationLoaded('roles')) {
        $this->load('roles.permissions');
      }

      $permissions = [];
      foreach ($this->roles as $role) {
        if ($role->relationLoaded('permissions')) {
          foreach ($role->permissions as $permission) {
            // Check if granted via pivot
            if ($permission->pivot && $permission->pivot->granted) {
              $permissions[] = $permission->slug;
            }
          }
        }
      }

      // Super‑admin override: grant all permissions
      if (in_array('super-admin', $this->roles->pluck('slug')->toArray(), true)) {
        // This is handled by the permission check itself via hasPermission()
        // We don't need to inject all permissions here to avoid memory bloat.
      }

      return array_unique(array_values($permissions));
    });
  }

    /* =========================================================
     | ROLE HELPERS
     |========================================================= */

  /**
   * Check if user has a specific role (cached).
   */
  public function hasRole(string $roleSlug): bool
  {
    $cacheKey = 'user_has_role_' . $this->getKey() . '_' . $roleSlug;

    return Cache::remember($cacheKey, $this->rbacCacheDuration, function () use ($roleSlug) {
      return $this->roles()
        ->where('slug', $roleSlug)
        ->exists();
    });
  }

  /**
   * Check if user has any role from array (cached).
   *
   * @param array<int, string> $roleSlugs
   */
  public function hasAnyRole(array $roleSlugs): bool
  {
    $cacheKey = 'user_has_any_role_' . $this->getKey() . '_' . md5(implode(',', $roleSlugs));

    return Cache::remember($cacheKey, $this->rbacCacheDuration, function () use ($roleSlugs) {
      return $this->roles()
        ->whereIn('slug', $roleSlugs)
        ->exists();
    });
  }

  /**
   * Check if user has all roles from array.
   *
   * @param array<int, string> $roleSlugs
   */
  public function hasAllRoles(array $roleSlugs): bool
  {
    $userRoleSlugs = $this->roles()->pluck('slug')->toArray();
    return empty(array_diff($roleSlugs, $userRoleSlugs));
  }

  /**
   * Assign a role to the user.
   */
  public function assignRole(
    string $roleSlug,
    ?int $assignedBy = null,
    ?int $expiresInDays = null
  ): bool {
    $role = Role::where('slug', $roleSlug)->first();

    if (!$role) {
      Log::warning('Role assignment failed: role not found', ['role_slug' => $roleSlug]);
      return false;
    }

    $this->roles()->syncWithoutDetaching([
      $role->id => [
        'assigned_by' => $assignedBy,
        'assigned_at' => now(),
        'expires_at' => $expiresInDays ? now()->addDays($expiresInDays) : null,
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
      ],
    ]);

    // Clear permission cache
    $this->clearPermissionCache();

    return true;
  }

  /**
   * Assign multiple roles.
   *
   * @param array<int, string> $roleSlugs
   */
  public function assignRoles(
    array $roleSlugs,
    ?int $assignedBy = null
  ): bool {
    foreach ($roleSlugs as $roleSlug) {
      $this->assignRole($roleSlug, $assignedBy);
    }
    return true;
  }

  /**
   * Sync roles (replace existing roles).
   *
   * @param array<int, string> $roleSlugs
   * @return array<string, mixed>
   */
  public function syncRoles(array $roleSlugs): array
  {
    $roleIds = Role::whereIn('slug', $roleSlugs)
      ->pluck('id')
      ->toArray();

    $syncData = [];
    foreach ($roleIds as $roleId) {
      $syncData[$roleId] = [
        'assigned_at' => now(),
        'is_active' => true,
        'created_at' => now(),
        'updated_at' => now(),
      ];
    }

    $result = $this->roles()->sync($syncData);

    // Clear permission cache
    $this->clearPermissionCache();

    return $result;
  }

  /**
   * Remove a role from the user.
   */
  public function removeRole(string $roleSlug): int|false
  {
    $role = Role::where('slug', $roleSlug)->first();

    if (!$role) {
      return false;
    }

    $result = $this->roles()->detach($role->id);

    // Clear permission cache
    $this->clearPermissionCache();

    return $result;
  }

  /**
   * Get the user's primary role (highest level).
   */
  public function getPrimaryRole(): ?Role
  {
    return $this->roles()
      ->orderBy('level', 'desc')
      ->first();
  }

    /* =========================================================
     | PERMISSION HELPERS
     |========================================================= */

  /**
   * Check if the user has a specific permission.
   */
  public function hasPermission(string $permissionSlug): bool
  {
    // Super‑admin override: always return true for super‑admin
    if ($this->hasRole('super-admin')) {
      return true;
    }

    $cacheKey = 'user_has_permission_' . $this->getKey() . '_' . $permissionSlug;

    return Cache::remember($cacheKey, $this->rbacCacheDuration, function () use ($permissionSlug) {
      return $this->roles()
        ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
        ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
        ->where('permissions.slug', $permissionSlug)
        ->where('role_permissions.granted', true)
        ->exists();
    });
  }

  /**
   * Check if the user has any of the given permissions.
   *
   * @param array<int, string> $permissionSlugs
   */
  public function hasAnyPermission(array $permissionSlugs): bool
  {
    foreach ($permissionSlugs as $permissionSlug) {
      if ($this->hasPermission($permissionSlug)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the user has all of the given permissions.
   *
   * @param array<int, string> $permissionSlugs
   */
  public function hasAllPermissions(array $permissionSlugs): bool
  {
    foreach ($permissionSlugs as $permissionSlug) {
      if (!$this->hasPermission($permissionSlug)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permission slugs for the user (cached).
   *
   * @return array<int, string>
   */
  public function getAllPermissions(): array
  {
    return $this->permissions;
  }

    /* =========================================================
     | MODULE ACCESS
     |========================================================= */

  /**
   * Get the highest module access level for the user.
   */
  public function getModuleAccess(string $module): string
  {
    $cacheKey = 'user_module_access_' . $this->getKey() . '_' . $module;

    return Cache::remember($cacheKey, $this->rbacCacheDuration, function () use ($module) {
      $accessLevel = $this->roles()
        ->join(
          'role_module_access',
          'roles.id',
          '=',
          'role_module_access.role_id'
        )
        ->where('role_module_access.module', $module)
        ->orderByRaw("FIELD(access_level, 'manage', 'write', 'read', 'no_access')")
        ->value('access_level');

      return is_string($accessLevel) ? $accessLevel : 'no_access';
    });
  }

  /**
   * Check if the user can access a module at the required level.
   */
  public function canAccess(string $module, string $requiredLevel = 'read'): bool
  {
    $levels = [
      'no_access' => 0,
      'read' => 1,
      'write' => 2,
      'manage' => 3,
    ];

    $userLevel = $levels[$this->getModuleAccess($module)] ?? 0;
    $required = $levels[$requiredLevel] ?? 0;

    return $userLevel >= $required;
  }

    /* =========================================================
     | CACHE CLEARING
     |========================================================= */

  /**
   * Clear all role/permission cache for this user.
   */
  public function clearPermissionCache(): void
  {
    $userId = $this->getKey();

    // Clear the main permissions cache
    Cache::forget('user_permissions_' . $userId);

    // Clear module access cache (wildcard)
    $keys = Cache::get('user_module_access_keys_' . $userId, []);
    foreach ($keys as $key) {
      Cache::forget($key);
    }
    Cache::forget('user_module_access_keys_' . $userId);

    // Clear role check caches (wildcard – using a prefix pattern)
    // Laravel doesn't support pattern-based clearing natively, so we store keys.
    $roleCacheKeys = Cache::get('user_role_cache_keys_' . $userId, []);
    foreach ($roleCacheKeys as $key) {
      Cache::forget($key);
    }
    Cache::forget('user_role_cache_keys_' . $userId);

    // Clear permission check caches
    $permissionCacheKeys = Cache::get('user_permission_cache_keys_' . $userId, []);
    foreach ($permissionCacheKeys as $key) {
      Cache::forget($key);
    }
    Cache::forget('user_permission_cache_keys_' . $userId);
  }

  /**
   * Store a cache key for later clearing (helper for cache keys).
   */
  private function storeCacheKey(string $key): void
  {
    $userId = $this->getKey();

    // Store permission cache keys
    if (str_starts_with($key, 'user_has_permission_')) {
      $stored = Cache::get('user_permission_cache_keys_' . $userId, []);
      if (!in_array($key, $stored, true)) {
        $stored[] = $key;
        Cache::put('user_permission_cache_keys_' . $userId, $stored, $this->rbacCacheDuration);
      }
    }

    // Store role cache keys
    if (str_starts_with($key, 'user_has_role_')) {
      $stored = Cache::get('user_role_cache_keys_' . $userId, []);
      if (!in_array($key, $stored, true)) {
        $stored[] = $key;
        Cache::put('user_role_cache_keys_' . $userId, $stored, $this->rbacCacheDuration);
      }
    }

    // Store module access keys
    if (str_starts_with($key, 'user_module_access_')) {
      $stored = Cache::get('user_module_access_keys_' . $userId, []);
      if (!in_array($key, $stored, true)) {
        $stored[] = $key;
        Cache::put('user_module_access_keys_' . $userId, $stored, $this->rbacCacheDuration);
      }
    }
  }
}
