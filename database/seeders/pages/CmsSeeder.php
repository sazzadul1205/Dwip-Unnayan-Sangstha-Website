<?php
// database/seeders/pages/CmsSeeder.php

namespace Database\Seeders\pages;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================
 *  CMS SEEDER
 * ============================================================
 *
 * Runs the demo site content as one unit, in dependency order:
 * pages first, then the section configuration that points at them, then
 * the data those sections render.
 *
 * Kept separate from DatabaseSeeder on purpose. The CMS tables hold
 * hand-written demo content for the public site, while the rest is
 * accounts and jobs for exercising the application. Most people seeding
 * a fresh environment only want the latter, and some environments have
 * real content in those tables that must not be touched.
 *
 * Every seeder here upserts on its table's natural key, so this whole
 * group is safe to re-run.
 */
class CmsSeeder extends Seeder
{
    /**
     * Tables this group owns, in the order they must be emptied first
     * when a caller wants a clean slate.
     *
     * @var array<int, string>
     */
    public const TABLES = [
        'custom_section_data',
        'section_configs',
        'shared_data',
        'about_content',
        'blogs',
        'programs',
        'publications',
        'pages',
    ];

    /**
     * Human labels matching TABLES, for the run summary.
     *
     * @var array<int, string>
     */
    private const TABLE_LABELS = [
        'section payloads',
        'section configs',
        'shared data',
        'about',
        'blogs',
        'programs',
        'publications',
        'pages',
    ];

    public function run(): void
    {
        $this->command->info('── CMS demo content ──');

        $steps = [
            PagesTableSeeder::class,
            SectionConfigsTableSeeder::class,
            CustomSectionDataTableSeeder::class,
            SharedDataTableSeeder::class,
            AboutContentTableSeeder::class,
            BlogsTableSeeder::class,
            ProgramsTableSeeder::class,
            PublicationSeeder::class,
        ];

        foreach ($steps as $seeder) {
            $this->call($seeder);
        }

        $summary = [];

        foreach (self::TABLES as $index => $table) {
            $summary[] = sprintf('%s: %d', self::TABLE_LABELS[$index], DB::table($table)->count());
        }

        $this->command->info('CMS content — ' . implode(', ', $summary) . '.');
    }
}
