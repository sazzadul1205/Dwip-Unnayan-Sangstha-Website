<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    /**
     * Display a listing of locations with pagination and filters
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to view locations
        if (!$user->hasPermission('locations.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view locations.');
        }

        $query = Location::withTrashed();

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

        // Search by name or address
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
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

        $locations = $query->paginate(9)->withQueryString();

        // Get summary statistics
        $stats = [
            'total' => Location::count(),
            'active' => Location::where('is_active', true)->count(),
            'inactive' => Location::where('is_active', false)->count(),
            'total_deleted' => Location::onlyTrashed()->count(),
        ];

        return Inertia::render('Backend/Locations/Index', [
            'locations' => $locations,
            'filters' => $request->only(['search', 'status', 'sort', 'direction']),
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created location
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to create location
        if (!$user->hasPermission('locations.create')) {
            return redirect()->back()->with('error', 'You do not have permission to create locations.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:locations,name',
            'address' => 'nullable|string|max:500',
            'is_active' => 'boolean'
        ]);

        try {
            $location = Location::create([
                'name' => $validated['name'],
                'address' => $validated['address'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            Log::info('Location created', [
                'location_id' => $location->id,
                'location_name' => $location->name,
                'created_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'Location created successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to create location', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return redirect()->back()->with('error', 'Failed to create location: ' . $e->getMessage());
        }
    }

    /**
     * Update the specified location
     */
    public function update(Request $request, Location $location)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to edit location
        if (!$user->hasPermission('locations.edit')) {
            return redirect()->back()->with('error', 'You do not have permission to edit locations.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:locations,name,' . $location->id,
            'address' => 'nullable|string|max:500',
            'is_active' => 'boolean'
        ]);

        try {
            $location->update([
                'name' => $validated['name'],
                'address' => $validated['address'] ?? null,
                'is_active' => $validated['is_active'] ?? $location->is_active,
            ]);

            Log::info('Location updated', [
                'location_id' => $location->id,
                'location_name' => $location->name,
                'updated_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'Location updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to update location', [
                'location_id' => $location->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to update location: ' . $e->getMessage());
        }
    }

    /**
     * Toggle location active status
     */
    public function toggleActive(Location $location)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to toggle location status
        if (!$user->hasPermission('locations.toggle_active')) {
            return redirect()->back()->with('error', 'You do not have permission to change location status.');
        }

        try {
            $newStatus = !$location->is_active;
            $location->update(['is_active' => $newStatus]);

            Log::info('Location status toggled', [
                'location_id' => $location->id,
                'location_name' => $location->name,
                'new_status' => $newStatus,
                'updated_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Location has been " . ($newStatus ? 'activated' : 'deactivated') . ".");
        } catch (\Exception $e) {
            Log::error('Failed to toggle location status', [
                'location_id' => $location->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to update location status.');
        }
    }

    /**
     * Soft delete the specified location
     */
    public function destroy(Location $location)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to delete location
        if (!$user->hasPermission('locations.delete')) {
            return redirect()->back()->with('error', 'You do not have permission to delete locations.');
        }

        // Check if location is used in any job listings
        $jobListingsCount = $location->jobListings()->count();

        Log::info('Delete attempt', [
            'location_id' => $location->id,
            'location_name' => $location->name,
            'job_count' => $jobListingsCount,
        ]);

        if ($jobListingsCount > 0) {
            // Return redirect with error flash for Inertia
            Log::info('Returning error response', [
                'message' => "Cannot delete location '{$location->name}'. It is currently used in {$jobListingsCount} job listing(s)."
            ]);
            return redirect()->back()->with('error', "Cannot delete location '{$location->name}'. It is currently used in {$jobListingsCount} job listing(s).");
        }

        try {
            $locationName = $location->name;
            $location->delete();

            Log::info('Location soft deleted', [
                'location_id' => $location->id,
                'location_name' => $locationName,
                'deleted_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Location '{$locationName}' moved to trash.");
        } catch (\Exception $e) {
            Log::error('Failed to delete location', [
                'location_id' => $location->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to delete location: ' . $e->getMessage());
        }
    }

    /**
     * Restore a soft-deleted location
     */
    public function restore(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to restore location
        if (!$user->hasPermission('locations.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore locations.');
        }

        $location = Location::onlyTrashed()->findOrFail($id);

        try {
            $location->restore();

            Log::info('Location restored', [
                'location_id' => $location->id,
                'location_name' => $location->name,
                'restored_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Location '{$location->name}' restored successfully.");
        } catch (\Exception $e) {
            Log::error('Failed to restore location', [
                'location_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to restore location: ' . $e->getMessage());
        }
    }

    /**
     * Permanently delete a soft-deleted location (force delete)
     */
    public function forceDelete(int $id)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission to force delete location
        if (!$user->hasPermission('locations.force_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete locations.');
        }

        $location = Location::onlyTrashed()->findOrFail($id);

        // Check if location is used in any job listings
        $jobListingsCount = $location->jobListings()->count();

        if ($jobListingsCount > 0) {
            return redirect()->back()->with('error', "Cannot permanently delete location '{$location->name}' because it is used in {$jobListingsCount} job listing(s).");
        }

        try {
            $locationName = $location->name;
            $location->forceDelete();

            Log::info('Location force deleted permanently', [
                'location_id' => $id,
                'location_name' => $locationName,
                'deleted_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', "Location '{$locationName}' has been permanently deleted.");
        } catch (\Exception $e) {
            Log::error('Failed to force delete location', [
                'location_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to permanently delete location: ' . $e->getMessage());
        }
    }

    /**
     * Bulk soft delete locations
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission for bulk delete
        if (!$user->hasPermission('locations.bulk_delete')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk delete locations.');
        }

        $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $deletedCount = 0;
        $failedLocations = [];

        foreach ($request->location_ids as $locationId) {
            $location = Location::find($locationId);

            if (!$location) {
                $failedLocations[] = "Location ID {$locationId} not found";
                continue;
            }

            // Check if location is used in job listings
            $jobListingsCount = $location->jobListings()->count();
            if ($jobListingsCount > 0) {
                $failedLocations[] = "{$location->name} (used in {$jobListingsCount} job(s))";
                continue;
            }

            try {
                $location->delete();
                $deletedCount++;
            } catch (\Exception $e) {
                $failedLocations[] = $location->name;
                Log::error('Bulk delete failed for location', [
                    'location_id' => $locationId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($deletedCount === 0 && !empty($failedLocations)) {
            return redirect()->back()->with('error', 'Cannot delete locations: ' . implode(', ', $failedLocations));
        }

        $message = "{$deletedCount} location(s) moved to trash successfully.";
        if (!empty($failedLocations)) {
            $message .= " Failed: " . implode(', ', $failedLocations);
        }

        $status = $deletedCount > 0 ? 'success' : 'error';
        return redirect()->back()->with($status, $message);
    }

    /**
     * Bulk restore soft-deleted locations
     */
    public function bulkRestore(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission for bulk restore
        if (!$user->hasPermission('locations.bulk_restore')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk restore locations.');
        }

        $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $restoredCount = Location::onlyTrashed()
            ->whereIn('id', $request->location_ids)
            ->restore();

        Log::info('Bulk locations restored', [
            'count' => $restoredCount,
            'location_ids' => $request->location_ids,
            'restored_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "{$restoredCount} location(s) restored successfully.");
    }

    /**
     * Bulk activate locations
     */
    public function bulkActivate(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission for bulk activate
        if (!$user->hasPermission('locations.bulk_activate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk activate locations.');
        }

        $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $updatedCount = Location::whereIn('id', $request->location_ids)
            ->whereNull('deleted_at')
            ->update(['is_active' => true]);

        Log::info('Bulk locations activated', [
            'count' => $updatedCount,
            'location_ids' => $request->location_ids,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "{$updatedCount} location(s) activated successfully.");
    }

    /**
     * Bulk deactivate locations
     */
    public function bulkDeactivate(Request $request)
    {
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        // Check permission for bulk deactivate
        if (!$user->hasPermission('locations.bulk_deactivate')) {
            return redirect()->back()->with('error', 'You do not have permission to bulk deactivate locations.');
        }

        $request->validate([
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id',
        ]);

        $updatedCount = Location::whereIn('id', $request->location_ids)
            ->whereNull('deleted_at')
            ->update(['is_active' => false]);

        Log::info('Bulk locations deactivated', [
            'count' => $updatedCount,
            'location_ids' => $request->location_ids,
            'updated_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', "{$updatedCount} location(s) deactivated successfully.");
    }

    /**
     * Get active locations for dropdowns
     */
    public function getActiveLocations()
    {
        // Public AJAX endpoint - check if user is authenticated at least
        $user = Auth::user();

        // Check if user is logged in
        if (!$user instanceof User) {
            abort(401);
        }

        if (!$user || !$user->hasPermission('locations.get_active')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $locations = Location::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'address']);

        return response()->json($locations);
    }
}
