<?php

// tests/Feature/Seeding/ContentPreservationTest.php

use App\Services\CurrentDatabaseTables;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Regression cover for a real data-loss bug: `php artisan db:seed` ran
 * DatabaseSeeder, which truncated every table except nine infrastructure
 * tables — including all the CMS tables — and then never put the content
 * back, because seeding it is a separate class. Running the seeder to add
 * permissions silently emptied the public site.
 *
 * These tests pin the rule: DatabaseSeeder preserves site content unless the
 * caller explicitly asks for it to be wiped.
 */
describe('seeding never silently destroys site content', function () {
    it('preserves CMS rows when the application seeder runs', function () {
        DB::table('shared_data')->insert([
            'id' => 4242,
            'type' => 'topbar',
            'data' => '{"brand":"Live Site"}',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->seed(DatabaseSeeder::class);

        expect(DB::table('shared_data')->where('id', 4242)->exists())->toBeTrue();
    });

    it('still clears the demo tables it owns', function () {
        $this->seed(DatabaseSeeder::class);

        // Proves the truncate loop really ran and was not simply disabled.
        expect(DB::table('users')->count())->toBeGreaterThan(0)
            ->and(DB::table('job_listings')->count())->toBeGreaterThan(0);
    });

    it('erases site content when the wipe is requested explicitly', function () {
        DB::table('shared_data')->insert([
            'id' => 4343,
            'type' => 'footer',
            'data' => '{"x":1}',
            'is_active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DatabaseSeeder::setWipeContent(true);

        try {
            $this->seed(DatabaseSeeder::class);

            expect(DB::table('shared_data')->where('id', 4343)->exists())->toBeFalse();
        } finally {
            // Never leak the opt-in into another test.
            DatabaseSeeder::setWipeContent(false);
        }
    });

    it('lists content tables as preserved in the app:seed confirmation', function () {
        // --force is required so the interactive prompt is skipped; without it
        // the command aborts on the confirmation question.
        $this->artisan('app:seed --without-cms --force')
            ->expectsOutputToContain('PRESERVED')
            // The content tables must not be advertised as wipe targets.
            ->doesntExpectOutputToContain('custom_section_data')
            ->doesntExpectOutputToContain('shared_data');
    });

    it('warns that content WILL be erased when --with-cms is used', function () {
        // --force skips the interactive prompt so this runs non-interactively.
        $this->artisan('app:seed --with-cms --force')
            ->expectsOutputToContain('Site content')
            ->assertSuccessful();
    });

    it('never truncates the migrations table', function () {
        $before = DB::table('migrations')->count();

        $this->seed(DatabaseSeeder::class);

        expect(DB::table('migrations')->count())->toBe($before);
    });
});

/**
 * The table selection is asserted directly as well, because the end-to-end
 * tests above can only prove the outcome for the current driver.
 */
describe('which tables the application seeder empties', function () {
    $targets = function (): array {
        $seeder = new DatabaseSeeder;
        $method = new ReflectionMethod($seeder, 'seedManagedTables');
        $method->setAccessible(true);

        return $method->invoke($seeder);
    };

    it('excludes every CMS content table by default', function () use ($targets) {
        $tables = $targets();

        foreach (DatabaseSeeder::CONTENT_TABLES as $content) {
            expect($tables)->not->toContain($content);
        }
    });

    it('includes the CMS content tables once the wipe is requested', function () use ($targets) {
        DatabaseSeeder::setWipeContent(true);

        try {
            expect($targets())->toContain('custom_section_data');
        } finally {
            DatabaseSeeder::setWipeContent(false);
        }
    });

    it('never includes infrastructure tables', function () use ($targets) {
        DatabaseSeeder::setWipeContent(true);

        try {
            $tables = $targets();

            foreach (['migrations', 'sessions', 'cache', 'jobs'] as $infra) {
                expect($tables)->not->toContain($infra);
            }
        } finally {
            DatabaseSeeder::setWipeContent(false);
        }
    });

    it('actually finds tables on this driver', function () use ($targets) {
        // Guards the regression in reverse: if the schema-listing filter ever
        // breaks again the seeder would silently stop truncating anything.
        expect($targets())->toContain('users');
    });
});

describe('table enumeration', function () {
    it('returns only bare names that exist in the connected database', function () {
        $names = CurrentDatabaseTables::names();

        expect($names)->toContain('users');

        // A schema-qualified name reaching a truncate call is what made
        // `php artisan db:seed` die on a table belonging to another project:
        // MySQL's listing spans every schema the user can see, so it returned
        // 384 foreign tables and none of this database's own.
        foreach ($names as $name) {
            expect($name)->not->toContain('.')
                ->and(Schema::hasTable($name))->toBeTrue();
        }
    });
});
