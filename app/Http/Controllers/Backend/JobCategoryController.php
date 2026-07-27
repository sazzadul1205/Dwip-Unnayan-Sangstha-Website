<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\JobCategory;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class JobCategoryController extends Controller
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
     * Display a listing (including soft deleted) with pagination and filters.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view categories.');
        }

        $cacheKey = 'job_categories_index_' . md5(json_encode($request->query()));

        $data = Cache::remember($cacheKey, $this->cacheDuration, function () use ($request) {
            $query = JobCategory::withTrashed();

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
                $query->where('name', 'like', "%{$search}%");
            }

            $sortField = $request->input('sort', 'name');
            $sortDirection = $request->input('direction', 'asc');
            $allowedSortFields = ['name', 'is_active', 'created_at', 'updated_at'];

            if (in_array($sortField, $allowedSortFields)) {
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->orderBy('name', 'asc');
            }

            $categories = $query->paginate(9)->withQueryString();

            $stats = [
                'total' => JobCategory::count(),
                'active' => JobCategory::where('is_active', true)->count(),
                'inactive' => JobCategory::where('is_active', false)->count(),
                'total_deleted' => JobCategory::onlyTrashed()->count(),
            ];

            return [
                'categories' => $categories,
                'filters' => $request->only(['search', 'status', 'sort', 'direction']),
                'stats' => $stats,
            ];
        });

        return Inertia::render('Backend/JobCategories/Index', $data);
    }

    /**
     * Store a new category – with rate limiting.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.create')) {
            return redirect()->back()->with('error', 'You do not have permission to create categories.');
        }

        $this->checkRateLimit('category_create', $user->id);

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:job_categories,name',
                'is_active' => 'nullable|boolean',
            ]);

            $validated['is_active'] = filter_var($validated['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);
            $validated['slug'] = $this->generateUniqueSlug($validated['name']);

            $category = JobCategory::create($validated);

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('category_create', $user->id));

            SimpleLogger::cms(
                "Job category created: {$category->name}",
                [
                    'category_id' => $category->id,
                    'slug' => $category->slug,
                    'is_active' => $category->is_active,
                    'created_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return redirect()->back()->with('success', 'Category created successfully');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Category creation failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to create category: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Update category – with rate limiting.
     */
    public function update(Request $request, int|string $category): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.edit')) {
            return redirect()->back()->with('error', 'You do not have permission to edit categories.');
        }

        $this->checkRateLimit('category_update', $user->id);

        try {
            $jobCategory = JobCategory::findOrFail($category);

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:job_categories,name,' . $jobCategory->id,
                'is_active' => 'nullable|boolean',
            ]);

            $validated['is_active'] = filter_var($validated['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

            $oldName = $jobCategory->name;
            $oldStatus = $jobCategory->is_active;

            if ($jobCategory->name !== $validated['name']) {
                $validated['slug'] = $this->generateUniqueSlug($validated['name'], $jobCategory->id);
            }

            $jobCategory->update($validated);

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('category_update', $user->id));

            $changes = [];
            if ($oldName !== $jobCategory->name) {
                $changes['name'] = ['old' => $oldName, 'new' => $jobCategory->name];
            }
            if ($oldStatus !== $jobCategory->is_active) {
                $changes['status'] = ['old' => $oldStatus ? 'active' : 'inactive', 'new' => $jobCategory->is_active ? 'active' : 'inactive'];
            }

            SimpleLogger::cms(
                "Job category updated: {$jobCategory->name}",
                [
                    'category_id' => $jobCategory->id,
                    'changes' => $changes,
                    'updated_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return redirect()->back()->with('success', 'Category updated successfully');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Category update failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to update category: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Toggle active/inactive – with rate limiting.
     */
    public function toggleActive(int|string $category): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.toggle_active')) {
            return redirect()->back()->with('error', 'You do not have permission to change category status.');
        }

        $this->checkRateLimit('category_toggle', $user->id);

        try {
            $jobCategory = JobCategory::findOrFail($category);
            $newStatus = !$jobCategory->is_active;
            $jobCategory->update(['is_active' => $newStatus]);

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('category_toggle', $user->id));

            $statusText = $newStatus ? 'activated' : 'deactivated';

            SimpleLogger::cms(
                "Job category {$statusText}: {$jobCategory->name}",
                [
                    'category_id' => $jobCategory->id,
                    'new_status' => $newStatus,
                    'updated_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Category has been " . $statusText . ".");
        } catch (\Exception $e) {
            Log::error('Failed to toggle category status: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update category status.');
        }
    }

    /**
     * Soft delete – with rate limiting.
     */
    public function destroy(int|string $category): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.delete')) {
            return redirect()->back()->with('error', 'You do not have permission to delete categories.');
        }

        $this->checkRateLimit('category_delete', $user->id);

        $jobCategory = JobCategory::findOrFail($category);

        $jobListingsCount = $jobCategory->jobListings()->count();

        if ($jobListingsCount > 0) {
            return redirect()->back()->with('error', "Cannot delete category '{$jobCategory->name}'. It is currently used in {$jobListingsCount} job listing(s).");
        }

        try {
            $categoryName = $jobCategory->name;
            $jobCategory->delete();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('category_delete', $user->id));

            SimpleLogger::cms(
                "Job category deleted: {$categoryName}",
                [
                    'category_id' => $jobCategory->id,
                    'deleted_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Category '{$categoryName}' moved to trash.");
        } catch (\Exception $e) {
            Log::error('Failed to delete category: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete category: ' . $e->getMessage());
        }
    }

    /**
     * Restore soft deleted – with rate limiting.
     */
    public function restore(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore categories.');
        }

        $this->checkRateLimit('category_restore', $user->id);

        try {
            $category = JobCategory::onlyTrashed()->findOrFail($id);

            // Check duplicate name
            $existing = JobCategory::where('name', $category->name)
                ->where('id', '!=', $category->id)
                ->first();
            if ($existing) {
                return redirect()->back()->with('error', 'Cannot restore: A category with the same name already exists.');
            }

            $categoryName = $category->name;
            $category->restore();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('category_restore', $user->id));

            SimpleLogger::cms(
                "Job category restored: {$categoryName}",
                [
                    'category_id' => $category->id,
                    'restored_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Category '{$categoryName}' restored successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to restore category: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to restore category: ' . $e->getMessage());
        }
    }

    /**
     * Permanently delete – with rate limiting.
     */
    public function forceDelete(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete categories.');
        }

        $this->checkRateLimit('category_force_delete', $user->id);

        try {
            $category = JobCategory::onlyTrashed()->findOrFail($id);

            $jobListingsCount = $category->jobListings()->count();
            if ($jobListingsCount > 0) {
                return redirect()->back()->with('error', "Cannot permanently delete category '{$category->name}' because it is used in {$jobListingsCount} job listing(s).");
            }

            $categoryName = $category->name;
            $category->forceDelete();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('category_force_delete', $user->id));

            SimpleLogger::cms(
                "Job category permanently deleted: {$categoryName}",
                [
                    'category_id' => $category->id,
                    'deleted_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "Category '{$categoryName}' has been permanently deleted.");
        } catch (\Exception $e) {
            Log::error('Failed to force delete category: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to permanently delete category: ' . $e->getMessage());
        }
    }

    // ==========================================
    // BULK OPERATIONS – with rate limiting
    // ==========================================

    public function bulkDelete(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete categories.');
        }

        $this->checkRateLimit('category_bulk_delete', $user->id);

        $validated = $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $deletedCount = 0;
        $failed = [];

        foreach ($validated['category_ids'] as $categoryId) {
            $category = JobCategory::find($categoryId);
            if (!$category) {
                $failed[] = "Category ID {$categoryId} not found";
                continue;
            }

            $jobCount = $category->jobListings()->count();
            if ($jobCount > 0) {
                $failed[] = "{$category->name} (used in {$jobCount} job(s))";
                continue;
            }

            try {
                $category->delete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failed[] = $category->name;
                Log::error('Bulk delete failed for category', ['category_id' => $categoryId, 'error' => $e->getMessage()]);
            }
        }

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('category_bulk_delete', $user->id));

        $message = "{$deletedCount} category(ies) moved to trash successfully.";
        if (!empty($failed)) {
            $message .= " Failed: " . implode(', ', $failed);
        }

        SimpleLogger::cms(
            "Bulk delete categories",
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

        if (!$user->hasPermission('categories.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore categories.');
        }

        $this->checkRateLimit('category_bulk_restore', $user->id);

        $validated = $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $restoredCount = JobCategory::onlyTrashed()
            ->whereIn('id', $validated['category_ids'])
            ->restore();

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('category_bulk_restore', $user->id));

        SimpleLogger::cms(
            "Bulk restore categories",
            [
                'restored_count' => $restoredCount,
                'category_ids' => $validated['category_ids'],
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with('success', "{$restoredCount} category(ies) restored successfully.");
    }

    public function bulkForceDelete(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.bulk_force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete categories.');
        }

        $this->checkRateLimit('category_bulk_force_delete', $user->id);

        $validated = $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $deletedCount = 0;
        $failed = [];

        foreach ($validated['category_ids'] as $categoryId) {
            $category = JobCategory::onlyTrashed()->find($categoryId);
            if (!$category) {
                $failed[] = "Category ID {$categoryId} not found or not in trash";
                continue;
            }

            $jobCount = $category->jobListings()->count();
            if ($jobCount > 0) {
                $failed[] = "{$category->name} (used in {$jobCount} job(s))";
                continue;
            }

            try {
                $category->forceDelete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failed[] = $category->name;
                Log::error('Bulk force delete failed for category', ['category_id' => $categoryId, 'error' => $e->getMessage()]);
            }
        }

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('category_bulk_force_delete', $user->id));

        $message = "{$deletedCount} category(ies) permanently deleted.";
        if (!empty($failed)) {
            $message .= " Failed: " . implode(', ', $failed);
        }

        SimpleLogger::cms(
            "Bulk force delete categories",
            [
                'deleted_count' => $deletedCount,
                'failed' => $failed,
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with($deletedCount > 0 ? 'success' : 'error', $message);
    }

    public function bulkActivate(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.bulk_activate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk activate categories.');
        }

        $this->checkRateLimit('category_bulk_activate', $user->id);

        $validated = $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $updatedCount = JobCategory::whereIn('id', $validated['category_ids'])
            ->whereNull('deleted_at')
            ->update(['is_active' => true]);

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('category_bulk_activate', $user->id));

        SimpleLogger::cms(
            "Bulk activate categories",
            [
                'activated_count' => $updatedCount,
                'category_ids' => $validated['category_ids'],
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with('success', "{$updatedCount} category(ies) activated successfully.");
    }

    public function bulkDeactivate(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.bulk_deactivate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk deactivate categories.');
        }

        $this->checkRateLimit('category_bulk_deactivate', $user->id);

        $validated = $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $updatedCount = JobCategory::whereIn('id', $validated['category_ids'])
            ->whereNull('deleted_at')
            ->update(['is_active' => false]);

        $this->clearCache();
        RateLimiter::clear($this->getThrottleKey('category_bulk_deactivate', $user->id));

        SimpleLogger::cms(
            "Bulk deactivate categories",
            [
                'deactivated_count' => $updatedCount,
                'category_ids' => $validated['category_ids'],
                'performed_by' => $user->email,
                'ip' => $request->ip(),
            ]
        );

        return redirect()->back()->with('success', "{$updatedCount} category(ies) deactivated successfully.");
    }

    /**
     * Get active categories for dropdowns.
     */
    public function getActiveCategories(): JsonResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('categories.get_active')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $categories = JobCategory::active()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json($categories);
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
        return "category_{$action}|{$userId}";
    }

    /**
     * Clear category cache keys.
     */
    private function clearCache(): void
    {
        Cache::forget('job_categories_index_*');
        Cache::forget('job_categories_active');
    }

    /**
     * Generate a unique slug.
     */
    private function generateUniqueSlug(string $name, ?int $excludeId = null): string
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (JobCategory::where('slug', $slug)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->exists()
        ) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
