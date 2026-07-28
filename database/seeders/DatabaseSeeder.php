<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use App\Models\User;
use Database\Seeders\RBAC\RBACSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ==========================================
        // STEP 0: DISABLE FOREIGN KEY CHECKS
        // ==========================================
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // ==========================================
        // STEP 0.1: TRUNCATE ALL TABLES IN CORRECT ORDER
        // ==========================================

        // Tables with foreign keys (truncate in reverse dependency order)
        $tables = [
            // User-related
            'user_roles',
            'role_permissions',
            'role_module_access',

            // Profile-related
            'achievements',
            'education_histories',
            'job_histories',

            // Application-related
            'status_timelines',
            'applications',

            // Job-related
            'job_views',
            'job_listing_location',
            'job_listings',

            // Core tables
            'applicant_profiles',
            'users',
            'roles',
            'permissions',
            'job_categories',
            'locations',
        ];

        foreach ($tables as $table) {
            if (DB::table($table)->exists()) {
                DB::table($table)->truncate();
                $this->command->info("Truncated: {$table}");
            }
        }

        // ==========================================
        // RE-ENABLE FOREIGN KEY CHECKS FOR SEEDING
        // ==========================================
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        // ==========================================
        // STEP 1: Base data (no dependencies)
        // ==========================================
        $this->command->info('Seeding LocationSeeder...');
        $this->call(LocationSeeder::class);

        $this->command->info('Seeding JobCategorySeeder...');
        $this->call(JobCategorySeeder::class);

        // ==========================================
        // STEP 2: Create users (no RBAC yet)
        // ==========================================
        $this->command->info('Seeding UserSeeder...');
        $this->call(UserSeeder::class);

        // ==========================================
        // STEP 3: Assign roles to users (RBAC FIRST!)
        // This must run BEFORE any seeder that needs role information
        // ==========================================
        $this->command->info('Seeding RBACSeeder...');
        $this->call(RBACSeeder::class);

        // ==========================================
        // STEP 4: Create profiles (after roles are assigned)
        // ==========================================
        $this->command->info('Seeding ApplicantProfileSeeder...');
        $this->call(ApplicantProfileSeeder::class);

        // ==========================================
        // STEP 5: Create job listings
        // ==========================================
        $this->command->info('Seeding JobListingSeeder...');
        $this->call(JobListingSeeder::class);

        $this->command->info('Seeding JobListingLocationSeeder...');
        $this->call(JobListingLocationSeeder::class);

        // ==========================================
        // STEP 6: Create user history/data
        // ==========================================
        $this->command->info('Seeding JobHistorySeeder...');
        $this->call(JobHistorySeeder::class);

        $this->command->info('Seeding EducationHistorySeeder...');
        $this->call(EducationHistorySeeder::class);

        $this->command->info('Seeding AchievementSeeder...');
        $this->call(AchievementSeeder::class);

        // ==========================================
        // STEP 7: Create applications (needs roles to identify job seekers)
        // ==========================================
        $this->command->info('Seeding ApplicationSeeder...');
        $this->call(ApplicationSeeder::class);

        $this->command->info('Seeding StatusTimelineSeeder...');
        $this->call(StatusTimelineSeeder::class);

        $this->command->info('Seeding JobViewSeeder...');
        $this->call(JobViewSeeder::class);

        // ==========================================
        // STEP 8: Clean storage directories
        // ==========================================
        Storage::disk('public')->deleteDirectory('cvs');
        Storage::disk('public')->deleteDirectory('profile_photos');
        Storage::disk('public')->deleteDirectory('applicant-cvs');
        Storage::disk('public')->deleteDirectory('applicant-photos');

        // ==========================================
        // STEP 9: Create test user
        // ==========================================
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // ==========================================
        // STEP 10: Verify data was seeded
        // ==========================================
        $this->command->info('✅ Seeding completed!');
        $this->command->info('📊 Summary:');
        $this->command->info('  - Users: ' . DB::table('users')->count());
        $this->command->info('  - Roles: ' . DB::table('roles')->count());
        $this->command->info('  - Permissions: ' . DB::table('permissions')->count());
        $this->command->info('  - Job Categories: ' . DB::table('job_categories')->count());
        $this->command->info('  - Locations: ' . DB::table('locations')->count());
        $this->command->info('  - Applicant Profiles: ' . DB::table('applicant_profiles')->count());
        $this->command->info('  - Job Listings: ' . DB::table('job_listings')->count());
        $this->command->info('  - Applications: ' . DB::table('applications')->count());
    }
}
