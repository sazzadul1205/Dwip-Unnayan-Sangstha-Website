<?php

namespace App\Console\Commands;

use App\Services\CurrentDatabaseTables;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\pages\CmsSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================
 *  APP:SEED
 * ============================================================
 *
 * The safe way to populate a development database.
 *
 * Seeding is destructive — it empties every table it owns — so this
 * command states plainly what is about to happen and refuses to run
 * without an answer. It also makes the CMS demo content an explicit
 * choice, because "do I want the demo pages?" is not a question anyone
 * wants to answer by reading a seeder.
 */
class SeedApplication extends Command
{
    protected $signature = 'app:seed
                            {--with-cms : Also seed the CMS demo content (pages, sections, blogs, programs, publications)}
                            {--without-cms : Skip CMS demo content even if you are asked}
                            {--fresh : Run migrate:fresh first, dropping every table and rebuilding the schema}
                            {--wipe-content : Also erase existing site content (implied by --with-cms)}
                            {--force : Skip the confirmation prompt (for scripts and CI)}';

    protected $description = 'Seed the application database (destructive — asks for confirmation first)';

    public function handle(): int
    {
        $this->warnAboutProduction();

        if (!$this->confirmDestructiveAction()) {
            $this->components->info('Cancelled. Nothing was changed.');

            return self::SUCCESS;
        }

        $withCms = $this->resolveCmsChoice();

        // Asking for the demo CMS content means replacing whatever is there,
        // so it implies wiping site content.
        $wipeContent = $this->option('wipe-content') || $withCms;

        // The flag is static so it survives the nested Artisan::call(). Restore
        // it afterwards: a long-lived worker (Octane, queue) would otherwise
        // keep wiping site content on the next, unrelated seed.
        $previousWipe = DatabaseSeeder::isWipeContent();
        DatabaseSeeder::setWipeContent($wipeContent);

        try {
            return $this->runSeeders($withCms);
        } finally {
            DatabaseSeeder::setWipeContent($previousWipe);
        }
    }

    private function runSeeders(bool $withCms): int
    {
        $this->newLine();
        $this->components->info('Seeding ' . DB::connection()->getDatabaseName());
        $this->newLine();

        if ($this->option('fresh')) {
            $this->components->task('Rebuilding the schema', function (): bool {
                Artisan::call('migrate:fresh', ['--force' => true], $this->getOutput());

                return true;
            });
        }

        $this->components->task('Seeding application data', function (): bool {
            Artisan::call('db:seed', [
                '--class' => DatabaseSeeder::class,
                '--force' => true,
            ], $this->getOutput());

            return true;
        });

        if ($withCms) {
            $this->components->task('Seeding CMS demo content', function (): bool {
                Artisan::call('db:seed', [
                    '--class' => CmsSeeder::class,
                    '--force' => true,
                ], $this->getOutput());

                return true;
            });
        } else {
            $this->components->info('CMS demo content skipped — existing site content was left in place.');
        }

        $this->newLine();
        $this->reportOutcome($withCms);

        return self::SUCCESS;
    }

    /**
     * Show exactly which tables are about to be emptied.
     */
    private function confirmDestructiveAction(): bool
    {
        $withCms = (bool) $this->option('with-cms');
        $wipeContent = (bool) $this->option('wipe-content') || $withCms;
        $tables = $this->destructiveTables($wipeContent);

        $this->newLine();
        $this->components->warn('This will ERASE the demo data in the current database.');
        $this->newLine();

        if ($wipeContent) {
            $this->components->error('Site content (pages, sections, blogs, programs, publications) WILL BE ERASED.');
        } else {
            $this->components->info('Site content (pages, sections, blogs, programs, publications) is PRESERVED.');
        }

        $this->newLine();
        $this->table(['About to be emptied'], array_map(fn (string $t) => [$t], $tables));
        $this->newLine();

        if (! $this->input->isInteractive()) {
            $this->components->warn('Non-interactive session — pass --force to proceed.');

            return false;
        }

        if ($this->option('force')) {
            return true;
        }

        return $this->confirm('Type "yes" to wipe these tables and seed from scratch', false);
    }

    /**
     * Whether CMS demo content should be seeded.
     */
    private function resolveCmsChoice(): bool
    {
        if ($this->option('without-cms')) {
            return false;
        }

        if ($this->option('with-cms')) {
            return true;
        }

        // --force means "don't prompt me", not "prompt me about something
        // else": a CI script would otherwise hang on this question.
        if ($this->option('force') || ! $this->input->isInteractive()) {
            return false;
        }

        return $this->confirm('Also seed the CMS demo content (pages, sections, blogs, programs, publications)?', false);
    }

    /**
     * Tables the seeder will empty, i.e. everything except infrastructure
     * and — unless content is being wiped — the CMS content tables.
     *
     * @return array<int, string>
     */
    private function destructiveTables(bool $wipeContent): array
    {
        $preserved = [
            'migrations', 'cache', 'cache_locks', 'sessions',
            'jobs', 'job_batches', 'failed_jobs',
            'password_reset_tokens', 'personal_access_tokens',
        ];

        $content = $wipeContent ? [] : DatabaseSeeder::CONTENT_TABLES;

        return collect(CurrentDatabaseTables::names())
            ->reject(fn (string $table) => in_array($table, $preserved, true) || in_array($table, $content, true))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * A production database is never a place to run a demo seeder.
     */
    private function warnAboutProduction(): void
    {
        if (app()->environment('production') && ! $this->option('force')) {
            $this->components->error('This looks like production. Refusing to seed without --force.');

            exit(self::FAILURE);
        }
    }

    private function reportOutcome(bool $withCms): void
    {
        $this->components->info('Done. Sign in with:');
        $this->newLine();
        $this->table(
            ['Role', 'Email', 'Password'],
            [
                ['Super admin', 'superadmin@jobportal.com', 'password'],
                ['Admin', 'admin@jobportal.com', 'password'],
                ['HR manager', 'hrmanager@company.com', 'password'],
                ['Job seeker', 'jobseeker@gmail.com', 'password'],
            ]
        );

        $this->newLine();

        if (! $withCms) {
            $this->components->warn('No demo site content was added — your existing pages and sections are untouched.');
        }
    }
}
