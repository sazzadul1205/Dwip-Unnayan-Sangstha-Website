<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * Fillable fields - removed 'role' column
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'old_password',
        'google_id',
        'google_avatar',
        'email_verified_at',
    ];

    /**
     * Hidden fields for serialization
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Cast fields to native types
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /* ========== RELATIONSHIPS ========== */

    /**
     * Applicant profile relation (for job seekers)
     */
    public function applicantProfile()
    {
        return $this->hasOne(ApplicantProfile::class);
    }

    /**
     * Job listings relation (for employers)
     */
    public function jobListings()
    {
        return $this->hasMany(JobListing::class);
    }

    /**
     * Applications relation
     */
    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    /**
     * Job views relation
     */
    public function jobViews()
    {
        return $this->hasMany(JobView::class);
    }

    /* ========== RBAC RELATIONSHIPS ========== */

    /**
     * Roles assigned to this user
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('assigned_by', 'assigned_at', 'expires_at', 'is_active')
            ->wherePivot('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->withTimestamps();
    }

    /**
     * All role assignments (including expired/inactive)
     */
    public function allRoleAssignments()
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withPivot('assigned_by', 'assigned_at', 'expires_at', 'is_active')
            ->withTimestamps();
    }

    /**
     * User role pivot model relation
     */
    public function roleAssignments()
    {
        return $this->hasMany(UserRole::class);
    }

    /**
     * Roles assigned by this user
     */
    public function assignedRoles()
    {
        return $this->hasMany(UserRole::class, 'assigned_by');
    }

    /* ========== RBAC HELPER METHODS ========== */

    /**
     * Check if user has a specific role
     */
    public function hasRole(string $roleSlug): bool
    {
        return $this->roles()->where('slug', $roleSlug)->exists();
    }

    /**
     * Check if user has any of the given roles
     */
    public function hasAnyRole(array $roleSlugs): bool
    {
        return $this->roles()->whereIn('slug', $roleSlugs)->exists();
    }

    /**
     * Check if user has all of the given roles
     */
    public function hasAllRoles(array $roleSlugs): bool
    {
        $userRoleSlugs = $this->roles()->pluck('slug')->toArray();
        return count(array_intersect($roleSlugs, $userRoleSlugs)) === count($roleSlugs);
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(string $permissionSlug): bool
    {
        return $this->roles()
            ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('permissions.slug', $permissionSlug)
            ->where('role_permissions.granted', true)
            ->exists();
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(array $permissionSlugs): bool
    {
        foreach ($permissionSlugs as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the given permissions
     */
    public function hasAllPermissions(array $permissionSlugs): bool
    {
        foreach ($permissionSlugs as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get module access level for a user
     */
    public function getModuleAccess(string $module): string
    {
        $accessLevel = $this->roles()
            ->join('role_module_access', 'roles.id', '=', 'role_module_access.role_id')
            ->where('role_module_access.module', $module)
            ->orderByRaw("FIELD(access_level, 'manage', 'write', 'read', 'no_access')")
            ->value('access_level');

        return $accessLevel ?? 'no_access';
    }

    /**
     * Check if user can access a module at the required level
     */
    public function canAccessModule(string $module, string $requiredLevel = 'read'): bool
    {
        $levels = ['no_access' => 0, 'read' => 1, 'write' => 2, 'manage' => 3];

        $userLevel = $levels[$this->getModuleAccess($module)] ?? 0;
        $required = $levels[$requiredLevel] ?? 0;

        return $userLevel >= $required;
    }

    /**
     * Assign a role to the user
     */
    public function assignRole(string $roleSlug, ?int $assignedBy = null): bool
    {
        $role = Role::where('slug', $roleSlug)->first();

        if (!$role) {
            return false;
        }

        $this->roles()->attach($role->id, [
            'assigned_by' => $assignedBy ?? Auth::id(),
            'assigned_at' => now(),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return true;
    }

    /**
     * Assign multiple roles to the user
     */
    public function assignRoles(array $roleSlugs, ?int $assignedBy = null): bool
    {
        foreach ($roleSlugs as $roleSlug) {
            $this->assignRole($roleSlug, $assignedBy);
        }
        return true;
    }

    /**
     * Sync roles (replace all current roles with new ones)
     */
    public function syncRoles(array $roleSlugs): void
    {
        $roleIds = Role::whereIn('slug', $roleSlugs)->pluck('id')->toArray();
        $this->roles()->sync($roleIds);
    }

    /**
     * Remove a role from the user
     */
    public function removeRole(string $roleSlug): bool
    {
        $role = Role::where('slug', $roleSlug)->first();

        if (!$role) {
            return false;
        }

        $this->roles()->detach($role->id);
        return true;
    }
}
