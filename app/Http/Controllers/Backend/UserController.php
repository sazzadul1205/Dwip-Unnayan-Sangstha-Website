<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Cache duration in seconds (5 minutes).
     */
    protected int $cacheDuration = 300;

    /**
     * Rate limit max attempts per hour.
     */
    protected int $rateLimitAttempts = 10;

    /**
     * Display a listing of users with pagination and filters.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('users.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view users.');
        }

        $cacheKey = 'users_index_' . md5(json_encode($request->query()));

        $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($request) {
            $query = User::withTrashed()->with('roles');

            // Filter by status (active/deleted)
            $status = $request->input('status', 'all');
            if ($status !== 'all') {
                if ($status === 'active') {
                    $query->whereNull('deleted_at');
                } elseif ($status === 'deleted') {
                    $query->onlyTrashed();
                }
            }

            // Filter by verification status
            if ($request->filled('email_verified')) {
                if ($request->email_verified === 'verified') {
                    $query->whereNotNull('email_verified_at');
                } elseif ($request->email_verified === 'unverified') {
                    $query->whereNull('email_verified_at');
                }
            }

            // Filter by role
            if ($request->filled('role')) {
                $query->whereHas('roles', function ($q) use ($request) {
                    $q->where('slug', $request->role);
                });
            }

            // Search by name or email
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Sort
            $sortField = $request->input('sort', 'created_at');
            $sortDirection = $request->input('direction', 'desc');
            $allowedSortFields = ['id', 'name', 'email', 'created_at', 'updated_at', 'email_verified_at'];

            if (in_array($sortField, $allowedSortFields)) {
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            $users = $query->paginate(7)->withQueryString();

            $users->through(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name,
                            'slug' => $role->slug,
                            'level' => $role->level,
                        ];
                    }),
                    'email_verified_at' => $user->email_verified_at,
                    'is_verified' => !is_null($user->email_verified_at),
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'deleted_at' => $user->deleted_at,
                ];
            });

            $stats = [
                'total' => User::count(),
                'active' => User::whereNull('deleted_at')->count(),
                'deleted' => User::onlyTrashed()->count(),
                'verified' => User::whereNotNull('email_verified_at')->count(),
                'unverified' => User::whereNull('email_verified_at')->whereNull('deleted_at')->count(),
            ];

            $roles = Role::active()
                ->orderBy('level', 'asc')
                ->orderBy('name', 'asc')
                ->get(['id', 'name', 'slug', 'description', 'level']);

            return [
                'users' => $users,
                'filters' => $request->only(['search', 'status', 'role', 'email_verified', 'sort', 'direction']),
                'stats' => $stats,
                'roles' => $roles,
            ];
        });

        return Inertia::render('Backend/Users/Index', $data);
    }

    /**
     * Store a newly created user (auto‑verified for backend creation) – with rate limiting.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('users.create')) {
            return redirect()->back()->with('error', 'You do not have permission to create users.');
        }

        $this->checkRateLimit('user_store', $user->id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_slug' => 'required|string|exists:roles,slug',
        ]);

        try {
            $role = Role::where('slug', $validated['role_slug'])->first();

            $newUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(),
            ]);

            $newUser->assignRole($validated['role_slug'], $user->id);

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('user_store', $user->id));

            SimpleLogger::users(
                "User created: {$newUser->name} ({$newUser->email})",
                [
                    'user_id' => $newUser->id,
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                    'role' => $validated['role_slug'],
                    'verified' => true,
                    'created_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            Log::info('User created and auto-verified', [
                'user_id' => $newUser->id,
                'user_email' => $newUser->email,
                'role' => $validated['role_slug'],
                'created_by' => $user->id,
                'auto_verified' => true,
            ]);

            return redirect()->back()->with('success', 'User created and verified successfully.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to create user', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);
            return back()->with('error', 'Failed to create user: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Update the specified user – with rate limiting.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $authUser = $this->getAuthUser();

        if (!$authUser->hasPermission('users.update')) {
            return redirect()->back()->with('error', 'You do not have permission to update users.');
        }

        $this->checkRateLimit('user_update', $authUser->id);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role_slug' => 'required|string|exists:roles,slug',
            'password' => 'nullable|string|min:8',
        ]);

        try {
            $oldName = $user->name;
            $oldEmail = $user->email;
            $oldRole = $user->roles->pluck('slug')->first();

            $updateData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
            ];

            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $user->update($updateData);
            $user->syncRoles([$validated['role_slug']]);

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('user_update', $authUser->id));

            $changes = [];
            if ($oldName !== $validated['name']) {
                $changes['name'] = ['old' => $oldName, 'new' => $validated['name']];
            }
            if ($oldEmail !== $validated['email']) {
                $changes['email'] = ['old' => $oldEmail, 'new' => $validated['email']];
            }
            if ($oldRole !== $validated['role_slug']) {
                $changes['role'] = ['old' => $oldRole, 'new' => $validated['role_slug']];
            }

            if (!empty($changes)) {
                SimpleLogger::users(
                    "User updated: {$user->name} ({$user->email})",
                    [
                        'user_id' => $user->id,
                        'changes' => $changes,
                        'updated_by' => $authUser->email,
                        'ip' => $request->ip(),
                    ]
                );
            }

            Log::info('User updated', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'role' => $validated['role_slug'],
                'updated_by' => $authUser->id,
            ]);

            return redirect()->back()->with('success', 'User updated successfully.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return back()->with('error', 'Failed to update user: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Verify a user (mark email as verified) – with rate limiting.
     */
    public function verify(int $id): RedirectResponse
    {
        $authUser = $this->getAuthUser();

        if (!$authUser->hasPermission('users.verify')) {
            return redirect()->back()->with('error', 'You do not have permission to verify users.');
        }

        $this->checkRateLimit('user_verify', $authUser->id);

        $user = User::findOrFail($id);

        if ($user->email_verified_at) {
            return redirect()->back()->with('info', 'User is already verified.');
        }

        $user->update(['email_verified_at' => now()]);

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('user_verify', $authUser->id));

        SimpleLogger::users(
            "User verified: {$user->name} ({$user->email})",
            [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'verified_by' => $authUser->email,
                'ip' => request()->ip(),
            ]
        );

        Log::info('User manually verified', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'verified_by' => $authUser->id,
        ]);

        return redirect()->back()->with('success', "User '{$user->name}' has been verified successfully.");
    }

    /**
     * Soft delete the specified user – with rate limiting.
     */
    public function destroy(int $id): RedirectResponse
    {
        $authUser = $this->getAuthUser();

        if (!$authUser->hasPermission('users.destroy')) {
            return redirect()->back()->with('error', 'You do not have permission to delete users.');
        }

        $this->checkRateLimit('user_destroy', $authUser->id);

        $user = User::findOrFail($id);

        if ($user->id === $authUser->id) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        $hasApplications = $user->applications()->count() > 0;
        $hasJobListings = $user->jobListings()->count() > 0;

        if ($hasApplications || $hasJobListings) {
            return redirect()->back()->with('error', "Cannot delete user '{$user->name}' because they have associated data.");
        }

        try {
            $userName = $user->name;
            $userEmail = $user->email;
            $user->delete();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('user_destroy', $authUser->id));

            SimpleLogger::users(
                "User soft deleted: {$userName} ({$userEmail})",
                [
                    'user_id' => $user->id,
                    'name' => $userName,
                    'email' => $userEmail,
                    'deleted_by' => $authUser->email,
                    'ip' => request()->ip(),
                ]
            );

            Log::info('User soft deleted', [
                'user_id' => $user->id,
                'user_name' => $userName,
                'deleted_by' => $authUser->id,
            ]);

            return redirect()->back()->with('success', "User '{$userName}' moved to trash.");
        } catch (\Exception $e) {
            Log::error('Failed to delete user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }

    /**
     * Restore a soft‑deleted user – with rate limiting.
     */
    public function restore(int $id): RedirectResponse
    {
        $authUser = $this->getAuthUser();

        if (!$authUser->hasPermission('users.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore users.');
        }

        $this->checkRateLimit('user_restore', $authUser->id);

        $user = User::onlyTrashed()->findOrFail($id);

        try {
            $user->restore();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('user_restore', $authUser->id));

            SimpleLogger::users(
                "User restored: {$user->name} ({$user->email})",
                [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'restored_by' => $authUser->email,
                    'ip' => request()->ip(),
                ]
            );

            Log::info('User restored', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'restored_by' => $authUser->id,
            ]);

            return redirect()->back()->with('success', "User '{$user->name}' restored successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to restore user', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to restore user: ' . $e->getMessage());
        }
    }

    /**
     * Permanently delete a soft‑deleted user – with rate limiting.
     */
    public function forceDelete(int $id): RedirectResponse
    {
        $authUser = $this->getAuthUser();

        if (!$authUser->hasPermission('users.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete users.');
        }

        $this->checkRateLimit('user_force_delete', $authUser->id);

        $user = User::onlyTrashed()->findOrFail($id);

        try {
            $userName = $user->name;
            $userEmail = $user->email;
            $user->forceDelete();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('user_force_delete', $authUser->id));

            SimpleLogger::users(
                "User permanently deleted: {$userName} ({$userEmail})",
                [
                    'user_id' => $id,
                    'name' => $userName,
                    'email' => $userEmail,
                    'deleted_by' => $authUser->email,
                    'ip' => request()->ip(),
                ]
            );

            Log::info('User force deleted permanently', [
                'user_id' => $id,
                'user_name' => $userName,
                'deleted_by' => $authUser->id,
            ]);

            return redirect()->back()->with('success', "User '{$userName}' has been permanently deleted.");
        } catch (\Exception $e) {
            Log::error('Failed to force delete user', [
                'user_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to permanently delete user: ' . $e->getMessage());
        }
    }

    // ==========================================
    // BULK OPERATIONS – with rate limiting
    // ==========================================

    public function bulkDelete(Request $request): RedirectResponse
    {
        $authUser = $this->getAuthUser();

        if (!$authUser->hasPermission('users.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete users.');
        }

        $this->checkRateLimit('user_bulk_delete', $authUser->id);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $deletedCount = 0;
        $failed = [];

        foreach ($validated['user_ids'] as $userId) {
            $user = User::find($userId);

            if (!$user) {
                $failed[] = "User ID {$userId} not found";
                continue;
            }

            if ($user->id === $authUser->id) {
                $failed[] = "{$user->name} (cannot delete yourself)";
                continue;
            }

            $hasApplications = $user->applications()->count() > 0;
            $hasJobListings = $user->jobListings()->count() > 0;

            if ($hasApplications || $hasJobListings) {
                $failed[] = "{$user->name} (has associated data)";
                continue;
            }

            try {
                $user->delete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failed[] = $user->name;
                Log::error('Bulk delete failed for user', [
                    'user_id' => $userId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('user_bulk_delete', $authUser->id));

        $message = "{$deletedCount} user(s) moved to trash successfully.";
        if (!empty($failed)) {
            $message .= " Failed: " . implode(', ', $failed);
        }

        SimpleLogger::users(
            "Bulk delete users",
            [
                'deleted_count' => $deletedCount,
                'failed' => $failed,
                'performed_by' => $authUser->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with($deletedCount > 0 ? 'success' : 'error', $message);
    }

    public function bulkRestore(Request $request): RedirectResponse
    {
        $authUser = $this->getAuthUser();

        if (!$authUser->hasPermission('users.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore users.');
        }

        $this->checkRateLimit('user_bulk_restore', $authUser->id);

        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $restoredCount = User::onlyTrashed()
            ->whereIn('id', $validated['user_ids'])
            ->restore();

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('user_bulk_restore', $authUser->id));

        SimpleLogger::users(
            "Bulk restore users",
            [
                'restored_count' => $restoredCount,
                'user_ids' => $validated['user_ids'],
                'performed_by' => $authUser->email,
                'ip' => $request->ip(),
            ]
        );

        Log::info('Bulk users restored', [
            'count' => $restoredCount,
            'user_ids' => $validated['user_ids'],
            'restored_by' => $authUser->id,
        ]);

        return redirect()->back()->with('success', "{$restoredCount} user(s) restored successfully.");
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
     * Check rate limit for user actions.
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
        return "user_{$action}|{$userId}";
    }

    /**
     * Clear user cache keys.
     */
    private function clearCache(): void
    {
        Cache::forget('users_index_*');
    }
}
