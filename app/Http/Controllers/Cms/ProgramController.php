<?php

namespace App\Http\Controllers\Cms;

use App\Http\Controllers\Controller;
use App\Models\pages\Program;
use App\Models\User;
use App\Services\SimpleLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProgramController extends Controller
{
    /**
     * Max image size in bytes (5MB).
     */
    protected int $maxImageSize = 5 * 1024 * 1024;

    /**
     * Display programs – with caching for admin list.
     */
    public function index(): Response|RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.view')) {
            return redirect()->route('unauthorized.access')
                ->with('error', 'You do not have permission to view programs.');
        }

        try {
            $items = Cache::remember('cms_program_list', 300, function () {
                return Program::withTrashed()->orderBy('display_order')->get();
            });

            return Inertia::render('Backend/CMS/Programs/Index', ['items' => $items]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch programs: ' . $e->getMessage());
            return Inertia::render('Backend/CMS/Programs/Index', [
                'items' => [],
                'flash' => ['error' => 'Failed to load programs. Please try again.'],
            ]);
        }
    }

    /**
     * Store a new program – with rate limiting.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.create')) {
            return redirect()->back()->with('error', 'You do not have permission to create programs.');
        }

        $this->checkRateLimit('program_create', $user->id);

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string|unique:programs,slug',
                'breadcrumb' => 'nullable|string|max:255',
                'full_content_html' => 'nullable|string',
                'image' => 'nullable|string',
                'bg_color' => 'nullable|string|max:255',
                'link' => 'nullable|string|max:255',
                'display_order' => 'nullable|integer|min:0',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            $data = $this->prepareData($validated);

            // Process image if it's a base64 string
            if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
                $uploadedPath = $this->uploadImage($data['image']);
                $data['image'] = $uploadedPath ?? null;
            }

            // Generate slug if not provided
            if (empty($data['slug'])) {
                $data['slug'] = $this->generateUniqueSlug($data['title']);
            }

            // Set default display order if not provided
            if (!isset($data['display_order']) || $data['display_order'] === '') {
                $data['display_order'] = Program::withTrashed()->max('display_order') + 1;
            }

            // Set default breadcrumb if not provided
            if (empty($data['breadcrumb'])) {
                $data['breadcrumb'] = $data['title'];
            }

            // Cast booleans
            $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

            $program = Program::create($data);

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_create', $user->id));

            SimpleLogger::cms(
                "Program created: {$program->title}",
                [
                    'program_id' => $program->id,
                    'title' => $program->title,
                    'slug' => $program->slug,
                    'is_active' => $program->is_active,
                    'is_featured' => $program->is_featured,
                    'created_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            session()->forget('_old_input');

            return redirect()->back()->with('success', '✅ Program created successfully.');

        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Program creation failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'input' => $request->except(['image', 'full_content_html']),
            ]);

            return back()
                ->withErrors(['error' => 'Failed to create program: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Update a program – with rate limiting.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.update')) {
            return redirect()->back()->with('error', 'You do not have permission to update programs.');
        }

        $this->checkRateLimit('program_update', $user->id);

        try {
            $program = Program::withTrashed()->findOrFail($id);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'slug' => 'nullable|string|unique:programs,slug,' . $id,
                'breadcrumb' => 'nullable|string|max:255',
                'full_content_html' => 'nullable|string',
                'image' => 'nullable|string',
                'bg_color' => 'nullable|string|max:255',
                'link' => 'nullable|string|max:255',
                'display_order' => 'nullable|integer|min:0',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            $data = $this->prepareData($validated);

            $oldTitle = $program->title;
            $oldStatus = $program->is_active;
            $oldFeatured = $program->is_featured;

            // Process image if it's a base64 string
            if (!empty($data['image']) && $this->isBase64Image($data['image'])) {
                if ($program->image && !filter_var($program->image, FILTER_VALIDATE_URL)) {
                    $this->deleteImageFile($program->image);
                }

                $uploadedPath = $this->uploadImage($data['image']);
                $data['image'] = $uploadedPath ?? null;
            }

            // Regenerate slug if title changed and slug not manually set
            if (empty($data['slug']) || ($data['title'] !== $program->title && $data['slug'] === $program->slug)) {
                $data['slug'] = $this->generateUniqueSlug($data['title'], $id);
            }

            // Cast booleans
            $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

            $program->update($data);

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_update', $user->id));

            // Log changes
            $changes = [];
            if ($oldTitle !== $program->title) {
                $changes['title'] = ['old' => $oldTitle, 'new' => $program->title];
            }
            if ($oldStatus !== $program->is_active) {
                $changes['status'] = ['old' => $oldStatus ? 'active' : 'inactive', 'new' => $program->is_active ? 'active' : 'inactive'];
            }
            if ($oldFeatured !== $program->is_featured) {
                $changes['featured'] = ['old' => $oldFeatured ? 'yes' : 'no', 'new' => $program->is_featured ? 'yes' : 'no'];
            }

            if (!empty($changes)) {
                SimpleLogger::cms(
                    "Program updated: {$program->title}",
                    [
                        'program_id' => $program->id,
                        'changes' => $changes,
                        'updated_by' => $user->email,
                        'ip' => $request->ip(),
                    ]
                );
            }

            session()->forget('_old_input');

            return redirect()->back()->with('success', '✅ Program updated successfully.');

        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Program update failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'program_id' => $id,
                'input' => $request->except(['image', 'full_content_html']),
            ]);

            return back()
                ->withErrors(['error' => 'Failed to update program: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Toggle program status – with rate limiting.
     */
    public function toggleStatus(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.update')) {
            return redirect()->back()->with('error', 'You do not have permission to change program status.');
        }

        $this->checkRateLimit('program_toggle_status', $user->id);

        try {
            $program = Program::findOrFail($id);
            $program->is_active = !$program->is_active;
            $program->save();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_toggle_status', $user->id));

            $status = $program->is_active ? 'activated' : 'deactivated';

            SimpleLogger::cms(
                "Program {$status}: {$program->title}",
                [
                    'program_id' => $id,
                    'new_status' => $program->is_active ? 'active' : 'inactive',
                    'updated_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "✅ Program {$status} successfully.");

        } catch (\Exception $e) {
            Log::error('Program status toggle failed: ' . $e->getMessage(), ['program_id' => $id]);
            return redirect()->back()->with('error', 'Failed to toggle program status.');
        }
    }

    /**
     * Toggle featured status – with rate limiting.
     */
    public function toggleFeatured(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.update')) {
            return redirect()->back()->with('error', 'You do not have permission to change featured status.');
        }

        $this->checkRateLimit('program_toggle_featured', $user->id);

        try {
            $program = Program::findOrFail($id);

            // If making this program featured, remove featured status from others
            if (!$program->is_featured) {
                Program::where('is_featured', true)->where('id', '!=', $id)->update(['is_featured' => false]);
            }

            $program->is_featured = !$program->is_featured;
            $program->save();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_toggle_featured', $user->id));

            $status = $program->is_featured ? 'featured' : 'unfeatured';

            SimpleLogger::cms(
                "Program {$status}: {$program->title}",
                [
                    'program_id' => $id,
                    'is_featured' => $program->is_featured,
                    'updated_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', "✅ Program {$status} successfully.");

        } catch (\Exception $e) {
            Log::error('Program featured toggle failed: ' . $e->getMessage(), ['program_id' => $id]);
            return redirect()->back()->with('error', 'Failed to toggle featured status.');
        }
    }

    /**
     * Update display order (drag & drop) – with rate limiting.
     */
    public function updateOrder(Request $request): JsonResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.update')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $this->checkRateLimit('program_order', $user->id);

        try {
            $validated = $request->validate([
                'orders' => 'required|array',
                'orders.*.id' => 'required|integer|exists:programs,id',
                'orders.*.display_order' => 'required|integer|min:0',
            ]);

            foreach ($validated['orders'] as $order) {
                Program::where('id', $order['id'])->update([
                    'display_order' => $order['display_order'],
                ]);
            }

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_order', $user->id));

            SimpleLogger::cms(
                "Program order updated",
                [
                    'count' => count($validated['orders']),
                    'updated_by' => $user->email,
                    'ip' => $request->ip(),
                ]
            );

            return response()->json(['success' => true, 'message' => 'Order updated successfully.']);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Program order update failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update order.'], 500);
        }
    }

    /**
     * Soft delete a program – with rate limiting.
     */
    public function destroy(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.destroy')) {
            return redirect()->back()->with('error', 'You do not have permission to delete programs.');
        }

        $this->checkRateLimit('program_delete', $user->id);

        try {
            $program = Program::findOrFail($id);
            $program->delete();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_delete', $user->id));

            SimpleLogger::cms(
                "Program moved to trash: {$program->title}",
                [
                    'program_id' => $id,
                    'title' => $program->title,
                    'deleted_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', '🗑️ Program moved to trash successfully.');

        } catch (\Exception $e) {
            Log::error('Program deletion failed: ' . $e->getMessage(), ['program_id' => $id]);
            return redirect()->back()->with('error', 'Failed to delete program.');
        }
    }

    /**
     * Restore a soft-deleted program – with rate limiting.
     */
    public function restore(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.restore')) {
            return redirect()->back()->with('error', 'You do not have permission to restore programs.');
        }

        $this->checkRateLimit('program_restore', $user->id);

        try {
            $program = Program::withTrashed()->findOrFail($id);
            $program->restore();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_restore', $user->id));

            SimpleLogger::cms(
                "Program restored: {$program->title}",
                [
                    'program_id' => $id,
                    'title' => $program->title,
                    'restored_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', '🔄 Program restored successfully.');

        } catch (\Exception $e) {
            Log::error('Program restoration failed: ' . $e->getMessage(), ['program_id' => $id]);
            return redirect()->back()->with('error', 'Failed to restore program.');
        }
    }

    /**
     * Force delete a program – also deletes embedded images – with rate limiting.
     */
    public function forceDelete(int $id): RedirectResponse
    {
        $user = $this->getAuthUser();

        if (!$user->hasPermission('programs.destroy')) {
            return redirect()->back()->with('error', 'You do not have permission to permanently delete programs.');
        }

        $this->checkRateLimit('program_force_delete', $user->id);

        try {
            $program = Program::withTrashed()->findOrFail($id);

            // Delete main image
            if ($program->image && !filter_var($program->image, FILTER_VALIDATE_URL)) {
                $this->deleteImageFile($program->image);
            }

            // Delete images embedded in the content
            $this->deleteImagesFromContent($program->full_content_html);

            $program->forceDelete();

            $this->clearCache();
            RateLimiter::clear($this->getThrottleKey('program_force_delete', $user->id));

            SimpleLogger::cms(
                "Program permanently deleted: {$program->title}",
                [
                    'program_id' => $id,
                    'title' => $program->title,
                    'deleted_by' => $user->email,
                    'ip' => request()->ip(),
                ]
            );

            return redirect()->back()->with('success', '🗑️ Program permanently deleted.');

        } catch (\Exception $e) {
            Log::error('Program force deletion failed: ' . $e->getMessage(), ['program_id' => $id]);
            return redirect()->back()->with('error', 'Failed to permanently delete program.');
        }
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
        return "program_{$action}|{$userId}";
    }

    /**
     * Clear the program cache.
     */
    private function clearCache(): void
    {
        Cache::forget('cms_program_list');
        // Also clear frontend program cache if needed
        Cache::forget('frontend_program_list');
    }

    /**
     * Prepare data from validated input.
     */
    private function prepareData(array $validated): array
    {
        $data = $validated;

        // Cast booleans
        $data['is_featured'] = filter_var($data['is_featured'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $data['is_active'] = filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN);

        return $data;
    }

    /**
     * Generate a unique slug.
     */
    private function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        while (Program::withTrashed()
            ->where('slug', $slug)
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->exists()
        ) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Check if string is a base64 image.
     */
    private function isBase64Image(string $string): bool
    {
        return str_starts_with($string, 'data:image/');
    }

    /**
     * Upload image and return the path.
     */
    private function uploadImage(string $base64String): ?string
    {
        try {
            // Validate base64 format
            if (!preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches)) {
                Log::warning('Invalid base64 image format');
                return null;
            }

            $imageData = explode(',', $base64String);
            if (count($imageData) < 2) {
                Log::warning('Invalid base64 image data');
                return null;
            }

            $imageContent = base64_decode($imageData[1]);
            if ($imageContent === false) {
                Log::warning('Failed to decode base64 image');
                return null;
            }

            // Check file size
            if (strlen($imageContent) > $this->maxImageSize) {
                Log::warning('Image too large: ' . strlen($imageContent) . ' bytes (max: ' . $this->maxImageSize . ')');
                return null;
            }

            $extension = $this->getImageExtension($base64String);
            $filename = date('Ymd') . '_' . Str::uuid() . '.' . $extension;
            $path = 'Programs/' . $filename;

            $stored = Storage::disk('public')->put($path, $imageContent);

            if (!$stored) {
                Log::error('Failed to store image: ' . $path);
                return null;
            }

            return '/storage/' . $path;

        } catch (\Exception $e) {
            Log::error('Image upload failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get image extension from base64 string.
     */
    private function getImageExtension(string $base64String): string
    {
        $mimeMap = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
            'image/svg' => 'svg',
            'image/bmp' => 'bmp',
            'image/tiff' => 'tiff',
            'image/x-icon' => 'ico',
            'image/vnd.microsoft.icon' => 'ico',
        ];

        if (preg_match('/^data:([^;]+);base64,/', $base64String, $matches)) {
            $mimeType = $matches[1];
            return $mimeMap[$mimeType] ?? 'png';
        }

        return 'png';
    }

    /**
     * Delete image file from storage.
     */
    private function deleteImageFile(string $imagePath): void
    {
        try {
            $relativePath = str_replace('/storage/', '', $imagePath);
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
                Log::info('Image deleted: ' . $relativePath);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to delete image: ' . $e->getMessage());
        }
    }

    /**
     * Delete images embedded in HTML content (only from editor-images folder).
     */
    private function deleteImagesFromContent(?string $content): void
    {
        if (empty($content)) {
            return;
        }

        preg_match_all('/<img[^>]+src="([^"]+)"/i', $content, $matches);
        if (empty($matches[1])) {
            return;
        }

        foreach ($matches[1] as $src) {
            if (str_starts_with($src, '/storage/editor-images/')) {
                $relativePath = str_replace('/storage/', '', $src);
                try {
                    if (Storage::disk('public')->exists($relativePath)) {
                        Storage::disk('public')->delete($relativePath);
                        Log::info('Embedded image deleted: ' . $relativePath);
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to delete embedded image: ' . $e->getMessage());
                }
            }
        }
    }
}