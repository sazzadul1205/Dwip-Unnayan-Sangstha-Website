<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    /**
     * Cache duration in seconds (2 minutes - reduced from 5).
     */
    protected int $cacheDuration = 120;

    /**
     * Rate limit max attempts per hour.
     */
    protected int $rateLimitAttempts = 10;

    /**
     * Display a listing of locations with pagination and filters.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view locations.');
        }

        // ✅ Add cache-busting headers to prevent browser caching
        $response = response()->make();
        $response->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->header('Pragma', 'no-cache');
        $response->header('Expires', '0');

        $cacheKey = 'locations_index_' . md5(json_encode($request->query()));

        $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($request) {
            $query = Location::withTrashed();

            $status = $request->input('status', 'all');
            if ($status !== 'all') {
                match ($status) {
                    'active' => $query->where('is_active', true)->whereNull('deleted_at'),
                    'inactive' => $query->where('is_active', false)->whereNull('deleted_at'),
                    'deleted' => $query->onlyTrashed(),
                    default => null,
                };
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            }

            $sortField = $request->input('sort', 'name');
            $sortDirection = $request->input('direction', 'asc');
            $allowedSortFields = ['name', 'is_active', 'created_at', 'updated_at'];

            if (in_array($sortField, $allowedSortFields)) {
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->orderBy('name', 'asc');
            }

            $locations = $query->paginate(9)->withQueryString();

            $stats = [
                'total' => Location::count(),
                'active' => Location::where('is_active', true)->count(),
                'inactive' => Location::where('is_active', false)->count(),
                'total_deleted' => Location::onlyTrashed()->count(),
            ];

            return [
                'locations' => $locations,
                'filters' => $request->only(['search', 'status', 'sort', 'direction']),
                'stats' => $stats,
            ];
        });

        return Inertia::render('Backend/Locations/Index', $data);
    }

    /**
     * Store a newly created location – with rate limiting.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.create')) {
            return redirect()->back()->with('error', 'You do not have permission to create locations.');
        }

        $this->checkRateLimit('location_create', $user->id);

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:locations,name',
                'address' => 'nullable|string|max:500',
                'is_active' => 'nullable|boolean',
            ]);

            $validated['is_active'] = filter_var($validated['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

            $location = Location::create($validated);

            // ✅ Clear ALL cache keys
            $this->clearAllCache();

            RateLimiter::clear($this->getThrottleKey('location_create', $user->id));

            SimpleLogger::cms(
                "Location created: {$location->name}",
                [
                    'location_id' => $location->id,
                    'address' => $location->address,
                    'is_active' => $location->is_active,
                    'created_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return redirect()->back()->with('success', 'Location created successfully.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to create location: ' . $e->getMessage());
            return back()->with('error', 'Failed to create location: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Update the specified location – with rate limiting.
     */
    public function update(Request $request, Location $location): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.edit')) {
            return redirect()->back()->with('error', 'You do not have permission to edit locations.');
        }

        $this->checkRateLimit('location_update', $user->id);

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:locations,name,' . $location->id,
                'address' => 'nullable|string|max:500',
                'is_active' => 'nullable|boolean',
            ]);

            $validated['is_active'] = filter_var($validated['is_active'] ?? $location->is_active, FILTER_VALIDATE_BOOLEAN);

            $oldName = $location->name;
            $oldStatus = $location->is_active;

            $location->update($validated);

            // ✅ Clear ALL cache keys
            $this->clearAllCache();

            RateLimiter::clear($this->getThrottleKey('location_update', $user->id));

            $changes = [];
            if ($oldName !== $location->name) {
                $changes['name'] = ['old' => $oldName, 'new' => $location->name];
            }
            if ($oldStatus !== $location->is_active) {
                $changes['status'] = ['old' => $oldStatus ? 'active' : 'inactive', 'new' => $location->is_active ? 'active' : 'inactive'];
            }

            SimpleLogger::cms(
                "Location updated: {$location->name}",
                [
                    'location_id' => $location->id,
                    'changes' => $changes,
                    'updated_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return redirect()->back()->with('success', 'Location updated successfully.');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Failed to update location: ' . $e->getMessage());
            return back()->with('error', 'Failed to update location: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Toggle location active status – with rate limiting.
     */
    public function toggleActive(Location $location): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.toggle_active')) {
            return redirect()->back()->with('error', 'You do not have permission to change location status.');
        }

        $this->checkRateLimit('location_toggle', $user->id);

        try {
            $newStatus = !$location->is_active;
            $location->update(['is_active' => $newStatus]);

            // ✅ Clear ALL cache keys
            $this->clearAllCache();

            RateLimiter::clear($this->getThrottleKey('location_toggle', $user->id));

            $statusText = $newStatus ? 'activated' : 'deactivated';

            SimpleLogger::cms(
                "Location {$statusText}: {$location->name}",
                [
                    'location_id' => $location->id,
                    'new_status' => $newStatus,
                    'updated_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Location has been " . $statusText . ".");
        } catch (\Exception $e) {
            Log::error('Failed to toggle location status: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update location status.');
        }
    }

    /**
     * Soft delete the specified location – with rate limiting.
     */
    public function destroy(Location $location): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.delete')) {
            return redirect()->back()->with('error', 'You do not have permission to delete locations.');
        }

        $this->checkRateLimit('location_delete', $user->id);

        $jobListingsCount = $location->jobListings()->count();

        if ($jobListingsCount > 0) {
            return redirect()->back()->with('error', "Cannot delete location '{$location->name}'. It is currently used in {$jobListingsCount} job listing(s).");
        }

        try {
            $locationName = $location->name;
            $location->delete();

            // ✅ Clear ALL cache keys
            $this->clearAllCache();

            RateLimiter::clear($this->getThrottleKey('location_delete', $user->id));

            SimpleLogger::cms(
                "Location deleted: {$locationName}",
                [
                    'location_id' => $location->id,
                    'deleted_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Location '{$locationName}' moved to trash.");
        } catch (\Exception $e) {
            Log::error('Failed to delete location: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete location: ' . $e->getMessage());
        }
    }

    /**
     * Restore a soft-deleted location – with rate limiting.
     */
    public function restore(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore locations.');
        }

        $this->checkRateLimit('location_restore', $user->id);

        try {
            $location = Location::onlyTrashed()->findOrFail($id);
            $locationName = $location->name;
            $location->restore();

            // ✅ Clear ALL cache keys
            $this->clearAllCache();

            RateLimiter::clear($this->getThrottleKey('location_restore', $user->id));

            SimpleLogger::cms(
                "Location restored: {$locationName}",
                [
                    'location_id' => $location->id,
                    'restored_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Location '{$locationName}' restored successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to restore location: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to restore location: ' . $e->getMessage());
        }
    }

    /**
     * Permanently delete a soft-deleted location (force delete) – with rate limiting.
     */
    public function forceDelete(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete locations.');
        }

        $this->checkRateLimit('location_force_delete', $user->id);

        try {
            $location = Location::onlyTrashed()->findOrFail($id);

            $jobListingsCount = $location->jobListings()->count();
            if ($jobListingsCount > 0) {
                return redirect()->back()->with('error', "Cannot permanently delete location '{$location->name}' because it is used in {$jobListingsCount} job listing(s).");
            }

            $locationName = $location->name;
            $location->forceDelete();

            // ✅ Clear ALL cache keys
            $this->clearAllCache();

            RateLimiter::clear($this->getThrottleKey('location_force_delete', $user->id));

            SimpleLogger::cms(
                "Location permanently deleted: {$locationName}",
                [
                    'location_id' => $location->id,
                    'deleted_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Location '{$locationName}' has been permanently deleted.");
        } catch (\Exception $e) {
            Log::error('Failed to force delete location: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to permanently delete location: ' . $e->getMessage());
        }
    }

    // ==========================================
    // BULK OPERATIONS – with rate limiting
    // ==========================================

    public function bulkDelete(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete locations.');
        }

        $this->checkRateLimit('location_bulk_delete', $user->id);

        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $deletedCount = 0;
        $failed = [];

        foreach ($validated['location_ids'] as $locationId) {
            $location = Location::find($locationId);
            if (!$location) {
                $failed[] = "Location ID {$locationId} not found";
                continue;
            }

            $jobCount = $location->jobListings()->count();
            if ($jobCount > 0) {
                $failed[] = "{$location->name} (used in {$jobCount} job(s))";
                continue;
            }

            try {
                $location->delete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failed[] = $location->name;
                Log::error('Bulk delete failed for location', ['location_id' => $locationId, 'error' => $e->getMessage()]);
            }
        }

        // ✅ Clear ALL cache keys
        $this->clearAllCache();

        RateLimiter::clear($this->getThrottleKey('location_bulk_delete', $user->id));

        $message = "{$deletedCount} location(s) moved to trash successfully.";
        if (!empty($failed)) {
            $message .= " Failed: " . implode(', ', $failed);
        }

        SimpleLogger::cms(
            "Bulk delete locations",
            [
                'deleted_count' => $deletedCount,
                'failed' => $failed,
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with($deletedCount > 0 ? 'success' : 'error', $message);
    }

    public function bulkRestore(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore locations.');
        }

        $this->checkRateLimit('location_bulk_restore', $user->id);

        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $restoredCount = Location::onlyTrashed()
            ->whereIn('id', $validated['location_ids'])
            ->restore();

        // ✅ Clear ALL cache keys
        $this->clearAllCache();

        RateLimiter::clear($this->getThrottleKey('location_bulk_restore', $user->id));

        SimpleLogger::cms(
            "Bulk restore locations",
            [
                'restored_count' => $restoredCount,
                'location_ids' => $validated['location_ids'],
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with('success', "{$restoredCount} location(s) restored successfully.");
    }

    public function bulkActivate(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.bulk_activate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk activate locations.');
        }

        $this->checkRateLimit('location_bulk_activate', $user->id);

        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $updatedCount = Location::whereIn('id', $validated['location_ids'])
            ->whereNull('deleted_at')
            ->update(['is_active' => true]);

        // ✅ Clear ALL cache keys
        $this->clearAllCache();

        RateLimiter::clear($this->getThrottleKey('location_bulk_activate', $user->id));

        SimpleLogger::cms(
            "Bulk activate locations",
            [
                'activated_count' => $updatedCount,
                'location_ids' => $validated['location_ids'],
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with('success', "{$updatedCount} location(s) activated successfully.");
    }

    public function bulkDeactivate(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.bulk_deactivate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk deactivate locations.');
        }

        $this->checkRateLimit('location_bulk_deactivate', $user->id);

        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $updatedCount = Location::whereIn('id', $validated['location_ids'])
            ->whereNull('deleted_at')
            ->update(['is_active' => false]);

        // ✅ Clear ALL cache keys
        $this->clearAllCache();

        RateLimiter::clear($this->getThrottleKey('location_bulk_deactivate', $user->id));

        SimpleLogger::cms(
            "Bulk deactivate locations",
            [
                'deactivated_count' => $updatedCount,
                'location_ids' => $validated['location_ids'],
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with('success', "{$updatedCount} location(s) deactivated successfully.");
    }

    /**
     * Bulk force delete (permanently delete) – with rate limiting.
     */
    public function bulkForceDelete(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.bulk_force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete locations.');
        }

        $this->checkRateLimit('location_bulk_force_delete', $user->id);

        $validated = $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $deletedCount = 0;
        $failed = [];

        foreach ($validated['location_ids'] as $locationId) {
            $location = Location::onlyTrashed()->find($locationId);
            if (!$location) {
                $failed[] = "Location ID {$locationId} not found or not in trash";
                continue;
            }

            $jobCount = $location->jobListings()->count();
            if ($jobCount > 0) {
                $failed[] = "{$location->name} (used in {$jobCount} job(s))";
                continue;
            }

            try {
                $location->forceDelete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failed[] = $location->name;
                Log::error('Bulk force delete failed for location', ['location_id' => $locationId, 'error' => $e->getMessage()]);
            }
        }

        // ✅ Clear ALL cache keys
        $this->clearAllCache();

        RateLimiter::clear($this->getThrottleKey('location_bulk_force_delete', $user->id));

        $message = "{$deletedCount} location(s) permanently deleted.";
        if (!empty($failed)) {
            $message .= " Failed: " . implode(', ', $failed);
        }

        SimpleLogger::cms(
            "Bulk force delete locations",
            [
                'deleted_count' => $deletedCount,
                'failed' => $failed,
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with($deletedCount > 0 ? 'success' : 'error', $message);
    }

    /**
     * Get active locations for dropdowns.
     */
    public function getActiveLocations(): JsonResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('locations.get_active')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'address']);

        return response()->json($locations);
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
     * Check rate limit for admin actions.
     */
    private function checkRateLimit(string $action, int $userId, int $maxAttempts = 10, int $decaySeconds = 3600): void
    {
        $key = $this->getThrottleKey($action, $userId);
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
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
        return "location_{$action}|{$userId}";
    }

    /**
     * ✅ Clear ALL location cache keys.
     */
    private function clearAllCache(): void
    {
        // Clear specific cache keys
        Cache::forget('locations_index_*');
        Cache::forget('locations_active');

        // ✅ Use Cache::flush() to clear ALL cache (more aggressive)
        // This ensures no stale data remains
        Cache::flush();

        // Log cache clearing
        Log::info('Location cache cleared', ['action' => 'all']);
    }

    /**
     * Clear location cache keys (legacy method - kept for compatibility).
     */
    private function clearCache(): void
    {
        $this->clearAllCache();
    }
}
