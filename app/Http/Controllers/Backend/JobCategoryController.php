<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\JobCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class JobCategoryController extends Controller
{
    /**
     * Display a listing (including soft deleted) with pagination and filters
     */
    public function index(Request $request)
    {
        $query = JobCategory::withTrashed();

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', true)->whereNull('deleted_at');
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false)->whereNull('deleted_at');
            } elseif ($request->status === 'deleted') {
                $query->onlyTrashed();
            }
        }

        // Search by name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Sort
        $sortField = $request->get('sort', 'name');
        $sortDirection = $request->get('direction', 'asc');
        $allowedSortFields = ['name', 'is_active', 'created_at', 'updated_at'];

        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        $categories = $query->paginate(9)->withQueryString();

        // Get summary statistics
        $stats = [
            'total' => JobCategory::count(),
            'active' => JobCategory::where('is_active', true)->count(),
            'inactive' => JobCategory::where('is_active', false)->count(),
            'total_deleted' => JobCategory::onlyTrashed()->count(),
        ];

        return Inertia::render('Backend/JobCategories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'status', 'sort', 'direction']),
            'stats' => $stats,
        ]);
    }

    /**
     * Store a new category
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:job_categories,name',
            'is_active' => 'boolean',
        ]);

        // Generate slug from name
        $validated['slug'] = Str::slug($validated['name']);

        // Check if slug is unique, if not make it unique
        $originalSlug = $validated['slug'];
        $counter = 1;
        while (JobCategory::where('slug', $validated['slug'])->exists()) {
            $validated['slug'] = $originalSlug . '-' . $counter;
            $counter++;
        }

        JobCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully');
    }

    /**
     * Update category
     */
    public function update(Request $request, int|string $category)
    {
        $jobCategory = JobCategory::findOrFail($category);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:job_categories,name,' . $jobCategory->id,
            'is_active' => 'boolean',
        ]);

        /**
         * If name changed, regenerate slug
         */
        if ($jobCategory->name !== $validated['name']) {

            $validated['slug'] = Str::slug($validated['name']);

            /**
             * Ensure slug is unique
             */
            $originalSlug = $validated['slug'];
            $counter = 1;

            while (
                JobCategory::where('slug', $validated['slug'])
                ->where('id', '!=', $jobCategory->id)
                ->exists()
            ) {
                $validated['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }
        }

        /**
         * Update category
         */
        $jobCategory->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Category updated successfully');
    }

    /**
     * Soft delete
     */
    public function destroy(int|string $category)
    {
        $jobCategory = JobCategory::findOrFail($category);

        // Check if category has related job listings
        $jobListingsCount = $jobCategory->jobListings()->count();

        Log::info('Delete attempt', [
            'category_id' => $jobCategory->id,
            'category_name' => $jobCategory->name,
            'job_count' => $jobListingsCount,
        ]);

        if ($jobListingsCount > 0) {
            return redirect()->back()->with('error', "Cannot delete category '{$jobCategory->name}'. It is currently used in {$jobListingsCount} job listing(s).");
        }

        try {
            $jobCategory->delete();

            Log::info('Category soft deleted', [
                'category_id' => $jobCategory->id,
                'category_name' => $jobCategory->name,
                'deleted_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Category '{$jobCategory->name}' moved to trash.");
        } catch (\Exception $e) {
            Log::error('Failed to delete category', [
                'category_id' => $jobCategory->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to delete category: ' . $e->getMessage());
        }
    }

    /**
     * Toggle active/inactive
     */
    public function toggleActive(int|string $category)
    {
        $jobCategory = JobCategory::findOrFail($category);

        try {
            $newStatus = !$jobCategory->is_active;
            $jobCategory->update(['is_active' => $newStatus]);

            Log::info('Category status toggled', [
                'category_id' => $jobCategory->id,
                'category_name' => $jobCategory->name,
                'new_status' => $newStatus,
                'updated_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Category has been " . ($newStatus ? 'activated' : 'deactivated') . ".");
        } catch (\Exception $e) {
            Log::error('Failed to toggle category status', [
                'category_id' => $jobCategory->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to update category status.');
        }
    }

    /**
     * Restore soft deleted
     */
    public function restore(int $id)
    {
        $category = JobCategory::onlyTrashed()->findOrFail($id);

        // Check if restoring would cause duplicate name/slug
        $existingCategory = JobCategory::where('name', $category->name)
            ->where('id', '!=', $category->id)
            ->first();

        if ($existingCategory) {
            return redirect()->back()->with('error', 'Cannot restore: A category with the same name already exists.');
        }

        try {
            $categoryName = $category->name;
            $category->restore();

            Log::info('Category restored', [
                'category_id' => $category->id,
                'category_name' => $categoryName,
                'restored_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Category '{$categoryName}' restored successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to restore category', [
                'category_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to restore category: ' . $e->getMessage());
        }
    }

    /**
     * Permanently delete (force delete)
     */
    public function forceDelete(int $id)
    {
        $category = JobCategory::onlyTrashed()->findOrFail($id);

        // Check if category has related job listings
        $jobListingsCount = $category->jobListings()->count();

        if ($jobListingsCount > 0) {
            return redirect()->back()->with('error', "Cannot permanently delete category '{$category->name}' because it is used in {$jobListingsCount} job listing(s).");
        }

        try {
            $categoryName = $category->name;
            $category->forceDelete();

            Log::info('Category force deleted permanently', [
                'category_id' => $id,
                'category_name' => $categoryName,
                'deleted_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Category '{$categoryName}' has been permanently deleted.");
        } catch (\Exception $e) {
            Log::error('Failed to force delete category', [
                'category_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to permanently delete category: ' . $e->getMessage());
        }
    }

    /**
     * Bulk soft delete categories
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $deletedCount = 0;
        $failedCategories = [];

        foreach ($request->category_ids as $categoryId) {
            $category = JobCategory::find($categoryId);

            if (!$category) {
                $failedCategories[] = "Category ID {$categoryId} not found";
                continue;
            }

            // Check if category is used in job listings
            $jobListingsCount = $category->jobListings()->count();
            if ($jobListingsCount > 0) {
                $failedCategories[] = "{$category->name} (used in {$jobListingsCount} job(s))";
                continue;
            }

            try {
                $category->delete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failedCategories[] = $category->name;
                Log::error('Bulk delete failed for category', [
                    'category_id' => $categoryId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($deletedCount === 0 && !empty($failedCategories)) {
            return redirect()->back()->with('error', 'Cannot delete categories: ' . implode(', ', $failedCategories));
        }

        $message = "{$deletedCount} category(ies) moved to trash successfully.";
        if (!empty($failedCategories)) {
            $message .= " Failed: " . implode(', ', $failedCategories);
        }

        $status = $deletedCount > 0 ? 'success' : 'error';
        return redirect()->back()->with($status, $message);
    }

    /**
     * Bulk restore soft-deleted categories
     */
    public function bulkRestore(Request $request)
    {
        $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $restoredCount = JobCategory::onlyTrashed()
            ->whereIn('id', $request->category_ids)
            ->restore();

        Log::info('Bulk categories restored', [
            'count' => $restoredCount,
            'category_ids' => $request->category_ids,
            'restored_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "{$restoredCount} category(ies) restored successfully.");
    }

    /**
     * Bulk force delete categories
     */
    public function bulkForceDelete(Request $request)
    {
        $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $deletedCount = 0;
        $failedCategories = [];

        foreach ($request->category_ids as $categoryId) {
            $category = JobCategory::onlyTrashed()->find($categoryId);

            if (!$category) {
                $failedCategories[] = "Category ID {$categoryId} not found or not in trash";
                continue;
            }

            // Check if category has related job listings
            $jobListingsCount = $category->jobListings()->count();
            if ($jobListingsCount > 0) {
                $failedCategories[] = "{$category->name} (used in {$jobListingsCount} job(s))";
                continue;
            }

            try {
                $category->forceDelete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failedCategories[] = $category->name;
                Log::error('Bulk force delete failed for category', [
                    'category_id' => $categoryId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($deletedCount === 0 && !empty($failedCategories)) {
            return redirect()->back()->with('error', 'Cannot permanently delete categories: ' . implode(', ', $failedCategories));
        }

        $message = "{$deletedCount} category(ies) permanently deleted.";
        if (!empty($failedCategories)) {
            $message .= " Failed: " . implode(', ', $failedCategories);
        }

        $status = $deletedCount > 0 ? 'success' : 'error';
        return redirect()->back()->with($status, $message);
    }

    /**
     * Bulk activate categories
     */
    public function bulkActivate(Request $request)
    {
        $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $updatedCount = JobCategory::whereIn('id', $request->category_ids)
            ->whereNull('deleted_at')
            ->update(['is_active' => true]);

        Log::info('Bulk categories activated', [
            'count' => $updatedCount,
            'category_ids' => $request->category_ids,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "{$updatedCount} category(ies) activated successfully.");
    }

    /**
     * Bulk deactivate categories
     */
    public function bulkDeactivate(Request $request)
    {
        $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:job_categories,id',
        ]);

        $updatedCount = JobCategory::whereIn('id', $request->category_ids)
            ->whereNull('deleted_at')
            ->update(['is_active' => false]);

        Log::info('Bulk categories deactivated', [
            'count' => $updatedCount,
            'category_ids' => $request->category_ids,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "{$updatedCount} category(ies) deactivated successfully.");
    }

    /**
     * Get active categories (for dropdowns, etc.)
     */
    public function getActiveCategories()
    {
        $categories = JobCategory::active()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json($categories);
    }
}
