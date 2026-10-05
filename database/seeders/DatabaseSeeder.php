<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use App\Models\User;
use App\Services\CurrentDatabaseTables;
use Database\Seeders\RBAC\RBACSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * ============================================================
 *  APPLICATION SEEDER
 * ============================================================
 *
 * Accounts, jobs and applications — everything needed to exercise the
 * application. Demo *site content* (pages, blogs, section payloads) is
 * NOT included; run `php artisan app:seed --with-cms` for that, or seed
 * it on its own with `db:seed --class=Database\\Seeders\\pages\\CmsSeeder`.
 *
 * DESTRUCTIVE: the demo tables listed below are emptied first.
 *
 * Site content is PRESERVED. This seeder does not create the CMS content,
 * so wiping it here would leave the public site permanently empty while
 * claiming success — which is exactly what used to happen when
 * `db:seed` was run without `--with-cms`. Pass --wipe-content (or set
 * DB_SEED_WIPE_CONTENT=1) to clear site content as well.
 *
 * Prefer the `app:seed` command, which asks for confirmation, takes the
 * CMS flag, and can migrate first. This class is the underlying work and
 * assumes the caller already agreed to the wipe.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Infrastructure tables that must survive a re-seed.
     *
     * @var array<int, string>
     */
    private const PRESERVED_TABLES = [
        'migrations',
        'cache',
        'cache_locks',
        'sessions',
        'jobs',
        'job_batches',
        'failed_jobs',
        'password_reset_tokens',
        'personal_access_tokens',
    ];

    /**
     * Site content owned by the CMS. Never emptied unless the caller opts in
     * explicitly, because this seeder does not put it back.
     *
     * @var array<int, string>
     */
    public const CONTENT_TABLES = [
        'pages',
        'blogs',
        'programs',
        'publications',
        'about_content',
        'custom_section_data',
        'shared_data',
        'section_configs',
        'newsletter_subscriptions',
        'newsletter_campaigns',
        'newsletter_campaign_recipients',
    ];

    public function run(): void
    {
        $this->disableForeignKeyChecks();

        $truncated = $this->truncateApplicationTables();

        $this->enableForeignKeyChecks();

        $this->command->info(sprintf('Cleared %d tables.', $truncated));

        if (! $this->wipesContent()) {
            $this->command->comment('Site content left untouched (pass --wipe-content to clear it too).');
        }

        $this->seedReferenceData();
        $this->seedPeople();
        $this->seedRbac();
        $this->seedProfiles();
        $this->seedJobs();
        $this->seedActivity();
        $this->cleanStorage();
        $this->ensureTestUser();

        $this->printSummary();
    }

    /**
     * Whether the caller explicitly asked for site content to be destroyed too.
     */
    private function wipesContent(): bool
    {
        if (filter_var(env('DB_SEED_WIPE_CONTENT', false), FILTER_VALIDATE_BOOL)) {
            return true;
        }

        // `app:seed` forwards this through the container so the flag survives
        // the nested Artisan::call().
        return (bool) static::$wipeContent;
    }

    /** Set by SeedApplication when --wipe-content is passed. */
    protected static bool $wipeContent = false;

    public static function setWipeContent(bool $wipe): void
    {
        static::$wipeContent = $wipe;
    }

    /**
     * Read the current flag so callers can restore it afterwards.
     */
    public static function isWipeContent(): bool
    {
        return static::$wipeContent;
    }

    /* ==========================================================
     |  WIPE
     *========================================================== */

    /**
     * Empty every table that holds seed-managed demo data.
     *
     * Site content is left alone unless the caller opted in, because this
     * seeder never recreates it.
     *
     * The list is derived from the live schema rather than hardcoded, so a
     * new migration cannot be silently skipped — the previous hardcoded
     * list silently left the newsletter tables populated.
     *
     * @return int Number of tables cleared.
     */
    private function truncateApplicationTables(): int
    {
        Model::unguard();

        $cleared = 0;

        foreach ($this->seedManagedTables() as $table) {
            DB::table($table)->truncate();
            $cleared++;
        }

        Model::reguard();

        return $cleared;
    }

    /**
     * Every table in the current database except the preserved infrastructure
     * ones and — unless wiping was requested — the CMS content tables.
     *
     * @return array<int, string>
     */
    private function seedManagedTables(): array
    {
        $tables = [];

        $preserveContent = ! $this->wipesContent();

        foreach (CurrentDatabaseTables::names() as $name) {
            if (in_array($name, self::PRESERVED_TABLES, true)) {
                continue;
            }

            if ($preserveContent && in_array($name, self::CONTENT_TABLES, true)) {
                continue;
            }

            $tables[] = $name;
        }

        return $tables;
    }

    private function disableForeignKeyChecks(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        } elseif (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        }
    }

    private function enableForeignKeyChecks(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        } elseif (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    /* ==========================================================
     |  SEED STEPS
     *========================================================== */

    private function step(string $label, string $seeder): void
    {
        $this->command->info("── {$label} ──");
        $this->call($seeder);
    }

    private function seedReferenceData(): void
    {
        $this->step('Reference data', LocationSeeder::class);
        $this->step('Reference data', JobCategorySeeder::class);
    }

    private function seedPeople(): void
    {
        $this->step('Users', UserSeeder::class);
    }

    /**
     * RBAC runs before anything that reads roles.
     */
    private function seedRbac(): void
    {
        $this->step('Roles and permissions', RBACSeeder::class);
    }

    private function seedProfiles(): void
    {
        $this->step('Applicant profiles', ApplicantProfileSeeder::class);
    }

    private function seedJobs(): void
    {
        $this->step('Job listings', JobListingSeeder::class);
        $this->step('Job listing locations', JobListingLocationSeeder::class);
    }

    private function seedActivity(): void
    {
        $this->step('Work history', JobHistorySeeder::class);
        $this->step('Education history', EducationHistorySeeder::class);
        $this->step('Achievements', AchievementSeeder::class);
        $this->step('Applications', ApplicationSeeder::class);
        $this->step('Status timelines', StatusTimelineSeeder::class);
        $this->step('Job views', JobViewSeeder::class);
    }

    /**
     * Uploaded files belong to the rows that were just deleted.
     */
    private function cleanStorage(): void
    {
        foreach (['cvs', 'profile_photos', 'applicant-cvs', 'applicant-photos'] as $directory) {
            Storage::disk('public')->deleteDirectory($directory);
        }
    }

    /**
     * A predictable account to sign in with while developing.
     */
    private function ensureTestUser(): void
    {
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
    }

    private function printSummary(): void
    {
        $rows = [
            'Users' => 'users',
            'Roles' => 'roles',
            'Permissions' => 'permissions',
            'Role assignments' => 'user_roles',
            'Job categories' => 'job_categories',
            'Locations' => 'locations',
            'Applicant profiles' => 'applicant_profiles',
            'Job listings' => 'job_listings',
            'Applications' => 'applications',
        ];

        $this->command->info('Seeding complete.');

        foreach ($rows as $label => $table) {
            $this->command->info(sprintf('  %-20s %d', $label, DB::table($table)->count()));
        }
    }
}
