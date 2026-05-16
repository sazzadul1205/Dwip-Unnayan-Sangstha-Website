<?php
// app/Http/Controllers/Backend/UserController.php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of users with pagination and filters
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to view users
        if (!$user->hasPermission('users.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view users.');
        }

        $query = User::withTrashed()->with('roles');

        // Filter by status (active/deleted)
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->whereNull('deleted_at');
            } elseif ($request->status === 'deleted') {
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
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $allowedSortFields = ['id', 'name', 'email', 'created_at', 'updated_at', 'email_verified_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $users = $query->paginate(7)->withQueryString();

        // Transform users data
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

        // Get summary statistics
        $stats = [
            'total' => User::count(),
            'active' => User::whereNull('deleted_at')->count(),
            'deleted' => User::onlyTrashed()->count(),
            'verified' => User::whereNotNull('email_verified_at')->count(),
            'unverified' => User::whereNull('email_verified_at')->whereNull('deleted_at')->count(),
        ];

        // Get roles from database for filter dropdown and form
        $roles = Role::active()
            ->orderBy('level', 'asc')
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'slug', 'description', 'level']);

        return Inertia::render('Backend/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'status', 'role', 'email_verified', 'sort', 'direction']),
            'stats' => $stats,
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user (auto-verified for backend creation)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to create user
        if (!$user->hasPermission('users.create')) {
            return redirect()->back()->with('error', 'You do not have permission to create users.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_slug' => 'required|string|exists:roles,slug',
        ]);

        try {
            // Get the role
            $role = Role::where('slug', $validated['role_slug'])->first();

            // Create user (without role column)
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(),
            ]);

            // Assign role using RBAC system
            $user->assignRole($validated['role_slug'], Auth::id());

            Log::info('User created and auto-verified', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'role' => $validated['role_slug'],
                'created_by' => Auth::id(),
                'auto_verified' => true,
            ]);

            return redirect()->back()->with('success', 'User created and verified successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to create user', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return redirect()->back()->with('error', 'Failed to create user: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, int $id)
    {
        $authUser = Auth::user();

        // Check if user is logged in
        if (!$authUser instanceof User) {
            abort(401);
        }

        // Check permission to update user
        if (!$authUser->hasPermission('users.update')) {
            return redirect()->back()->with('error', 'You do not have permission to update users.');
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role_slug' => 'required|string|exists:roles,slug',
            'password' => 'nullable|string|min:8',
        ]);

        try {
            $updateData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
            ];

            // Only update password if provided
            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $user->update($updateData);

            // Sync role using RBAC system
            $user->syncRoles([$validated['role_slug']]);

            Log::info('User updated', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'role' => $validated['role_slug'],
                'updated_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'User updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to update user: ' . $e->getMessage());
        }
    }

    /**
     * Verify a user (mark email as verified)
     */
    public function verify(int $id)
    {
        $authUser = Auth::user();

        // Check if user is logged in
        if (!$authUser instanceof User) {
            abort(401);
        }

        // Check permission to verify user
        if (!$authUser->hasPermission('users.verify')) {
            return redirect()->back()->with('error', 'You do not have permission to verify users.');
        }

        $user = User::findOrFail($id);

        if ($user->email_verified_at) {
            return redirect()->back()->with('info', 'User is already verified.');
        }

        $user->update([
            'email_verified_at' => now(),
        ]);

        Log::info('User manually verified', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'verified_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "User '{$user->name}' has been verified successfully.");
    }

    /**
     * Soft delete the specified user
     */
    public function destroy(int $id)
    {
        $authUser = Auth::user();

        // Check if user is logged in
        if (!$authUser instanceof User) {
            abort(401);
        }

        // Check permission to delete user
        if (!$authUser->hasPermission('users.destroy')) {
            return redirect()->back()->with('error', 'You do not have permission to delete users.');
        }

        $user = User::findOrFail($id);

        // Prevent self-deletion
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        // Check if user has related data (optional)
        $hasApplications = $user->applications()->count() > 0;
        $hasJobListings = $user->jobListings()->count() > 0;

        if ($hasApplications || $hasJobListings) {
            return redirect()->back()->with('error', "Cannot delete user '{$user->name}' because they have associated data.");
        }

        try {
            $userName = $user->name;
            $user->delete();

            Log::info('User soft deleted', [
                'user_id' => $user->id,
                'user_name' => $userName,
                'deleted_by' => Auth::id(),
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
     * Restore a soft-deleted user
     */
    public function restore(int $id)
    {
        $authUser = Auth::user();

        // Check if user is logged in
        if (!$authUser instanceof User) {
            abort(401);
        }

        // Check permission to restore user
        if (!$authUser->hasPermission('users.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore users.');
        }

        $user = User::onlyTrashed()->findOrFail($id);

        try {
            $user->restore();

            Log::info('User restored', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'restored_by' => Auth::id(),
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
     * Permanently delete a soft-deleted user
     */
    public function forceDelete(int $id)
    {
        $authUser = Auth::user();

        // Check if user is logged in
        if (!$authUser instanceof User) {
            abort(401);
        }

        // Check permission to force delete user
        if (!$authUser->hasPermission('users.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete users.');
        }

        $user = User::onlyTrashed()->findOrFail($id);

        try {
            $userName = $user->name;
            $user->forceDelete();

            Log::info('User force deleted permanently', [
                'user_id' => $id,
                'user_name' => $userName,
                'deleted_by' => Auth::id(),
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

    /**
     * Bulk soft delete users
     */
    public function bulkDelete(Request $request)
    {
        $authUser = Auth::user();

        // Check if user is logged in
        if (!$authUser instanceof User) {
            abort(401);
        }

        // Check permission for bulk delete
        if (!$authUser->hasPermission('users.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete users.');
        }

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $deletedCount = 0;
        $failedUsers = [];

        foreach ($request->user_ids as $userId) {
            $user = User::find($userId);

            if (!$user) {
                $failedUsers[] = "User ID {$userId} not found";
                continue;
            }

            // Prevent self-deletion
            if ($user->id === Auth::id()) {
                $failedUsers[] = "{$user->name} (cannot delete yourself)";
                continue;
            }

            // Check if user has related data
            $hasApplications = $user->applications()->count() > 0;
            $hasJobListings = $user->jobListings()->count() > 0;

            if ($hasApplications || $hasJobListings) {
                $failedUsers[] = "{$user->name} (has associated data)";
                continue;
            }

            try {
                $user->delete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failedUsers[] = $user->name;
                Log::error('Bulk delete failed for user', [
                    'user_id' => $userId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($deletedCount === 0 && !empty($failedUsers)) {
            return redirect()->back()->with('error', 'Cannot delete users: ' . implode(', ', $failedUsers));
        }

        $message = "{$deletedCount} user(s) moved to trash successfully.";
        if (!empty($failedUsers)) {
            $message .= " Failed: " . implode(', ', $failedUsers);
        }

        $status = $deletedCount > 0 ? 'success' : 'error';
        return redirect()->back()->with($status, $message);
    }

    /**
     * Bulk restore soft-deleted users
     */
    public function bulkRestore(Request $request)
    {
        $authUser = Auth::user();

        // Check if user is logged in
        if (!$authUser instanceof User) {
            abort(401);
        }

        // Check permission for bulk restore
        if (!$authUser->hasPermission('users.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore users.');
        }

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $restoredCount = User::onlyTrashed()
            ->whereIn('id', $request->user_ids)
            ->restore();

        Log::info('Bulk users restored', [
            'count' => $restoredCount,
            'user_ids' => $request->user_ids,
            'restored_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "{$restoredCount} user(s) restored successfully.");
    }
}
