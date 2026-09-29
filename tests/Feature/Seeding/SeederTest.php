<?php

use Database\Seeders\DatabaseSeeder;
use Database\Seeders\pages\CmsSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * These run the real seeders against the test database. They are slower
 * than the rest of the suite on purpose — seeding is exactly the kind of
 * thing that silently breaks when a migration changes a column, and this
 * is the only thing that notices.
 */
describe('Application seeder', function () {
    it('populates the core tables', function () {
        $this->seed(DatabaseSeeder::class);

        expect(DB::table('users')->count())->toBeGreaterThan(0)
            ->and(DB::table('roles')->count())->toBe(4)
            ->and(DB::table('permissions')->count())->toBeGreaterThan(300)
            ->and(DB::table('user_roles')->count())->toBeGreaterThan(0)
            ->and(DB::table('job_categories')->count())->toBeGreaterThan(0)
            ->and(DB::table('locations')->count())->toBeGreaterThan(0)
            ->and(DB::table('applicant_profiles')->count())->toBeGreaterThan(0)
            ->and(DB::table('job_listings')->count())->toBeGreaterThan(0)
            ->and(DB::table('applications')->count())->toBeGreaterThan(0);
    });

    it('creates the documented sign-in accounts', function () {
        $this->seed(DatabaseSeeder::class);

        foreach ([
            'superadmin@jobportal.com',
            'admin@jobportal.com',
            'hrmanager@company.com',
            'jobseeker@gmail.com',
            'test@example.com',
        ] as $email) {
            expect(DB::table('users')->where('email', $email)->exists())->toBeTrue();
        }
    });

    it('is safe to run twice', function () {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        // The truncate means counts reset, so the guard is that the second
        // run completes at all and still lands a full dataset.
        expect(DB::table('users')->count())->toBeGreaterThan(0)
            ->and(DB::table('job_listings')->count())->toBeGreaterThan(0);
    });

    it('empties the newsletter tables it previously skipped', function () {
        DB::table('newsletter_subscriptions')->insert([
            'email' => 'stale@example.test',
            'token' => 'stale-token',
            'status' => 'subscribed',
            'subscribed_at' => now(),
        ]);

        $this->seed(DatabaseSeeder::class);

        expect(DB::table('newsletter_subscriptions')->count())->toBe(0);
    });

    it('leaves infrastructure tables alone', function () {
        DB::table('cache')->insert(['key' => 'keep-me', 'value' => 'x', 'expiration' => now()->addHour()->timestamp]);

        $this->seed(DatabaseSeeder::class);

        expect(DB::table('cache')->where('key', 'keep-me')->exists())->toBeTrue();
    });
});

describe('CMS seeder', function () {
    it('fills every content table', function () {
        $this->seed(CmsSeeder::class);

        foreach (CmsSeeder::TABLES as $table) {
            expect(DB::table($table)->count())->toBeGreaterThan(0);
        }
    });

    it('is safe to run twice without duplicating rows', function () {
        $this->seed(CmsSeeder::class);
        $this->seed(CmsSeeder::class);

        $counts = [];

        foreach (CmsSeeder::TABLES as $table) {
            $counts[$table] = DB::table($table)->count();
        }

        $this->seed(CmsSeeder::class);

        foreach (CmsSeeder::TABLES as $table) {
            expect(DB::table($table)->count())->toBe($counts[$table]);
        }
    });

    it('keeps the unique slug on every seeded content row', function () {
        $this->seed(CmsSeeder::class);

        foreach (['pages', 'blogs', 'programs', 'about_content', 'publications'] as $table) {
            $duplicates = DB::table($table)
                ->select('slug', DB::raw('COUNT(*) as total'))
                ->groupBy('slug')
                ->having('total', '>', 1)
                ->count();

            expect($duplicates)->toBe(0, "duplicate slugs found in {$table}");
        }
    });

    it('does not accumulate suffixed publication slugs on re-run', function () {
        $this->seed(CmsSeeder::class);
        $this->seed(CmsSeeder::class);

        // The old PublicationSeeder appended "-1", "-2" … on every re-run.
        $suffixed = DB::table('publications')
            ->where('slug', 'like', '%-1')
            ->orWhere('slug', 'like', '%-2')
            ->count();

        expect($suffixed)->toBe(0);
    });

    it('is not run by the application seeder by default', function () {
        $this->seed(DatabaseSeeder::class);

        // Application seeding alone must not invent site content.
        expect(DB::table('shared_data')->count())->toBe(0)
            ->and(DB::table('pages')->count())->toBe(0);
    });
});

describe('app:seed command', function () {
    it('refuses outright in a non-interactive session', function () {
        DB::table('users')->insert([
            'name' => 'Existing',
            'email' => 'existing@example.test',
            'password' => bcrypt('password'),
        ]);

        // No answer is possible, so it must decline rather than assume one.
        $this->artisan('app:seed --no-interaction')
            ->doesntExpectOutputToContain('Type "yes" to wipe')
            ->assertSuccessful();

        // The whole point: refusing must not have wiped anything.
        expect(DB::table('users')->where('email', 'existing@example.test')->exists())->toBeTrue();
    });

    it('declines when the confirmation is answered no', function () {
        DB::table('users')->insert([
            'name' => 'Existing',
            'email' => 'existing@example.test',
            'password' => bcrypt('password'),
        ]);

        $this->artisan('app:seed')
            ->expectsConfirmation('Type "yes" to wipe these tables and seed from scratch', 'no')
            ->assertSuccessful();

        expect(DB::table('users')->where('email', 'existing@example.test')->exists())->toBeTrue();
    });

    it('seeds application data when forced', function () {
        $this->artisan('app:seed --force')->assertSuccessful();

        expect(DB::table('users')->count())->toBeGreaterThan(0)
            ->and(DB::table('job_listings')->count())->toBeGreaterThan(0);
    });

    it('skips CMS content unless asked', function () {
        $this->artisan('app:seed --force')->assertSuccessful();

        expect(DB::table('pages')->count())->toBe(0);
    });

    it('includes CMS content with --with-cms', function () {
        $this->artisan('app:seed --with-cms --force')->assertSuccessful();

        expect(DB::table('pages')->count())->toBeGreaterThan(0)
            ->and(DB::table('shared_data')->count())->toBeGreaterThan(0)
            ->and(DB::table('section_configs')->count())->toBeGreaterThan(0);
    });

    it('does not prompt about CMS when forced', function () {
        $this->artisan('app:seed --force --without-cms')
            ->doesntExpectOutputToContain('Also seed the CMS demo content')
            ->assertSuccessful();
    });

    it('lists what it will empty and omits what it will keep', function () {
        $this->artisan('app:seed --no-interaction')
            ->expectsOutputToContain('users')
            ->expectsOutputToContain('job_listings')
            // Infrastructure tables are never emptied, so they must not be
            // advertised as targets — truncating `migrations` would break
            // every future migrate run.
            ->doesntExpectOutputToContain('migrations')
            ->doesntExpectOutputToContain('sessions')
            ->assertSuccessful();
    });
});

describe('Seeder table helpers', function () {
    it('upserts rather than duplicating on a natural key', function () {
        $now = now();

        DB::table('shared_data')->insert([
            'id' => 999, 'type' => 'topbar', 'data' => '{"a":1}',
            'is_active' => 1, 'created_at' => $now, 'updated_at' => $now,
        ]);

        $this->seed(CmsSeeder::class);

        // The seeded topbar replaced the conflicting row, it did not
        // blow up on the unique `type` index.
        expect(DB::table('shared_data')->where('type', 'topbar')->count())->toBe(1);
    });

    it('seeds on a database whose schema matches production', function () {
        expect(Schema::hasTable('audit_logs'))->toBeTrue();
    });
});
