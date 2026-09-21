<?php

use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

uses(Tests\TestCase::class)->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Performance measurement helpers
|--------------------------------------------------------------------------
| These helpers are used by the cache pipeline tests to answer three
| questions in a measurable way:
|
|   1. How long does the call take (wall clock, milliseconds)?
|   2. How many SQL statements hit the database?
|   3. Is the value still being served after the row is removed from SQL?
|      (the strongest possible proof that no SQL was touched)
*/

/**
 * Run a callback while recording wall-clock time and every SQL statement
 * executed on the default database connection.
 *
 * @return array{result: mixed, ms: float, queries: array<int, string>, count: int}
 */
function measureCall(callable $callback): array
{
    DB::flushQueryLog();
    DB::enableQueryLog();

    $startedAt = hrtime(true);
    $result = $callback();
    $elapsedMs = (hrtime(true) - $startedAt) / 1_000_000;

    $queries = array_map(
        static fn (array $entry): string => $entry['query'],
        DB::getQueryLog()
    );

    DB::disableQueryLog();
    DB::flushQueryLog();

    return [
        'result' => $result,
        'ms' => round($elapsedMs, 3),
        'queries' => $queries,
        'count' => count($queries),
    ];
}

/**
 * Run the same callable $runs times and return the average wall-clock
 * milliseconds and average SQL statement count.
 *
 * @return array{result: mixed, ms: float, count: float, runs: int}
 */
function averageCall(callable $callback, int $runs = 3): array
{
    $runs = max($runs, 1);
    $totalMs = 0.0;
    $totalQueries = 0;
    $result = null;

    for ($i = 0; $i < $runs; $i++) {
        $measurement = measureCall($callback);
        $totalMs += $measurement['ms'];
        $totalQueries += $measurement['count'];
        $result = $measurement['result'];
    }

    return [
        'result' => $result,
        'ms' => round($totalMs / $runs, 3),
        'count' => round($totalQueries / $runs, 2),
        'runs' => $runs,
    ];
}

/**
 * Print a compact cold/warm/uncached comparison line so the numbers show up
 * in the test output (written to STDERR to keep the PHPUnit reporter clean).
 *
 * @param  array{ms: float|int, count: float|int}  $cold
 * @param  array{ms: float|int, count: float|int}  $warm
 */
function reportMeasurement(string $label, array $cold, array $warm, ?array $uncached = null): void
{
    $speedUp = $warm['ms'] > 0 ? $cold['ms'] / $warm['ms'] : 0;

    $line = sprintf(
        '  %-52s cold %8.3f ms / %5s sql | warm %8.3f ms / %5s sql | x%.2f',
        $label,
        $cold['ms'],
        $cold['count'],
        $warm['ms'],
        $warm['count'],
        $speedUp
    );

    if ($uncached !== null) {
        $line .= sprintf(' | raw %8.3f ms / %5s sql', $uncached['ms'], $uncached['count']);
    }

    fwrite(STDOUT, $line . PHP_EOL);
}

/**
 * Print a single informational fact line (used for TTL / configuration probes).
 */
function reportFact(string $label, string $value): void
{
    fwrite(STDOUT, sprintf('  %-52s %s%s', $label, $value, PHP_EOL));
}

