<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * ============================================================
 *  ASSET LIBRARY
 * ============================================================
 *
 * Reads every file under the configured roots (default:
 * storage/app/public and public/images) and describes it for the
 * admin asset manager.
 *
 * Deliberately filesystem-driven. Nothing here touches the
 * database, so the screen keeps working while the database is
 * down, mid-migration, or not yet seeded.
 *
 * "Referenced" means the file name appears in one of the project's
 * source files. Content that lives only in the database is not
 * visible to a file search, so treat the flag as a prompt to look,
 * not as proof that a file is safe to delete.
 */
class AssetLibrary
{
    private const CACHE_KEY = 'asset-library.scan.v1';

    /** Extensions that must never be deleted from this screen. */
    private const PROTECTED_NAMES = ['.gitkeep', '.gitignore', '.htaccess'];

    /**
     * Full scan: assets, folder tree, folder stats and totals.
     *
     * @return array{assets: array<int, array<string, mixed>>, folders: array<int, array<string, mixed>>, summary: array<string, mixed>, truncated: bool}
     */
    public function scan(bool $fresh = false): array
    {
        if ($fresh) {
            Cache::forget(self::CACHE_KEY);
        }

        $ttl = (int) config('asset-library.cache_ttl', 300);

        if ($ttl > 0) {
            $cached = Cache::get(self::CACHE_KEY);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $roots = $this->roots();
        $assets = [];
        $truncated = false;
        $maxFiles = (int) config('asset-library.max_files', 5000);

        foreach ($roots as $root) {
            foreach ($this->walk($root['path']) as $file) {
                if (count($assets) >= $maxFiles) {
                    $truncated = true;
                    break 2;
                }

                $assets[] = $this->describe($file, $root);
            }
        }

        // One pass over the source tree, then one lookup per asset.
        $corpus = $this->referenceCorpus();
        $contentScanned = false;

        // Stored CMS content is where an upload's name actually lives, so it is
        // worth searching. Strictly optional: any database problem degrades to a
        // code-only result instead of breaking the page.
        $content = $this->contentCorpus();

        if ($content['scanned']) {
            $contentScanned = true;
            $corpus += $content['rows'];
        }

        $alwaysReferenced = (array) config('asset-library.reference_scan.always_referenced', []);

        // Anything the content scan could not read becomes "unknown", never
        // "unused". The delete endpoint treats unknown as undeletable, so a
        // broken or truncated scan cannot turn into a live file disappearing.
        $scanGaps = $content['gaps'] ?? [];
        $contentReliable = $contentScanned && $scanGaps === [];

        foreach ($assets as $index => $asset) {
            $forced = in_array($asset['id'], $alwaysReferenced, true);
            $references = $forced ? [['source' => 'Declared in asset-library.php']] : $this->findReferences($asset['name'], $corpus);

            $isReferenced = $forced || $references !== [];

            $assets[$index]['referenced'] = $isReferenced;
            $assets[$index]['reference_count'] = count($references);
            $assets[$index]['references'] = array_slice($references, 0, 5);

            // Only an asset that was searched everywhere and found nowhere is
            // genuinely unused. Everything else is unknown.
            $assets[$index]['usage_state'] = $isReferenced
                ? 'referenced'
                : ($contentReliable ? 'unused' : 'unknown');
        }

        $result = [
            'assets' => $assets,
            'folders' => $this->folders($assets),
            'summary' => $this->summary($assets),
            'truncated' => $truncated,
            'content_scanned' => $contentScanned,
            'content_reliable' => $contentReliable,
            'scan_gaps' => $scanGaps,
            'content_reason' => $content['reason'] ?? null,
        ];

        if ($ttl > 0) {
            Cache::put(self::CACHE_KEY, $result, $ttl);
        }

        return $result;
    }

    /**
     * Absolute, real paths of every configured root that exists on disk.
     *
     * @return array<int, array{path: string, label: string, url_prefix: string}>
     */
    public function roots(): array
    {
        $roots = [];

        foreach ((array) config('asset-library.roots', []) as $root) {
            $absolute = $this->absolute((string) ($root['path'] ?? ''));

            if ($absolute === null || ! is_dir($absolute)) {
                continue;
            }

            $roots[] = [
                'path' => $absolute,
                'label' => (string) ($root['label'] ?? basename($absolute)),
                'url_prefix' => rtrim((string) ($root['url_prefix'] ?? ''), '/'),
            ];
        }

        return $roots;
    }

    /**
     * True when the given relative asset id resolves to a real file that lives
     * inside one of the roots.
     *
     * This is the single gate used by the delete endpoint, so a crafted path
     * such as "../../.env" or an absolute path can never reach the filesystem.
     */
    public function resolve(string $assetId): ?array
    {
        $assetId = trim($assetId);

        if ($assetId === '' || str_contains($assetId, "\0")) {
            return null;
        }

        foreach ($this->roots() as $root) {
            if (! str_starts_with($assetId, $root['label'] . '/')) {
                continue;
            }

            $relative = substr($assetId, strlen($root['label']) + 1);
            $candidate = $this->absolute($root['path'] . '/' . $relative);

            if ($candidate === null) {
                continue;
            }

            // Reject anything that escaped the root, including via symlink or
            // a "..' segment that only looked harmless.
            if (! str_starts_with($candidate, rtrim($root['path'], '/\\') . DIRECTORY_SEPARATOR)) {
                continue;
            }

            if (! is_file($candidate)) {
                continue;
            }

            return [
                'id' => $assetId,
                'absolute' => $candidate,
                'root' => $root,
            ];
        }

        return null;
    }

    /**
 * Filter, sort and page an already-computed scan.
 *
 * The scan is cached, so this only arranges a few hundred in-memory rows. It
 * must not touch the filesystem or the database: the point is that page two
 * costs no more than page one.
 *
 * @param  array<string, mixed>  $filters
 * @return array{data: array<int, array<string, mixed>>, filters: array<string, string>, pagination: array<string, mixed>}
 */
public function paginate(array $scan, array $filters): array
{
    $folder = trim((string) ($filters['folder'] ?? ''));
    $category = trim((string) ($filters['category'] ?? ''));
    $search = trim((string) ($filters['search'] ?? ''));
    $usage = (string) ($filters['usage'] ?? 'all');
    $sort = (string) ($filters['sort'] ?? 'newest');

    $rows = array_values(array_filter($scan['assets'], function (array $asset) use ($folder, $category, $search, $usage): bool {
        // Folder "all" is a real value here, and an empty folder means the root
        // of the scan, so the check has to be explicit either way.
        if ($folder === 'all') {
            // no folder restriction
        } elseif ($folder === '') {
            if ($asset['folder'] !== '') {
                return false;
            }
        } elseif (! str_starts_with($asset['id'], $folder . '/')) {
            return false;
        }

        if ($category !== '' && $category !== 'all' && $asset['category'] !== $category) {
            return false;
        }

        if ($usage === 'unused' && $asset['usage_state'] !== 'unused') {
            return false;
        }

        if ($usage === 'referenced' && $asset['usage_state'] !== 'referenced') {
            return false;
        }

        if ($usage === 'unknown' && $asset['usage_state'] !== 'unknown') {
            return false;
        }

        if ($search !== '') {
            $needle = mb_strtolower($search);

            if (! str_contains(mb_strtolower($asset['name']), $needle)
                && ! str_contains(mb_strtolower($asset['id']), $needle)) {
                return false;
            }
        }

        return true;
    }));

    usort($rows, match ($sort) {
        'oldest' => fn (array $a, array $b): int => $this->compareTime($a, $b) ?: ($a['name'] <=> $b['name']),
        'name' => fn (array $a, array $b): int => strnatcasecmp($a['name'], $b['name']),
        'size' => fn (array $a, array $b): int => [$a['size'], $a['name']] <=> [$b['size'], $b['name']],
        'size_desc' => fn (array $a, array $b): int => [$b['size'], $a['name']] <=> [$a['size'], $b['name']],
        default => fn (array $a, array $b): int => $this->compareTime($b, $a) ?: ($a['name'] <=> $b['name']),
    });

    $perPage = (int) ($filters['per_page'] ?? 24);
    $perPage = max(12, min($perPage, 120));
    $total = count($rows);
    $lastPage = max(1, (int) ceil($total / $perPage));
    $current = max(1, min((int) ($filters['page'] ?? 1), $lastPage));

    return [
        'data' => array_slice($rows, ($current - 1) * $perPage, $perPage),
        'filters' => [
            'folder' => $folder,
            'category' => $category,
            'search' => $search,
            'usage' => $usage === '' ? 'all' : $usage,
            'sort' => $sort,
        ],
        'pagination' => [
            'current_page' => $current,
            'last_page' => $lastPage,
            'per_page' => $perPage,
            'total' => $total,
            'from' => $total === 0 ? 0 : ($current - 1) * $perPage + 1,
            'to' => min($current * $perPage, $total),
        ],
    ];
}

private function compareTime(array $a, array $b): int
{
    return ($a['modified_at'] ?? '') <=> ($b['modified_at'] ?? '');
}

public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    // -----------------------------------------------------------------
    //  Filesystem walking
    // -----------------------------------------------------------------

    /**
     * Turn a configured (possibly relative) path into a real absolute path.
     *
     * Returns null when the path escapes the project directory, which keeps a
     * mis-edited config from walking something like C:\.
     */
    private function absolute(string $path): ?string
    {
        $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);

        // base_path() concatenates unconditionally, so an absolute path (a
        // leading separator, a "C:\" drive or a UNC share) must not be
        // re-prefixed or it would produce nonsense such as
        // "<project>\D:\Xampp\htdocs\project".
        $isAbsolute = str_starts_with($path, DIRECTORY_SEPARATOR)
            || preg_match('/^[A-Za-z]:' . preg_quote(DIRECTORY_SEPARATOR, '/') . '/', $path) === 1;

        if (! $isAbsolute) {
            $path = base_path($path);
        }

        $real = realpath($path);

        if ($real === false) {
            return null;
        }

        $base = realpath(base_path());

        return $base !== false && str_starts_with($real, $base) ? $real : null;
    }

    /**
     * Stored CMS content, as "table#id (columns)" => concatenated text.
     *
     * Never throws: an unreachable database simply yields an unscanned result so
     * the page keeps working.
     *
     * The `complete` flag is the important part. A partial scan must never be
     * presented as "unused": a reference that was not read looks exactly like a
     * reference that does not exist, and that is how a live image ends up one
     * click away from deletion.
     *
     * @return array{scanned: bool, rows: array<string, string>, reason: ?string, gaps: array<int, string>}
     */
    private function contentCorpus(): array
    {
        $settings = (array) config('asset-library.reference_scan.database', []);

        if (($settings['enabled'] ?? true) !== true) {
            return ['scanned' => false, 'rows' => [], 'reason' => 'disabled', 'gaps' => ['Content scanning is turned off in config.'],
            ];
        }

        try {
            // Fails fast and cheaply when the database is down.
            DB::connection()->getPdo();

            $tables = $this->contentTables($settings);
            $types = array_map('strtolower', (array) ($settings['column_types'] ?? []));
            $limit = (int) ($settings['max_rows_per_table'] ?? 50000);

            $rows = [];
            $gaps = [];

            foreach ($tables as $table) {
                $columns = $this->searchableColumns($table, $types);

                if ($columns === []) {
                    continue;
                }

                try {
                    $records = DB::table($table)->limit($limit + 1)->get($columns);
                } catch (Throwable $e) {
                    // One unreadable table must not silently hide every
                    // reference it held, so it is recorded as a gap.
                    $gaps[] = 'Could not read ' . $table . ': ' . $e->getMessage();

                    continue;
                }

                // Read one row past the cap to find out whether the cap was hit.
                if ($records->count() > $limit) {
                    $records = $records->take($limit);

                    $gaps[] = $table . ' has more than ' . $limit . ' rows; references after that point were not read, so files used only there may look unused.';
                }

                foreach ($records as $record) {
                    $parts = [];
                    $identifier = null;

                    foreach ((array) $record as $column => $value) {
                        if ($column === 'id') {
                            $identifier = $value;
                            continue;
                        }

                        // A JSON column can arrive as a string or, when a cast
                        // is in play, as an already-decoded array. Both forms
                        // hold file names, so neither may be skipped.
                        foreach ($this->flatten($value) as $piece) {
                            if ($piece !== '') {
                                $parts[] = $piece;
                            }
                        }
                    }

                    $text = implode(' ', $parts);

                    if ($text === '') {
                        continue;
                    }

                    $label = 'content: ' . $table . ($identifier !== null ? ' #' . $identifier : '');
                    $rows[$label] = $text;
                }
            }

            return ['scanned' => true, 'rows' => $rows, 'reason' => null, 'gaps' => $gaps];
        } catch (Throwable $e) {
            return ['scanned' => false, 'rows' => [], 'reason' => $e->getMessage(), 'gaps' => ['The database could not be reached, so no stored content was searched.'],
            ];
        }
    }

    /**
     * Flatten a stored value into searchable strings.
     *
     * JSON columns hold file names at any depth, sometimes with escaped
     * slashes ("images\/banner\/x.jpg") and sometimes URL-encoded. Each string
     * leaf is emitted as-is, and a slash-escaped copy is added so the name is
     * still found when a driver stored the payload escaped.
     *
     * @return array<int, string>
     */
    private function flatten(mixed $value): array
    {
        if ($value === null || is_bool($value)) {
            return [];
        }

        if (is_scalar($value)) {
            $text = (string) $value;

            if (trim($text) === '') {
                return [];
            }

            $pieces = [$text];

            // JSON escaped forward slashes turn "images/a.jpg" into
            // "images\/a.jpg"; the bare file name survives either way, but the
            // unescaped form makes a path match possible too.
            if (str_contains($text, '\\/')) {
                $pieces[] = str_replace('\\/', '/', $text);
            }

            return $pieces;
        }

        $pieces = [];

        foreach ((array) $value as $item) {
            foreach ($this->flatten($item) as $nested) {
                $pieces[] = $nested;
            }
        }

        return $pieces;
    }

    /** @return array<int, string> */
    private function contentTables(array $settings): array
    {
        $exclude = array_map('strtolower', (array) ($settings['exclude'] ?? []));
        $configured = $settings['tables'] ?? null;

        if (is_array($configured) && $configured !== []) {
            return array_values(array_filter(
                array_map('strval', $configured),
                fn (string $table): bool => ! in_array(strtolower($table), $exclude, true)
            ));
        }

        $names = [];

        // CurrentDatabaseTables, not Schema::getTables(): with no schema
        // argument the MySQL grammar only excludes the system schemas, so the
        // listing spans every database the account can see. That returned 384
        // tables from unrelated projects on this machine instead of 41.
        foreach (CurrentDatabaseTables::names() as $name) {
            if ($name !== '' && ! in_array(strtolower($name), $exclude, true)) {
                $names[] = $name;
            }
        }

        return $names;
    }

    /**
     * Columns to read from one table.
     *
     * An explicit list from config keeps the scan off the bulky text columns
     * that cannot hold a file name (ATS keyword dumps, employer notes), and on
     * the narrow ones that can (cv_path, photo_path, the CMS content fields).
     *
     * @return array<int, string>
     */
    private function searchableColumns(string $table, array $types): array
    {
        $configured = (array) config('asset-library.reference_scan.database.columns', []);
        $columns = [];

        if (array_key_exists($table, $configured)) {
            // Configured columns are trusted but still have to exist, so a
            // renamed column degrades to a gap rather than a silent miss.
            foreach ((array) $configured[$table] as $name) {
                $name = (string) $name;

                if ($name !== 'id' && ! Schema::hasColumn($table, $name)) {
                    continue;
                }

                $columns[] = $name;
            }

            if ($columns !== []) {
                return array_values(array_unique(array_merge(['id'], $columns)));
            }
        }

        // "id" is added unconditionally. It is not searchable text — it only labels
        // the reference as "content: pages #14" instead of "content: pages" —
        // and dropping it silently collapsed every row of a table onto one
        // label, so all but the last row became invisible to the search.
        $columns = ['id'];

        foreach (Schema::getColumns($table) as $column) {
            $name = is_array($column) ? (string) ($column['name'] ?? '') : '';
            $type = is_array($column) ? strtolower((string) ($column['type_name'] ?? '')) : '';

            // SQLite reports loose types, so an unknown type is searched too.
            if ($name !== '' && ($type === '' || in_array($type, $types, true) || str_contains($type, 'char') || str_contains($type, 'text') || str_contains($type, 'json'))) {
                $columns[] = $name;
            }
        }

        return array_values(array_unique($columns));
    }

    /**
     * @return \Generator<int, array{absolute: string, relative: string}>
     */
    private function walk(string $rootPath): \Generator
    {
        $skip = (array) config('asset-library.skip_patterns', []);

        foreach (File::allFiles($rootPath) as $file) {
            $path = $file->getPathname();

            if ($this->shouldSkip($path, $rootPath, $skip)) {
                continue;
            }

            yield [
                'absolute' => $path,
                'relative' => ltrim(str_replace($rootPath, '', $path), '/\\'),
            ];
        }
    }

    private function shouldSkip(string $path, string $rootPath, array $skip): bool
    {
        $relative = str_replace('\\', '/', ltrim(str_replace($rootPath, '', $path), '/\\'));

        foreach ($skip as $pattern) {
            if ($pattern !== '' && fnmatch($pattern, basename($relative))) {
                return true;
            }
        }

        // Dot files and editor leftovers never belong in an asset browser.
        $base = basename($relative);

        return str_starts_with($base, '.') || str_ends_with($base, '~');
    }

    // -----------------------------------------------------------------
    //  Metadata
    // -----------------------------------------------------------------

    private function describe(array $file, array $root): array
    {
        $extension = strtolower(pathinfo($file['absolute'], PATHINFO_EXTENSION));
        $size = (int) @filesize($file['absolute']);

        return [
            'id' => $root['label'] . '/' . str_replace('\\', '/', $file['relative']),
            'name' => basename($file['absolute']),
            'root' => $root['label'],
            'folder' => trim(str_replace('\\', '/', dirname(str_replace('\\', '/', $file['relative']))), '.'),
            'extension' => $extension,
            'category' => $this->category($extension),
            'size' => $size,
            'size_label' => $this->humanBytes($size),
            'modified_at' => $this->timestamp($file['absolute']),
            'modified_label' => $this->relativeTime($file['absolute']),
            'url' => $root['url_prefix'] . '/' . str_replace('\\', '/', $file['relative']),
            'dimensions' => $this->dimensions($file['absolute'], $extension),
            'deletable' => ! in_array(basename($file['absolute']), self::PROTECTED_NAMES, true),
        ];
    }

    private function category(string $extension): string
    {
        foreach ((array) config('asset-library.categories', []) as $category => $extensions) {
            if (in_array($extension, $extensions, true)) {
                return $category;
            }
        }

        return 'other';
    }

    /**
     * Width/height for raster images. SVG has no intrinsic pixel size, so its
     * viewBox or width/height attributes are read instead.
     *
     * @return array{width: int|null, height: int|null}|null
     */
    private function dimensions(string $path, string $extension)
    {
        if ($extension === 'svg') {
            return $this->svgDimensions($path);
        }

        if (! in_array($extension, (array) config('asset-library.categories.image', []), true)) {
            return null;
        }

        $info = @getimagesize($path);

        if ($info === false || empty($info[0]) || empty($info[1])) {
            return null;
        }

        return ['width' => (int) $info[0], 'height' => (int) $info[1]];
    }

    private function svgDimensions(string $path): array
    {
        $head = (string) @file_get_contents($path, false, null, 0, 2048);

        if ($head === '') {
            return ['width' => null, 'height' => null];
        }

        $viewBox = preg_match('/viewBox\s*=\s*["\']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/i', $head, $m)
            ? ['width' => (int) round((float) $m[1]), 'height' => (int) round((float) $m[2])]
            : ['width' => null, 'height' => null];

        if ($viewBox['width'] !== null) {
            return $viewBox;
        }

        $w = preg_match('/\bwidth\s*=\s*["\']\s*([\d.]+)/i', $head, $mw) ? (int) round((float) $mw[1]) : null;
        $h = preg_match('/\bheight\s*=\s*["\']\s*([\d.]+)/i', $head, $mh) ? (int) round((float) $mh[1]) : null;

        return ['width' => $w, 'height' => $h];
    }

    private function timestamp(string $path): ?string
    {
        $time = @filemtime($path);

        return $time === false ? null : date('c', $time);
    }

    private function relativeTime(string $path): string
    {
        $time = @filemtime($path);

        if ($time === false) {
            return 'unknown';
        }

        $days = (int) floor((time() - $time) / 86400);

        return match (true) {
            $days < 1 => 'today',
            $days === 1 => 'yesterday',
            $days < 30 => "{$days} days ago",
            $days < 365 => intdiv($days, 30) . ' months ago',
            default => intdiv($days, 365) . ' years ago',
        };
    }

    public function humanBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes . ' B';
        }

        $units = ['KB', 'MB', 'GB', 'TB'];
        $value = $bytes / 1024;
        $unit = 0;

        while ($value >= 1024 && $unit < count($units) - 1) {
            $value /= 1024;
            $unit++;
        }

        return round($value, $value < 10 ? 1 : 0) . ' ' . $units[$unit];
    }

    // -----------------------------------------------------------------
    //  Reference detection
    // -----------------------------------------------------------------

    /**
     * Every scannable source file, as label => contents.
     *
     * @return array<string, string>
     */
    private function referenceCorpus(): array
    {
        $config = (array) config('asset-library.reference_scan', []);
        $exclude = array_map(
            fn (string $path): string => str_replace('\\', '/', $path),
            (array) ($config['exclude'] ?? [])
        );
        $extensions = (array) ($config['extensions'] ?? []);

        $corpus = [];

        foreach ((array) ($config['paths'] ?? []) as $relative) {
            $absolute = $this->absolute((string) $relative);

            if ($absolute === null || ! is_dir($absolute)) {
                continue;
            }

            foreach (File::allFiles($absolute) as $file) {
                $path = $file->getPathname();
                $normalised = str_replace('\\', '/', $path);

                if ($this->isExcluded($normalised, $exclude)) {
                    continue;
                }

                if (! $this->hasScannableExtension($normalised, $extensions)) {
                    continue;
                }

                $contents = @file_get_contents($path);

                if ($contents === false || $contents === '') {
                    continue;
                }

                $corpus[$this->relativeLabel($normalised)] = $contents;
            }
        }

        return $corpus;
    }

    private function isExcluded(string $normalisedPath, array $exclude): bool
    {
        $base = str_replace('\\', '/', base_path()) . '/';

        foreach ($exclude as $pattern) {
            $absolutePattern = str_starts_with($pattern, '/')
                ? $pattern
                : $base . $pattern;

            if (str_contains($normalisedPath, $absolutePattern)) {
                return true;
            }
        }

        return false;
    }

    private function hasScannableExtension(string $path, array $extensions): bool
    {
        $lower = strtolower($path);

        foreach ($extensions as $extension) {
            $extension = '.' . ltrim(strtolower((string) $extension), '.');

            if ($extension === '.php' && str_ends_with($lower, '.blade.php')) {
                return true;
            }

            if (str_ends_with($lower, $extension)) {
                return true;
            }
        }

        return false;
    }

    private function relativeLabel(string $normalisedPath): string
    {
        $base = str_replace('\\', '/', base_path()) . '/';

        return str_starts_with($normalisedPath, $base)
            ? substr($normalisedPath, strlen($base))
            : $normalisedPath;
    }

    /**
     * Which source files mention this file name.
     *
     * The name is matched on a boundary so "icon.png" does not count a
     * reference inside "my-icon.png".
     *
     * @return array<int, array{source: string}>
     */
    private function findReferences(string $name, array $corpus): array
    {
        $needle = preg_quote($name, '/');
        $pattern = '/(?<![\w.-])' . $needle . '(?![\w-])/i';

        $found = [];

        foreach ($corpus as $source => $contents) {
            if (preg_match($pattern, $contents) === 1) {
                $found[] = ['source' => $source];
            }
        }

        return $found;
    }

    // -----------------------------------------------------------------
    //  Grouping and totals
    // -----------------------------------------------------------------

    private function folders(array $assets): array
    {
        $folders = [];

        foreach ($assets as $asset) {
            $key = $asset['root'] . '/' . $asset['folder'];
            $label = $asset['folder'] === '' ? $asset['root'] : $asset['root'] . '/' . $asset['folder'];

            if (! isset($folders[$key])) {
                $folders[$key] = [
                    'key' => $key,
                    'label' => $label,
                    'name' => $asset['folder'] === '' ? $asset['root'] : basename(str_replace('\\', '/', $asset['folder'])),
                    // null marks a scan root. A child of a root must carry the
                    // bare root label, because the sidebar matches parent === key.
                    'parent' => $this->parentFolder($asset),
                    'count' => 0,
                    'bytes' => 0,
                    'unused' => 0,
                    'unknown' => 0,
                ];
            }

            $folders[$key]['count']++;
            $folders[$key]['bytes'] += $asset['size'];

            // An unknown file is not "unused" even though nothing referenced it:
            // nothing looked everywhere.
            if (($asset['usage_state'] ?? 'referenced') === 'unused') {
                $folders[$key]['unused']++;
            } elseif (($asset['usage_state'] ?? 'referenced') === 'unknown') {
                $folders[$key]['unknown'] = ($folders[$key]['unknown'] ?? 0) + 1;
            }
        }

        uasort($folders, fn (array $a, array $b): int => strcasecmp($a['label'], $b['label']));

        return array_values(array_map(function (array $folder): array {
            $folder['size_label'] = $this->humanBytes($folder['bytes']);

            return $folder;
        }, $folders));
    }

    private function parentFolder(array $asset): ?string
    {
        if ($asset['folder'] === '') {
            return null;
        }

        $dir = str_replace('\\', '/', dirname(str_replace('\\', '/', $asset['folder'])));
        $dir = trim($dir, '/');

        return $dir === '' || $dir === '.' ? $asset['root'] : $asset['root'] . '/' . $dir;
    }

    private function summary(array $assets): array
    {
        $byCategory = [];
        $bytes = 0;
        $unused = 0;
        $unknown = 0;
        $unusedBytes = 0;
        $unknownBytes = 0;

        foreach ($assets as $asset) {
            $category = $asset['category'];
            $byCategory[$category] = ($byCategory[$category] ?? 0) + 1;
            $bytes += $asset['size'];

            if (($asset['usage_state'] ?? 'referenced') === 'unused') {
                $unused++;
                $unusedBytes += $asset['size'];
            } elseif (($asset['usage_state'] ?? 'referenced') === 'unknown') {
                // Counted separately: unknown is not a licence to delete, so it
                // must never inflate the "you can safely remove this" total.
                $unknown++;
                $unknownBytes += $asset['size'];
            }
        }

        return [
            'total' => count($assets),
            'bytes' => $bytes,
            'size_label' => $this->humanBytes($bytes),
            'unused' => $unused,
            'unused_bytes' => $unusedBytes,
            'unused_size_label' => $this->humanBytes($unusedBytes),
            'unknown' => $unknown,
            'unknown_size_label' => $this->humanBytes($unknownBytes),
            'referenced' => count($assets) - $unused - $unknown,
            'categories' => $byCategory,
        ];
    }
}
