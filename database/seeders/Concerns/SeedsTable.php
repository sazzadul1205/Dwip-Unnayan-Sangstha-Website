<?php

namespace Database\Seeders\Concerns;

use Illuminate\Support\Facades\DB;

/**
 * Makes a seeder safe to run more than once.
 *
 * Most of the CMS seeders hold a literal array of demo content and used to
 * `insert()` it, which meant a second run died on a duplicate key. Seeding
 * is a thing people re-run constantly while iterating, so every seeder
 * upserts on its table's natural key instead.
 *
 * Each table is keyed on the unique index it already declares:
 *   pages / blogs / programs / about_content / publications -> slug
 *   shared_data                                              -> type
 *   section_configs / custom_section_data                    -> page_slug + section_key
 */
trait SeedsTable
{
    /**
     * Upsert rows in chunks, updating every column that is not the key.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, string>  $key
     */
    protected function seedTable(string $table, array $rows, array $key): void
    {
        if ($rows === []) {
            return;
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            $update = array_values(array_diff(array_keys($chunk[0]), $key));

            DB::table($table)->upsert($chunk, $key, $update);
        }
    }
}
