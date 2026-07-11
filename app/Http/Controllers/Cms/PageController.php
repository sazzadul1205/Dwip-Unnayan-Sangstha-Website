<?php
// app/Http/Controllers/Cms/PageController.php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
  /**
   * Protected pages that cannot be deleted or deactivated
   */
  protected function getProtectedPages(): array
  {
    return [
      'home',
      'about',
      'services',
      'contact',
      'blog',
      'programs',
    ];
  }

  /**
   * Check if a page is protected
   */
  protected function isProtected(Page $page): bool
  {
    // Pages with "-details" suffix are always protected
    if (str_ends_with($page->slug, '-details')) {
      return true;
    }

    return in_array($page->slug, $this->getProtectedPages());
  }

  /**
   * Display pages
   */
  public function index(): Response
  {
    try {
      $items = Page::withTrashed()->get();

      return Inertia::render('Backend/CMS/Index', [
        'items' => $items,
        'protectedPages' => $this->getProtectedPages(),
      ]);
    } catch (\Exception $e) {
      Log::error('Failed to fetch pages: ' . $e->getMessage());
      return Inertia::render('Backend/CMS/Index', [
        'items' => [],
        'protectedPages' => $this->getProtectedPages(),
        'flash' => ['error' => 'Failed to load pages. Please try again.']
      ]);
    }
  }

  /**
   * Store a new page
   */
  public function store(Request $request)
  {
    try {
      $validator = Validator::make($request->all(), [
        'slug' => 'required|string|unique:pages,slug',
        'name' => 'required|string|max:255',
        'title' => 'nullable|string|max:255',
        'description' => 'nullable|string',
        'is_active' => 'boolean',
      ]);

      if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
      }

      $data = $request->all();

      // Ensure boolean values are cast correctly
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      Page::create($data);

      return redirect()->back()->with('success', '✅ Page created successfully.');
    } catch (\Exception $e) {
      Log::error('Page creation failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'input' => $request->all()
      ]);

      return back()
        ->withErrors(['error' => 'Failed to create page: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Update a page
   */
  public function update(Request $request, int $id)
  {
    try {
      $page = Page::withTrashed()->findOrFail($id);

      // Check if page is protected
      if ($this->isProtected($page)) {
        // Prevent deactivating protected pages
        if (isset($request->is_active) && !$request->is_active) {
          return back()->with('error', 'Cannot deactivate a protected page.');
        }
      }

      $validator = Validator::make($request->all(), [
        'slug' => 'required|string|unique:pages,slug,' . $id,
        'name' => 'required|string|max:255',
        'title' => 'nullable|string|max:255',
        'description' => 'nullable|string',
        'is_active' => 'boolean',
      ]);

      if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
      }

      $data = $request->all();

      // Ensure boolean values are cast correctly
      $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

      $page->update($data);

      return redirect()->back()->with('success', '✅ Page updated successfully.');
    } catch (\Exception $e) {
      Log::error('Page update failed: ' . $e->getMessage(), [
        'trace' => $e->getTraceAsString(),
        'page_id' => $id,
        'input' => $request->all()
      ]);

      return back()
        ->withErrors(['error' => 'Failed to update page: ' . $e->getMessage()])
        ->withInput();
    }
  }

  /**
   * Toggle page status
   */
  public function toggleStatus(int $id)
  {
    try {
      $page = Page::findOrFail($id);

      if ($this->isProtected($page)) {
        return back()->with('error', 'Cannot deactivate a protected page.');
      }

      $page->is_active = !$page->is_active;
      $page->save();

      $status = $page->is_active ? 'activated' : 'deactivated';
      return redirect()->back()->with('success', "✅ Page {$status} successfully.");
    } catch (\Exception $e) {
      Log::error('Page status toggle failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to toggle page status.');
    }
  }

  /**
   * Soft delete a page
   */
  public function destroy(int $id)
  {
    try {
      $page = Page::findOrFail($id);

      if ($this->isProtected($page)) {
        return back()->with('error', 'Cannot delete a protected page.');
      }

      $page->delete();

      return redirect()->back()->with('success', '🗑️ Page moved to trash successfully.');
    } catch (\Exception $e) {
      Log::error('Page deletion failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to delete page.');
    }
  }

  /**
   * Restore a soft-deleted page
   */
  public function restore(int $id)
  {
    try {
      $page = Page::withTrashed()->findOrFail($id);
      $page->restore();

      return redirect()->back()->with('success', '🔄 Page restored successfully.');
    } catch (\Exception $e) {
      Log::error('Page restoration failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to restore page.');
    }
  }

  /**
   * Force delete a page
   */
  public function forceDelete(int $id)
  {
    try {
      $page = Page::withTrashed()->findOrFail($id);

      if ($this->isProtected($page)) {
        return back()->with('error', 'Cannot delete a protected page.');
      }

      $page->forceDelete();

      return redirect()->back()->with('success', '🗑️ Page permanently deleted.');
    } catch (\Exception $e) {
      Log::error('Page force deletion failed: ' . $e->getMessage(), ['page_id' => $id]);
      return redirect()->back()->with('error', 'Failed to permanently delete page.');
    }
  }
}
