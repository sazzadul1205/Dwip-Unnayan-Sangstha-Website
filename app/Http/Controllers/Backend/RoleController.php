<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * System role slugs that must never be deleted (security rule).
     */
    private const NON_DELETABLE_ROLE_SLUGS = [
        'super-admin',
        'admin',
        'employer',
        'employer-admin',
        'job_seeker',
        'job-seeker',
    ];

    /**
     * Cache duration in seconds (5 minutes).
     */
    protected int $cacheDuration = 300;

    /**
     * Rate limit max attempts per hour.
     */
    protected int $rateLimitAttempts = 10;

    /**
     * Check if a role is non‑deletable.
     */
    private function roleIsNonDeletable(Role $role): bool
    {
        return $role->is_default || in_array($role->slug, self::NON_DELETABLE_ROLE_SLUGS, true);
    }

    /**
     * Get the maximum role level the current user can create/edit.
     */
    private function getMaxAllowedLevel(): int
    {
        $user = $this->getAuthUser();
        return 100;
    }

    /**
     * Validate role level against privilege escalation.
     */
    private function validateRoleLevel(int $level): void
    {
        $user = $this->getAuthUser();
        $userLevel = $user->role?->level ?? 100;

        // Super admin (level 100) can create roles 1–99
        if ($userLevel === 100) {
            if ($level < 1) {
                throw ValidationException::withMessages([
                    'level' => 'Role level cannot be less than 1.',
                ]);
            }
            if ($level >= 100) {
                throw ValidationException::withMessages([
                    'level' => 'You cannot create a role with level 100 or higher. Maximum role level for new roles is 99.',
                ]);
            }
            return;
        }

        // Non‑super‑admin users (levels 1–99) can only create roles with HIGHER numbers (LOWER access)
        if ($level <= $userLevel) {
            throw ValidationException::withMessages([
                'level' => sprintf(
                    'You cannot create a role with level %d. You can only create roles with a higher level number (lower access) than your own level (%d).',
                    $level,
                    $userLevel
                ),
            ]);
        }

        if ($level > 100) {
            throw ValidationException::withMessages([
                'level' => 'Role level cannot exceed 100.',
            ]);
        }
    }

    // ==========================================
    // INDEX & LISTING
    // ==========================================

    /**
     * Display a listing of roles.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view roles.');
        }

        $query = Role::with(['creator', 'updater']);

        $status = $request->input('status');
        if ($status !== null && $status !== '') {
            $query->where('is_active', $status === 'active');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('min_level')) {
            $query->where('level', '>=', (int) $request->min_level);
        }
        if ($request->filled('max_level')) {
            $query->where('level', '<=', (int) $request->max_level);
        }

        $sortField = $request->input('sort', 'level');
        $sortDirection = $request->input('direction', 'asc');
        $allowedSortFields = ['name', 'slug', 'level', 'is_active', 'created_at', 'updated_at'];
        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('level', 'asc');
        }

        $roles = $query->paginate(20)->withQueryString();

        $roles->getCollection()->transform(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'level' => $role->level,
                'is_default' => $role->is_default,
                'is_active' => $role->is_active,
                'deleted_at' => $role->deleted_at,    // ✅ ADD THIS LINE
                'user_count' => $role->users()->count(),
                'permission_count' => $role->grantedPermissions()->count(),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
                'creator' => $role->creator ? [
                    'id' => $role->creator->id,
                    'name' => $role->creator->name,
                ] : null,
            ];
        });

        $stats = [
            'total' => Role::count(),
            'active' => Role::where('is_active', true)->count(),
            'inactive' => Role::where('is_active', false)->count(),
            'default' => Role::where('is_default', true)->count(),
            'total_deleted' => Role::onlyTrashed()->count(),
        ];

        $data = [
            'roles' => $roles,
            'stats' => $stats,
            'filters' => $request->only(['status', 'search', 'min_level', 'max_level', 'sort', 'direction']),
        ];

        return Inertia::render('Backend/Roles/Index', $data);
    }

    // ==========================================
    // CREATE & STORE
    // ==========================================

    /**
     * Show form to create a new role.
     */
    public function create(): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.create')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to create roles.');
        }

        $permissions = $this->getPermissionsGroupedByModule();
        $existingLevels = Role::select('level', 'name')->orderBy('level')->get();
        $currentUserLevel = $user->role?->level ?? 100;

        return Inertia::render('Backend/Roles/Create', [
            'permissions' => $permissions,
            'existingLevels' => $existingLevels,
            'accessLevels' => $this->getAccessLevels(),
            'maxAllowedLevel' => 100,
            'currentUserLevel' => $currentUserLevel,
            'minAllowedLevel' => $currentUserLevel + 1,
        ]);
    }

    /**
     * Store a newly created role – with rate limiting.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.store')) {
            return redirect()->back()->with('error', 'You do not have permission to store roles.');
        }

        $this->checkRateLimit('role_store', $user->id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'slug' => 'required|string|max:255|unique:roles,slug|regex:/^[a-z0-9-]+$/',
            'description' => 'nullable|string|max:500',
            'level' => 'required|integer|min:1|max:100',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
            'module_access' => 'nullable|array',
            'module_access.*.module' => 'required|string',
            'module_access.*.access_level' => 'required|in:no_access,read,write,manage',
        ]);

        $this->validateRoleLevel($validated['level']);

        try {
            DB::beginTransaction();

            $role = Role::create([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'description' => $validated['description'] ?? null,
                'level' => $validated['level'],
                'is_default' => $validated['is_default'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            // Sync permissions
            if (!empty($validated['permissions'])) {
                $permissionsWithGranted = [];
                foreach ($validated['permissions'] as $permissionId) {
                    $permissionsWithGranted[$permissionId] = ['granted' => true];
                }
                $role->permissions()->attach($permissionsWithGranted);
            }

            // Set module access levels
            if (!empty($validated['module_access'])) {
                foreach ($validated['module_access'] as $moduleAccess) {
                    $role->setModuleAccess($moduleAccess['module'], $moduleAccess['access_level']);
                }
            }

            DB::commit();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('role_store', $user->id));

            SimpleLogger::security(
                "Role created: {$role->name}",
                [
                    'role_id' => $role->id,
                    'role_name' => $role->name,
                    'role_level' => $role->level,
                    'created_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return redirect()->route('backend.roles.index')
                ->with('success', 'Role created successfully.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create role: ' . $e->getMessage());
            return back()->with('error', 'Failed to create role: ' . $e->getMessage())->withInput();
        }
    }

    // ==========================================
    // SHOW, EDIT, UPDATE
    // ==========================================

    /**
     * Display a specific role with its details.
     */
    public function show(int $id): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.show')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view role details.');
        }

        // No caching – always fresh
        $role = Role::with(['creator', 'updater'])->withTrashed()->findOrFail($id);

        $users = $role->users()
            ->with('applicantProfile')
            ->limit(10)
            ->get()
            ->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'profile_completed' => $user->applicantProfile ? true : false,
            ]);

        $userCount = $role->users()->count();

        $permissions = $role->grantedPermissions()
            ->orderBy('module')
            ->orderBy('name')
            ->get()
            ->groupBy('module')
            ->map(fn($perms, $module) => [
                'module' => $module,
                'permissions' => $perms->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'action' => $p->action,
                    'description' => $p->description,
                ]),
            ])->values();

        $moduleAccess = $role->moduleAccess()->get()->map(fn($access) => [
            'module' => $access->module,
            'access_level' => $access->access_level,
        ]);

        $data = [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'level' => $role->level,
                'is_default' => $role->is_default,
                'is_active' => $role->is_active,
                'user_count' => $userCount,
                'permission_count' => $permissions->count(),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
                'deleted_at' => $role->deleted_at,
                'creator' => $role->creator ? [
                    'id' => $role->creator->id,
                    'name' => $role->creator->name,
                ] : null,
                'updater' => $role->updater ? [
                    'id' => $role->updater->id,
                    'name' => $role->updater->name,
                ] : null,
            ],
            'users' => $users,
            'permissions' => $permissions,
            'moduleAccess' => $moduleAccess,
            'isDeleted' => $role->trashed(),
        ];

        return Inertia::render('Backend/Roles/Show', $data);
    }

    /**
     * Show form to edit a role.
     */
    public function edit(int $id): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.edit')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to edit roles.');
        }

        $role = Role::findOrFail($id);

        if ($this->roleIsNonDeletable($role)) {
            return redirect()->route('backend.roles.index')
                ->with('error', "The '{$role->name}' role cannot be edited.");
        }

        // No caching – always fresh
        $allPermissions = $this->getPermissionsGroupedByModule();
        $grantedPermissionIds = $role->grantedPermissions()->pluck('permissions.id')->toArray();
        $moduleAccess = $role->moduleAccess()->get()->map(fn($access) => [
            'module' => $access->module,
            'access_level' => $access->access_level,
        ]);
        $existingLevels = Role::where('id', '!=', $role->id)
            ->select('level', 'name')
            ->orderBy('level')
            ->get();
        $availableModules = Permission::select('module')->distinct()->pluck('module')->toArray();
        $currentUserLevel = $user->role?->level ?? 100;

        $data = [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'level' => $role->level,
                'is_default' => $role->is_default,
                'is_active' => $role->is_active,
            ],
            'permissions' => $allPermissions,
            'grantedPermissionIds' => $grantedPermissionIds,
            'moduleAccess' => $moduleAccess,
            'availableModules' => $availableModules,
            'existingLevels' => $existingLevels,
            'accessLevels' => $this->getAccessLevels(),
            'maxAllowedLevel' => 100,
            'currentUserLevel' => $currentUserLevel,
            'minAllowedLevel' => $currentUserLevel + 1,
        ];

        return Inertia::render('Backend/Roles/Edit', $data);
    }

    /**
     * Update a specific role – with rate limiting.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.update')) {
            return redirect()->back()->with('error', 'You do not have permission to update roles.');
        }

        $this->checkRateLimit('role_update', $user->id);

        $role = Role::findOrFail($id);

        if ($this->roleIsNonDeletable($role)) {
            return back()->with('error', "The '{$role->name}' role cannot be edited.");
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/', Rule::unique('roles')->ignore($role->id)],
            'description' => 'nullable|string|max:500',
            'level' => 'required|integer|min:1|max:100',
            'is_default' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
            'module_access' => 'nullable|array',
            'module_access.*.module' => 'required|string',
            'module_access.*.access_level' => 'required|in:no_access,read,write,manage',
        ]);

        $this->validateRoleLevel($validated['level']);

        try {
            DB::beginTransaction();

            $role->update([
                'name' => $validated['name'],
                'slug' => $validated['slug'],
                'description' => $validated['description'] ?? null,
                'level' => $validated['level'],
                'is_default' => $validated['is_default'] ?? false,
                'is_active' => $validated['is_active'] ?? true,
                'updated_by' => $user->id,
            ]);

            // Sync permissions
            $permissionsWithGranted = [];
            if (!empty($validated['permissions'])) {
                foreach ($validated['permissions'] as $permissionId) {
                    $permissionsWithGranted[$permissionId] = ['granted' => true];
                }
            }
            $role->permissions()->sync($permissionsWithGranted);

            // Sync module access
            $role->moduleAccess()->delete();
            if (!empty($validated['module_access'])) {
                foreach ($validated['module_access'] as $moduleAccess) {
                    $role->setModuleAccess($moduleAccess['module'], $moduleAccess['access_level']);
                }
            }

            DB::commit();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('role_update', $user->id));

            SimpleLogger::security(
                "Role updated: {$role->name}",
                [
                    'role_id' => $role->id,
                    'role_name' => $role->name,
                    'role_level' => $role->level,
                    'updated_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return redirect()->route('backend.roles.show', $role->id)
                ->with('success', 'Role updated successfully.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update role: ' . $e->getMessage());
            return back()->with('error', 'Failed to update role: ' . $e->getMessage())->withInput();
        }
    }

    // ==========================================
    // DELETE, RESTORE, FORCE DELETE
    // ==========================================

    /**
     * Soft delete a role – with rate limiting.
     */
    public function destroy(int $id): RedirectResponse|JsonResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.destroy')) {
            return redirect()->back()->with('error', 'You do not have permission to delete roles.');
        }

        $this->checkRateLimit('role_destroy', $user->id);

        $role = Role::findOrFail($id);

        // Protect system roles
        if ($this->roleIsNonDeletable($role)) {
            $message = "The '{$role->name}' role cannot be deleted.";
            return back()->with('error', $message);
        }

        $userCount = $role->users()->count();
        if ($userCount > 0) {
            return back()->with('error', "Cannot delete role '{$role->name}' because it has {$userCount} user(s) assigned.");
        }

        try {
            DB::beginTransaction();
            $role->permissions()->detach();
            $role->moduleAccess()->delete();
            $role->delete();
            DB::commit();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('role_destroy', $user->id));

            SimpleLogger::security(
                "Role soft deleted: {$role->name}",
                ['role_id' => $role->id, 'role_name' => $role->name, 'deleted_by' => $user->email, 'ip' => request()->ip()]
            );

            return redirect()->route('backend.roles.index')
                ->with('success', "Role '{$role->name}' deleted successfully.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete role: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete role: ' . $e->getMessage());
        }
    }

    /**
     * Restore a soft‑deleted role – with rate limiting.
     */
    public function restore(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore roles.');
        }

        $this->checkRateLimit('role_restore', $user->id);

        $role = Role::onlyTrashed()->findOrFail($id);

        try {
            $role->restore();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('role_restore', $user->id));

            SimpleLogger::security(
                "Role restored: {$role->name}",
                [
                    'role_id' => $role->id,
                    'role_name' => $role->name,
                    'restored_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->route('backend.roles.show', $role->id)
                ->with('success', "Role '{$role->name}' restored successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to restore role: ' . $e->getMessage());
            return back()->with('error', 'Failed to restore role: ' . $e->getMessage());
        }
    }

    /**
     * Display list of soft‑deleted roles.
     */
    public function trashed(Request $request): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.trashed')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view trashed roles.');
        }

        $query = Role::onlyTrashed()->with(['creator', 'updater']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $roles = $query->orderBy('deleted_at', 'desc')->paginate(20)->withQueryString();

        $roles->getCollection()->transform(fn($role) => [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
            'description' => $role->description,
            'level' => $role->level,
            'is_default' => $role->is_default,
            'deleted_at' => $role->deleted_at,
            'deleted_by' => $role->updater?->name ?? 'System',
        ]);

        return Inertia::render('Backend/Roles/Trashed', [
            'roles' => $roles,
            'stats' => ['total_deleted' => Role::onlyTrashed()->count()],
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Permanently delete a role (force delete) – with rate limiting.
     */
    public function forceDelete(int $id): RedirectResponse|JsonResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete roles.');
        }

        $this->checkRateLimit('role_force_delete', $user->id);

        $role = Role::onlyTrashed()->findOrFail($id);

        if ($this->roleIsNonDeletable($role)) {
            $message = "The '{$role->name}' role cannot be permanently deleted.";
            return back()->with('error', $message);
        }

        try {
            $role->permissions()->detach();
            $role->moduleAccess()->delete();
            $roleName = $role->name;
            $role->forceDelete();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('role_force_delete', $user->id));

            SimpleLogger::security(
                "Role force deleted: {$roleName}",
                ['role_id' => $id, 'role_name' => $roleName, 'deleted_by' => $user->email, 'ip' => request()->ip()]
            );

            return redirect()->route('backend.roles.index')
                ->with('success', "Role '{$roleName}' has been permanently deleted.");
        } catch (\Exception $e) {
            Log::error('Failed to force delete role: ' . $e->getMessage());
            return back()->with('error', 'Failed to permanently delete role: ' . $e->getMessage());
        }
    }

    // ==========================================
    // BULK OPERATIONS – with rate limiting
    // ==========================================

    public function bulkDelete(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete roles.');
        }

        $this->checkRateLimit('role_bulk_delete', $user->id);

        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        // Check for protected roles first
        foreach ($validated['role_ids'] as $roleId) {
            $role = Role::find($roleId);
            if ($role && $this->roleIsNonDeletable($role)) {
                $message = "The '{$role->name}' role is protected and cannot be deleted.";
                return back()->with('error', $message);
            }
        }

        $deletedCount = 0;
        $failed = [];

        foreach ($validated['role_ids'] as $roleId) {
            $role = Role::find($roleId);
            if (!$role) {
                $failed[] = $roleId;
                continue;
            }

            if ($role->users()->count() > 0) {
                $failed[] = $role->name . ' (has users)';
                continue;
            }

            try {
                $role->permissions()->detach();
                $role->moduleAccess()->delete();
                $role->delete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failed[] = $role->name;
                Log::error('Bulk delete failed for role', ['role_id' => $roleId, 'error' => $e->getMessage()]);
            }
        }

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('role_bulk_delete', $user->id));

        $message = "{$deletedCount} role(s) deleted successfully.";
        if (!empty($failed)) {
            $message .= " Failed: " . implode(', ', $failed);
        }

        SimpleLogger::security(
            "Bulk delete roles",
            ['deleted_count' => $deletedCount, 'failed' => $failed, 'performed_by' => $user->email, 'ip' => $request->ip()]
        );

        return back()->with('success', $message);
    }

    public function bulkRestore(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore roles.');
        }

        $this->checkRateLimit('role_bulk_restore', $user->id);

        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $restoredCount = Role::onlyTrashed()
            ->whereIn('id', $validated['role_ids'])
            ->restore();

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('role_bulk_restore', $user->id));

        SimpleLogger::security(
            "Bulk restore roles",
            [
                'restored_count' => $restoredCount,
                'role_ids' => $validated['role_ids'],
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return back()->with('success', "{$restoredCount} role(s) restored successfully.");
    }

    /**
     * Toggle role active status – with rate limiting.
     */
    public function toggleStatus(int $id): JsonResponse|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.toggle_status')) {
            if (request()->wantsJson()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            return redirect()->back()->with('error', 'You do not have permission to change role status.');
        }

        $this->checkRateLimit('role_toggle_status', $user->id);

        $role = Role::findOrFail($id);

        if ($this->roleIsNonDeletable($role)) {
            $message = "The '{$role->name}' role cannot be activated/deactivated.";
            return response()->json(['success' => false, 'message' => $message], 422);
        }

        $newStatus = !$role->is_active;
        $role->update(['is_active' => $newStatus, 'updated_by' => $user->id]);

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('role_toggle_status', $user->id));

        SimpleLogger::security(
            "Role status toggled: {$role->name}",
            [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'new_status' => $newStatus ? 'active' : 'inactive',
                'updated_by' => $user->email,
                'ip' => request()->ip(),
            ]
        );

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_active' => $newStatus,
                'message' => "Role '{$role->name}' has been " . ($newStatus ? 'activated' : 'deactivated') . ".",
            ]);
        }

        return back()->with('success', "Role '{$role->name}' has been " . ($newStatus ? 'activated' : 'deactivated') . ".");
    }

    /**
     * Clone an existing role – with rate limiting.
     */
    public function clone(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.clone')) {
            return redirect()->back()->with('error', 'You do not have permission to clone roles.');
        }

        $this->checkRateLimit('role_clone', $user->id);

        $originalRole = Role::with(['grantedPermissions', 'moduleAccess'])->findOrFail($id);

        if ($this->roleIsNonDeletable($originalRole)) {
            return back()->with('error', "The '{$originalRole->name}' role cannot be cloned.");
        }

        $newSlug = $originalRole->slug . '-copy';
        $counter = 1;
        while (Role::where('slug', $newSlug)->exists()) {
            $newSlug = $originalRole->slug . '-copy-' . $counter;
            $counter++;
        }
        $newName = $originalRole->name . ' (Copy)';

        try {
            DB::beginTransaction();

            $newRole = Role::create([
                'name' => $newName,
                'slug' => $newSlug,
                'description' => $originalRole->description . ' (Cloned from ' . $originalRole->name . ')',
                'level' => $originalRole->level,
                'is_default' => false,
                'is_active' => false,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            $permissionsWithGranted = [];
            foreach ($originalRole->grantedPermissions as $permission) {
                $permissionsWithGranted[$permission->id] = ['granted' => true];
            }
            if (!empty($permissionsWithGranted)) {
                $newRole->permissions()->attach($permissionsWithGranted);
            }

            foreach ($originalRole->moduleAccess as $moduleAccess) {
                $newRole->setModuleAccess($moduleAccess->module, $moduleAccess->access_level);
            }

            DB::commit();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('role_clone', $user->id));

            SimpleLogger::security(
                "Role cloned: {$originalRole->name} → {$newRole->name}",
                [
                    'original_role_id' => $originalRole->id,
                    'new_role_id' => $newRole->id,
                    'cloned_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->route('backend.roles.edit', $newRole->id)
                ->with('success', "Role cloned successfully. You can now edit the copy.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to clone role: ' . $e->getMessage());
            return back()->with('error', 'Failed to clone role: ' . $e->getMessage());
        }
    }

    /**
     * Export roles to CSV – with rate limiting.
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('roles.export')) {
            return redirect()->back()->with('error', 'You do not have permission to export roles.');
        }

        $this->checkRateLimit('role_export', $user->id);

        $query = Role::with(['creator', 'updater']);

        if ($request->filled('status') && $request->status !== '') {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        /** @var \Illuminate\Support\Collection<int, Role> $roles */
        $roles = $query->orderBy('level')->get();

        $filename = 'roles_export_' . date('Y-m-d_His') . '.csv';

        $output = fopen('php://temp', 'w');
        fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

        fputcsv($output, [
            'ID',
            'Name',
            'Slug',
            'Description',
            'Level',
            'Is Default',
            'Is Active',
            'User Count',
            'Permission Count',
            'Created At',
            'Created By',
            'Updated At',
            'Updated By',
        ]);

        foreach ($roles as $role) {
            fputcsv($output, [
                $role->id,
                $role->name,
                $role->slug,
                $role->description,
                $role->level,
                $role->is_default ? 'Yes' : 'No',
                $role->is_active ? 'Yes' : 'No',
                $role->users()->count(),
                $role->grantedPermissions()->count(),
                $role->created_at?->format('Y-m-d H:i:s'),
                $role->creator?->name ?? 'N/A',
                $role->updated_at?->format('Y-m-d H:i:s'),
                $role->updater?->name ?? 'N/A',
            ]);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        RateLimiter::clear($this->getThrottleKey('role_export', $user->id));

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
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
     * Check rate limit for role actions.
     */
    private function checkRateLimit(string $action, int $userId, ?int $maxAttempts = null, int $decaySeconds = 3600): void
    {
        $max = $maxAttempts ?? $this->rateLimitAttempts;
        $key = $this->getThrottleKey($action, $userId);

        if (RateLimiter::tooManyAttempts($key, $max)) {
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
        return "role_{$action}|{$userId}";
    }

    /**
     * Clear role cache keys.
     */
    private function clearCache(): void
    {
        Cache::forget('roles_index_*');
        Cache::forget('role_show_*');
        Cache::forget('role_edit_*');
    }

    /**
     * Get permissions grouped by module.
     */
    private function getPermissionsGroupedByModule(): \Illuminate\Support\Collection
    {
        return Permission::active()
            ->orderBy('module')
            ->orderBy('name')
            ->get()
            ->groupBy('module')
            ->map(function ($permissions, $module) {
                return [
                    'module' => $module,
                    'permissions' => $permissions->map(fn($p) => [
                        'id' => $p->id,
                        'name' => $p->name,
                        'slug' => $p->slug,
                        'action' => $p->action,
                        'description' => $p->description,
                    ]),
                ];
            })
            ->values();
    }

    /**
     * Get access levels for module access.
     */
    private function getAccessLevels(): array
    {
        return [
            ['value' => 'no_access', 'label' => 'No Access'],
            ['value' => 'read', 'label' => 'Read Only'],
            ['value' => 'write', 'label' => 'Read & Write'],
            ['value' => 'manage', 'label' => 'Full Management'],
        ];
    }
}
