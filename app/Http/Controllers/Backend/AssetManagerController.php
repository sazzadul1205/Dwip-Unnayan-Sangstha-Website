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

        // Filtering, sorting and paging happen over the cached scan rather than
        // re-reading the filesystem per page. The scan is the expensive part;
        // slicing an array of a few hundred rows is not, so a cached scan makes
        // every page after the first effectively free.
        $filters = $request->validate([
            'folder' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:50'],
            'search' => ['nullable', 'string', 'max:120'],
            'usage' => ['nullable', 'in:all,unused,referenced,unknown'],
            'sort' => ['nullable', 'in:newest,oldest,name,size,size_desc'],
            'page' => ['nullable', 'integer', 'min:1'],
            // Only the type is enforced; the value is clamped in AssetLibrary::paginate().
            // A bookmarked URL with a silly per_page should still render the
            // page rather than bounce to a validation error.
            'per_page' => ['nullable', 'integer'],
        ]);

        // An absent folder means "everything". Without this, a bare URL would filter
        // to the scan root and silently hide every nested folder.
        $filters['folder'] = $filters['folder'] ?? 'all';

        $page = $this->library->paginate($scan, $filters);

        return Inertia::render('Backend/Assets/Index', [
            // Only the current page is sent; the totals drive the pager.
            'assets' => $page['data'],
            'folders' => $scan['folders'],
            'summary' => $scan['summary'],
            'filters' => $page['filters'],
            'pagination' => $page['pagination'],
            'truncated' => $scan['truncated'],
            'contentScanned' => $scan['content_scanned'],
            'contentReliable' => $scan['content_reliable'] ?? false,
            'scanGaps' => $scan['scan_gaps'] ?? [],
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
        $unknown = [];

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

            // Deletion is the one irreversible thing on this screen, so each
            // state is handled separately rather than folded into a boolean:
            //
            //   referenced — found in use; refuse unless forced
            //   unknown    — the scan could not search everywhere (no database,
            //                a table that failed, a row cap hit), so nothing
            //                can be said about this file. Refuse even with
            //                force: the operator cannot know what they are
            //                deleting, and this is exactly the state where a
            //                live image gets destroyed by accident.
            //   unused     — searched everywhere, found nowhere; safe
            $state = (string) ($byId[$id]['usage_state'] ?? 'unknown');

            if ($state === 'unknown') {
                $unknown[] = $id;
                continue;
            }

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
        if ($unknown !== []) {
            $parts[] = count($unknown) . ' could not be checked for use — the reference scan was incomplete, so they were left alone';
        }
        if ($failed !== []) {
            $parts[] = count($failed) . ' could not be removed';
        }

        $message = $parts === []
            ? 'Nothing was deleted.'
            : ucfirst(implode('. ', $parts)) . '.';

        return back()->with(
            $failed === [] && $skipped === [] && $protected === [] && $unknown === [] ? 'success' : 'error',
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
