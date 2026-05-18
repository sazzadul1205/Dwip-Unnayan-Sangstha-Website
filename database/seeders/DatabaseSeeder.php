<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ==========================================
        // STEP 1: Base data (no dependencies)
        // ==========================================
        $this->call([
            LocationSeeder::class,
            JobCategorySeeder::class,
        ]);

        // ==========================================
        // STEP 2: Create users (no RBAC yet)
        // ==========================================
        $this->call(UserSeeder::class);

        // ==========================================
        // STEP 3: Assign roles to users (RBAC FIRST!)
        // This must run BEFORE any seeder that needs role information
        // ==========================================
        $this->call(RBACSeeder::class);

        // ==========================================
        // STEP 4: Create profiles (after roles are assigned)
        // ==========================================
        $this->call(ApplicantProfileSeeder::class);

        // ==========================================
        // STEP 5: Create job listings
        // ==========================================
        $this->call(JobListingSeeder::class);
        $this->call(JobListingLocationSeeder::class);

        // ==========================================
        // STEP 6: Create user history/data
        // ==========================================
        $this->call(JobHistorySeeder::class);
        $this->call(EducationHistorySeeder::class);
        $this->call(AchievementSeeder::class);

        // ==========================================
        // STEP 7: Create applications (needs roles to identify job seekers)
        // ==========================================
        $this->call(ApplicationSeeder::class);
        $this->call(StatusTimelineSeeder::class);
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
    }
}
