<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Services\AssetLibrary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 *  ASSET / IMAGE MANAGEMENT
 * ============================================================
 *
 * A file-browser view of everything the site stores on disk
 * (storage/app/public and public/images), with the extra
 * information an admin cannot get from a file manager: whether
 * the project still references each file.
 *
 * Runs entirely off the filesystem, so the page keeps working
 * when the database is unavailable.
 */
class AssetManagerController extends Controller
{
    public function __construct(private readonly AssetLibrary $library)
    {
    }

    public function index(Request $request): Response|RedirectResponse
    {
        if (! $this->can('assets.view')) {
            return $this->deny('You do not have permission to manage assets.');
        }

        // A delete busts the cache; so does an explicit refresh from the UI.
        $scan = $this->library->scan($request->boolean('refresh'));

        return Inertia::render('Backend/Assets/Index', [
            'assets' => $scan['assets'],
            'folders' => $scan['folders'],
            'summary' => $scan['summary'],
            'truncated' => $scan['truncated'],
            'contentScanned' => $scan['content_scanned'],
            'can' => [
                'delete' => $this->can('assets.delete'),
            ],
        ]);
    }

    /**
     * Full metadata plus the source files that mention this asset.
     */
    public function show(string $asset): JsonResponse
    {
        if (! $this->can('assets.view')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $resolved = $this->library->resolve($asset);

        if ($resolved === null) {
            return response()->json(['error' => 'Asset not found'], 404);
        }

        $scan = $this->library->scan();
        $all = collect($scan['assets'])->firstWhere('id', $asset);

        if ($all === null) {
            return response()->json(['error' => 'Asset not found'], 404);
        }

        return response()->json([
            'asset' => $all,
            'disk_path' => str_replace(base_path() . DIRECTORY_SEPARATOR, '', $resolved['absolute']),
        ]);
    }

    /**
     * Remove one or more assets.
     *
     * Anything still referenced by the project is refused unless the request
     * explicitly forces it, so an accidental bulk delete cannot quietly break a
     * live page.
     */
    public function destroy(Request $request): RedirectResponse
    {
        if (! $this->can('assets.delete')) {
            return $this->deny('You do not have permission to delete assets.');
        }

        $validated = $request->validate([
            'assets' => ['required', 'array', 'min:1', 'max:100'],
            'assets.*' => ['required', 'string', 'max:500'],
            'force' => ['sometimes', 'boolean'],
        ]);

        $force = $request->boolean('force');
        $scan = $this->library->scan();
        $byId = collect($scan['assets'])->keyBy('id');

        $deleted = [];
        $skipped = [];
        $failed = [];
        $protected = [];

        foreach ($validated['assets'] as $id) {
            $resolved = $this->library->resolve((string) $id);

            if ($resolved === null) {
                $failed[] = $id;
                continue;
            }

            if (($byId[$id]['deletable'] ?? false) === false) {
                $protected[] = $id;
                continue;
            }

            $isReferenced = (bool) ($byId[$id]['referenced'] ?? false);

            if ($isReferenced && ! $force) {
                $skipped[] = $id;
                continue;
            }

            if (File::delete($resolved['absolute'])) {
                $deleted[] = $id;
            } else {
                $failed[] = $id;
            }
        }

        $this->library->forget();

        $parts = [];

        if ($deleted !== []) {
            $parts[] = count($deleted) . ' file' . (count($deleted) === 1 ? '' : 's') . ' deleted';
        }
        if ($skipped !== []) {
            $parts[] = count($skipped) . ' still referenced — use force to remove';
        }
        if ($protected !== []) {
            $parts[] = count($protected) . ' protected file' . (count($protected) === 1 ? '' : 's') . ' skipped';
        }
        if ($failed !== []) {
            $parts[] = count($failed) . ' could not be removed';
        }

        $message = $parts === []
            ? 'Nothing was deleted.'
            : ucfirst(implode('. ', $parts)) . '.';

        return back()->with(
            $failed === [] && $skipped === [] && $protected === [] ? 'success' : 'error',
            $message
        );
    }

    /**
     * Clear the cached scan so the next load re-reads the filesystem.
     */
    public function refresh(): RedirectResponse
    {
        if (! $this->can('assets.view')) {
            return $this->deny('You do not have permission to manage assets.');
        }

        $this->library->forget();

        return back()->with('success', 'Asset list refreshed.');
    }

    private function can(string $permission): bool
    {
        $user = Auth::user();

        return $user && method_exists($user, 'hasPermission') && $user->hasPermission($permission);
    }

    private function deny(string $message): RedirectResponse
    {
        return redirect()->route('unauthorized.access')->with('error', $message);
    }
}
