<?php

namespace App\Console\Commands;

use App\Services\ContentService;
use Illuminate\Cache\Events\CacheHit;
use Illuminate\Cache\Events\CacheMissed;
use Illuminate\Cache\Events\KeyWritten;
use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

/**
 * Measures whether the frontend content cache is really serving data or whether
 * the requests still go to SQL, and how long the SQL -> Laravel -> Inertia
 * pipeline takes on the real (MySQL) database.
 *
 * Usage:
 *   php artisan dus:cache-benchmark
 *   php artisan dus:cache-benchmark --iterations=5 --json
 */
class CachePipelineBenchmark extends Command
{
    protected $signature = 'dus:cache-benchmark
        {--iterations=3 : Repetitions used to average the warm measurements}
        {--store= : Cache store to benchmark (defaults to cache.default)}
        {--json : Emit the report as JSON instead of console tables}';

    protected $description = 'Benchmark the SQL -> backend -> frontend pipeline and prove whether the cache is by-passing SQL';

    /** @var array<int, array{sql: string, ms: float}> */
    private array $queries = [];

    /** @var array<string, int> */
    private array $cacheEvents = ['hit' => 0, 'miss' => 0, 'write' => 0];

    /** @var array<string, bool> Every cache key the application has written (used to force cold reads) */
    private array $knownKeys = [];

    /** @var array<int, array<string, mixed>> */
    private array $report = [];

    public function handle(): int
    {
        $store = $this->option('store') ?: config('cache.default');
        config(['cache.default' => $store]);

        $services = app(ContentService::class);

        $this->listenForQueriesAndCacheEvents();

        $this->section('Environment');
        $this->line('  Cache store  : ' . $store . ' (prefix "' . (string) config('cache.prefix') . '")');
        $this->line('  Database     : ' . $this->databaseLabel());
        $this->line('  Cache rows   : ' . $this->cacheRowCount() . ' in the live store');

        $this->section('Content cache readers (backend -> SQL or cache)');
        $this->benchmarkReaders($services);

        $this->section('HTTP pipeline (request -> middleware -> controller -> Inertia -> response)');
        $this->benchmarkRequests();

        $this->section('Verdict');
        $this->printVerdict();

        if ($this->option('json')) {
            $this->newLine();
            $this->line(json_encode($this->report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        }

        return self::SUCCESS;
    }

    private function listenForQueriesAndCacheEvents(): void
    {
        DB::listen(function ($query) {
            $this->queries[] = ['sql' => $query->sql, 'ms' => (float) $query->time];
        });

        Event::listen(CacheHit::class, fn () => $this->cacheEvents['hit']++);
        Event::listen(CacheMissed::class, fn () => $this->cacheEvents['miss']++);
        Event::listen(KeyWritten::class, function (KeyWritten $event) {
            $this->cacheEvents['write']++;
            $this->knownKeys[$event->key] = true;
        });
    }

    private function benchmarkReaders(ContentService $services): void
    {
        $readers = [
            'getPage("home")' => ['page.home', fn () => $services->getPage('home')],
            'getPageSections("home")' => ['sections.home', fn () => $services->getPageSections('home')],
            'getSharedData("banner")' => ['shared.banner', fn () => $services->getSharedData('banner')],
            'getSharedData("topbar")' => ['shared.topbar', fn () => $services->getSharedData('topbar')],
            'getBlogs()' => ['blogs.all.all', fn () => $services->getBlogs()],
            'getPrograms()' => ['programs.all.all', fn () => $services->getPrograms()],
            'getPublications()' => ['publications.all.all', fn () => $services->getPublications()],
            'getJobs()' => ['jobs.5', fn () => $services->getJobs()],
        ];

        $rows = [];

        foreach ($readers as $label => [$key, $reader]) {
            Cache::forget($key);
            $cold = $this->measure($reader);
            $warm = $this->measureAverage($reader, (int) $this->option('iterations'));

            $rows[] = [
                $label,
                number_format($cold['ms'], 3),
                (string) $cold['sql'],
                number_format($warm['ms'], 3),
                (string) $warm['sql'],
                (string) $warm['hits'],
                $warm['sql'] === 0 ? 'CACHE' : 'SQL',
            ];

            $this->report['readers'][] = [
                'reader' => $label,
                'cache_key' => $key,
                'cold_ms' => $cold['ms'],
                'cold_sql' => $cold['sql'],
                'warm_ms' => $warm['ms'],
                'warm_sql' => $warm['sql'],
                'warm_cache_hits' => $warm['hits'],
                'iterations' => $warm['iterations'],
            ];
        }

        $this->table(
            ['ContentService reader', 'Cold ms', 'Cold SQL', 'Warm ms', 'Warm SQL', 'Cache hits', 'Data from'],
            $rows
        );
    }

    private function benchmarkRequests(): void
    {
        $uris = ['/', '/sitemap', '/data/pages.json', '/api/pages', '/data/navigation.json'];
        $rows = [];
        $warmQueries = [];

        foreach ($uris as $uri) {
            // Warm up once so every cache key the route writes is known, then purge them all.
            $this->measure(fn () => $this->dispatch($uri));
            $this->purgeKnownKeys();

            $cold = $this->measure(fn () => $this->dispatch($uri));
            $warm = $this->measureAverage(fn () => $this->dispatch($uri), (int) $this->option('iterations'));

            $warmQueries[$uri] = array_column($warm['queries'], 'sql');

            $rows[] = [
                $uri,
                (string) $cold['status'],
                number_format($cold['ms'], 2),
                (string) $cold['sql'],
                number_format($warm['ms'], 2),
                (string) $warm['sql'],
                $warm['hits'] . ' / ' . $warm['misses'],
                $this->kilobytes($warm['bytes']),
            ];

            $this->report['requests'][] = [
                'uri' => $uri,
                'status' => $cold['status'],
                'cold_ms' => $cold['ms'],
                'cold_sql' => $cold['sql'],
                'warm_ms' => $warm['ms'],
                'warm_sql' => $warm['sql'],
                'warm_cache_hits' => $warm['hits'],
                'warm_cache_misses' => $warm['misses'],
                'payload_bytes' => $warm['bytes'],
                'warm_queries' => $warmQueries[$uri],
                'iterations' => $warm['iterations'],
            ];
        }

        $this->table(
            ['Route', 'HTTP', 'Cold ms', 'Cold SQL', 'Warm ms', 'Warm SQL', 'Hits/Misses', 'Payload'],
            $rows
        );

        $this->line('  SQL still executed on a warm request (these code paths ignore the cache):');
        foreach ($warmQueries as $uri => $queries) {
            if ($queries === []) {
                $this->line('    ' . str_pad($uri, 26) . 'none');
                continue;
            }
            foreach ($queries as $sql) {
                $this->line('    ' . str_pad($uri, 26) . '[' . $this->classifyQuery($sql) . '] ' . $this->shorten($sql));
            }
        }
    }

    private function printVerdict(): void
    {
        $coldSql = array_sum(array_column($this->report['requests'], 'cold_sql'));
        $warmSql = array_sum(array_column($this->report['requests'], 'warm_sql'));
        $hits = array_sum(array_column($this->report['requests'], 'warm_cache_hits'));
        $misses = array_sum(array_column($this->report['requests'], 'warm_cache_misses'));

        $coldTotalMs = array_sum(array_column($this->report['requests'], 'cold_ms'));
        $warmTotalMs = array_sum(array_column($this->report['requests'], 'warm_ms'));

        $this->line(sprintf('  Requests measured         : %d', count($this->report['requests'])));
        $this->line(sprintf('  SQL statements cold -> warm: %d -> %d', $coldSql, $warmSql));
        $this->line(sprintf('  Cache hits / misses (warm) : %d / %d', $hits, $misses));
        $this->line(sprintf('  Total time cold -> warm    : %.2f ms -> %.2f ms', $coldTotalMs, $warmTotalMs));

        if ($hits > 0 && $warmSql < $coldSql) {
            $this->info('  Cache is WORKING: warm requests are served mostly from the cache store.');
        } elseif ($hits === 0) {
            $this->error('  Cache is NOT working: no cache hit was recorded while warming the requests.');
        }

        if ($warmSql > 0) {
            $this->warn('  ' . $warmSql . ' SQL statement(s) still run on every warm request - see the list above.');
        }

        $warmQueries = array_merge(...array_values(array_column($this->report['requests'], 'warm_queries')) ?: [[]]);
        $byCategory = [];

        foreach ($warmQueries as $sql) {
            $category = $this->classifyQuery($sql);
            $byCategory[$category] = ($byCategory[$category] ?? 0) + 1;
        }

        $this->line('  Warm SQL by category:');
        foreach ($byCategory as $category => $count) {
            $this->line(sprintf('    %-26s %d', $category, $count));
        }

        $this->report['verdict'] = [
            'cold_sql' => $coldSql,
            'warm_sql' => $warmSql,
            'warm_sql_by_category' => $byCategory,
            'warm_cache_hits' => $hits,
            'warm_cache_misses' => $misses,
            'cold_total_ms' => round($coldTotalMs, 3),
            'warm_total_ms' => round($warmTotalMs, 3),
        ];
    }

    /* ==========================================
       MEASUREMENT HELPERS
       ========================================== */

    private function measure(callable $callback): array
    {
        $this->queries = [];
        $this->cacheEvents = ['hit' => 0, 'miss' => 0, 'write' => 0];

        $startedAt = hrtime(true);
        $result = $callback();
        $elapsedMs = (hrtime(true) - $startedAt) / 1_000_000;
        $queries = $this->queries;

        return [
            'result' => $result,
            'ms' => round($elapsedMs, 3),
            'sql' => count($queries),
            'hits' => $this->cacheEvents['hit'],
            'misses' => $this->cacheEvents['miss'],
            'writes' => $this->cacheEvents['write'],
            'queries' => $queries,
            'status' => is_array($result) ? ($result['status'] ?? null) : null,
            'bytes' => is_array($result) ? ($result['bytes'] ?? 0) : 0,
        ];
    }

    private function measureAverage(callable $callback, int $iterations): array
    {
        $iterations = max($iterations, 1);
        $totalMs = 0.0;
        $last = null;

        for ($i = 0; $i < $iterations; $i++) {
            $last = $this->measure($callback);
            $totalMs += $last['ms'];
        }

        $last['ms'] = round($totalMs / $iterations, 3);
        $last['iterations'] = $iterations;

        return $last;
    }

    /** Dispatch a request through the real HTTP kernel (the same stack the browser triggers). */
    private function dispatch(string $uri): array
    {
        $kernel = app(Kernel::class);
        $request = Request::create($uri, 'GET');

        $response = $kernel->handle($request);
        $result = [
            'status' => $response->getStatusCode(),
            'bytes' => strlen($response->getContent()),
        ];

        $kernel->terminate($request, $response);

        return $result;
    }

    private function purgeKnownKeys(): void
    {
        // Keys the application wrote while warming the route up.
        $keys = array_keys($this->knownKeys);
        $this->knownKeys = [];

        // Keys left behind by earlier traffic (a warmed page never rewrites them,
        // so they would otherwise survive and fake a "cold" measurement).
        if (config('cache.default') === 'database') {
            $prefix = (string) config('cache.prefix');
            $stored = DB::table(config('cache.stores.database.table', 'cache'))->pluck('key')->all();

            foreach ($stored as $storedKey) {
                $bare = $prefix !== '' && str_starts_with($storedKey, $prefix)
                    ? substr($storedKey, strlen($prefix))
                    : $storedKey;

                if ($this->looksLikeContentKey($bare)) {
                    $keys[] = $bare;
                }
            }
        }

        foreach (array_unique($keys) as $key) {
            Cache::forget($key);
        }
    }

    private function looksLikeContentKey(string $key): bool
    {
        foreach (['page.', 'sections.', 'section_data.', 'shared.', 'blogs.', 'blog.', 'programs.', 'program.', 'publications.',
                  'publication.', 'jobs.', 'about.', 'custom.', 'page_sections_', 'frontend_shared_data', 'sitemap_urls', 'api_'] as $prefix) {
            if (str_starts_with($key, $prefix)) {
                return true;
            }
        }

        return false;
    }

    /* ==========================================
       OUTPUT HELPERS
       ========================================== */

    private function section(string $title): void
    {
        $this->newLine();
        $this->line('== ' . $title . ' ' . str_repeat('=', max(0, 78 - strlen($title))));
    }

    private function databaseLabel(): string
    {
        $connection = config('database.default');

        return $connection . ' @ ' . config("database.connections.{$connection}.host", 'n/a')
            . '/' . config("database.connections.{$connection}.database", 'n/a');
    }

    private function cacheRowCount(): int
    {
        if (config('cache.default') !== 'database') {
            return 0;
        }

        return (int) DB::table(config('cache.stores.database.table', 'cache'))->count();
    }

    private function kilobytes(int $bytes): string
    {
        return $bytes < 1024 ? $bytes . ' B' : round($bytes / 1024, 1) . ' KB';
    }

    /**
     * Tell infrastructure traffic (session + cache store + rate limiter) apart
     * from content queries that still hit the domain tables.
     */
    private function classifyQuery(string $sql): string
    {
        $normalized = strtolower($sql);

        if (str_contains($normalized, 'from `cache`') || str_contains($normalized, 'into `cache`')
            || str_contains($normalized, 'update `cache`') || str_contains($normalized, 'from cache where')
            || str_contains($normalized, 'cache` set')) {
            return 'cache store I/O';
        }

        if (str_contains($normalized, '`sessions`')) {
            return 'session I/O';
        }

        if (str_contains($normalized, '`jobs`') || str_contains($normalized, '`failed_jobs`')) {
            return 'queue I/O';
        }

        return 'content query (uncached path)';
    }

    private function shorten(string $sql): string
    {
        return substr((string) preg_replace('/\s+/', ' ', $sql), 0, 130);
    }
}
