<?php
// app/Traits/HasRoles.php

namespace App\Traits;

use App\Models\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Trait HasRoles
 *
 * Adds RBAC role + permission functionality
 * to Eloquent models (usually User model).
 *
 * @mixin Model
 * @property-read \Illuminate\Support\Collection<int, \App\Models\Role> $roles
 * @property-read array<int, string> $permissions
 * @method BelongsToMany belongsToMany($related, $table = null, $foreignPivotKey = null, $relatedPivotKey = null, $parentKey = null, $relatedKey = null, $relation = null)
 * @method bool relationLoaded(string $key)
 * @method $this load($relations)
 */
trait HasRoles
{
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
      ->withPivot([
        'assigned_by',
        'assigned_at',
        'expires_at',
        'is_active',
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
   */
  public function getPermissionsAttribute(): array
  {
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

    return array_unique(array_values($permissions));
  }

    /* =========================================================
     | ROLE HELPERS
     |========================================================= */

  /**
   * Check if user has a specific role.
   */
  public function hasRole(string $roleSlug): bool
  {
    return $this->roles()
      ->where('slug', $roleSlug)
      ->exists();
  }

  /**
   * Check if user has any role from array.
   *
   * @param array<int, string> $roleSlugs
   */
  public function hasAnyRole(array $roleSlugs): bool
  {
    return $this->roles()
      ->whereIn('slug', $roleSlugs)
      ->exists();
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
   * Assign role to user.
   */
  public function assignRole(
    string $roleSlug,
    ?int $assignedBy = null,
    ?int $expiresInDays = null
  ): bool {
    $role = Role::where('slug', $roleSlug)->first();

    if (!$role) {
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
   *
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

    return $this->roles()->sync($syncData);
  }

  /**
   * Remove role from user.
   */
  public function removeRole(string $roleSlug): int|false
  {
    $role = Role::where('slug', $roleSlug)->first();

    if (!$role) {
      return false;
    }

    return $this->roles()->detach($role->id);
  }

  /**
   * Get user's primary role (highest level).
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
   * Check if user has a permission.
   */
  public function hasPermission(string $permissionSlug): bool
  {
    // Check through RBAC roles
    $hasPermission = $this->roles()
      ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
      ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
      ->where('permissions.slug', $permissionSlug)
      ->where('role_permissions.granted', true)
      ->exists();

    if ($hasPermission) {
      return true;
    }

    // Super admin override
    if ($this->hasRole('super-admin')) {
      return true;
    }

    return false;
  }

  /**
   * Check if user has any permission.
   *
   * @param array<int, string> $permissionSlugs
   */
  public function hasAnyPermission(
    array $permissionSlugs
  ): bool {
    foreach ($permissionSlugs as $permissionSlug) {
      if ($this->hasPermission($permissionSlug)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has all permissions.
   *
   * @param array<int, string> $permissionSlugs
   */
  public function hasAllPermissions(
    array $permissionSlugs
  ): bool {
    foreach ($permissionSlugs as $permissionSlug) {
      if (!$this->hasPermission($permissionSlug)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all permissions slugs for the user.
   */
  public function getAllPermissions(): array
  {
    return $this->permissions;
  }

    /* =========================================================
     | MODULE ACCESS
     |========================================================= */

  /**
   * Get highest module access level.
   */
  public function getModuleAccess(string $module): string
  {
    $accessLevel = $this->roles()
      ->join(
        'role_module_access',
        'roles.id',
        '=',
        'role_module_access.role_id'
      )
      ->where('role_module_access.module', $module)
      ->orderByRaw(
        "FIELD(access_level, 'manage', 'write', 'read', 'no_access')"
      )
      ->value('access_level');

    return is_string($accessLevel)
      ? $accessLevel
      : 'no_access';
  }

  /**
   * Check if user can access module.
   */
  public function canAccess(
    string $module,
    string $requiredLevel = 'read'
  ): bool {
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
}
