<?php
// app/Models/Role.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Fields allowed for mass assignment
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'level',
        'is_default',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * Type casting for consistent data handling
     */
    protected $casts = [
        'level' => 'integer',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /* ==========================================
     | RELATIONSHIPS
     |========================================== */

    /**
     * Users assigned to this role
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
            ->withPivot('assigned_by', 'assigned_at', 'expires_at', 'is_active')
            ->withTimestamps();
    }

    /**
     * Only active (non-expired) users with this role
     */
    public function activeUsers(): BelongsToMany
    {
        return $this->users()
            ->wherePivot('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Permissions linked to this role
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')
            ->withPivot('granted')
            ->withTimestamps();
    }

    /**
     * Only granted permissions (filtered)
     */
    public function grantedPermissions(): BelongsToMany
    {
        return $this->permissions()->wherePivot('granted', true);
    }

    /**
     * Module-level access configuration
     */
    public function moduleAccess(): HasMany
    {
        return $this->hasMany(RoleModuleAccess::class);
    }

    /**
     * User who created this role
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * User who last updated this role
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /* ==========================================
     | SCOPES
     |========================================== */

    /**
     * Only active roles
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Default system roles
     */
    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    /**
     * Filter roles by access level range
     */
    public function scopeByLevel(
        Builder $query,
        ?int $minLevel = null,
        ?int $maxLevel = null
    ): Builder {
        if ($minLevel !== null) {
            $query->where('level', '>=', $minLevel);
        }

        if ($maxLevel !== null) {
            $query->where('level', '<=', $maxLevel);
        }

        return $query;
    }

    /* ==========================================
     | HELPERS
     |========================================== */

    /**
     * Check if role has a specific permission by slug
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->grantedPermissions()
            ->where('slug', $permissionSlug)
            ->exists();
    }

    /**
     * Assign a permission to this role
     */
    public function grantPermission(int $permissionId): void
    {
        $this->permissions()->syncWithoutDetaching([
            $permissionId => ['granted' => true],
        ]);
    }

    /**
     * Remove a permission from this role
     */
    public function revokePermission(int $permissionId): void
    {
        $this->permissions()->detach($permissionId);
    }

    /**
     * Get access level for a specific module
     */
    public function getModuleAccessLevel(string $module): string
    {
        $access = $this->moduleAccess()
            ->where('module', $module)
            ->first();

        return $access?->access_level ?? 'no_access';
    }

    /**
     * Set or update module access level
     */
    public function setModuleAccess(
        string $module,
        string $accessLevel
    ): RoleModuleAccess {
        return RoleModuleAccess::updateOrCreate(
            ['role_id' => $this->id, 'module' => $module],
            ['access_level' => $accessLevel]
        );
    }

    /**
     * Check if role can access module at required level - FIXED to reuse constants
     */
    public function canAccessModule(
        string $module,
        string $requiredLevel = 'read'
    ): bool {
        $levels = array_flip(RoleModuleAccess::$accessLevels);

        $roleLevel = $levels[$this->getModuleAccessLevel($module)] ?? 0;
        $required = $levels[$requiredLevel] ?? 0;

        return $roleLevel >= $required;
    }

    /**
     * Group permissions by module name
     */
    public function getPermissionsGroupedByModule()
    {
        return $this->grantedPermissions()
            ->get()
            ->groupBy('module');
    }
}
