<?php

namespace Tests\Support;

use App\Models\Role;
use App\Models\User;
use App\Models\ApplicantProfile;
use App\Models\JobCategory;
use App\Models\Location;
use App\Models\JobListing;
use App\Models\pages\Page;
use App\Models\pages\Blog;
use App\Models\pages\Program;
use App\Models\pages\Publication;
use App\Models\pages\AboutContent;
use App\Models\pages\SharedData;

trait RouteTestHelpers
{
    protected function createAdminUser(): User
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $adminRole = Role::firstOrCreate(
            ['slug' => 'super-admin'],
            ['name' => 'Super Admin', 'level' => 1000, 'is_active' => true]
        );

        $user->roles()->attach($adminRole->id);

        return $user->fresh();
    }

    protected function createJobSeekerUser(): User
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $seekerRole = Role::firstOrCreate(
            ['slug' => 'job-seeker'],
            ['name' => 'Job Seeker', 'level' => 10, 'is_active' => true]
        );

        $user->roles()->attach($seekerRole->id);

        return $user->fresh();
    }

    protected function createJobSeekerWithProfile(): User
    {
        $user = $this->createJobSeekerUser();

        ApplicantProfile::factory()->create([
            'user_id' => $user->id,
            'first_name' => 'Test',
            'last_name' => 'User',
            'phone' => '1234567890',
        ]);

        return $user->fresh();
    }

    protected function createCategory(): JobCategory
    {
        return JobCategory::factory()->create();
    }

    protected function createLocation(): Location
    {
        return Location::factory()->create();
    }

    protected function createJobListing(): JobListing
    {
        return JobListing::factory()->create();
    }

    protected function createPage(): Page
    {
        return Page::factory()->create();
    }

    protected function createBlog(): Blog
    {
        return Blog::factory()->create();
    }

    protected function createProgram(): Program
    {
        return Program::factory()->create();
    }

    protected function createPublication(): Publication
    {
        return Publication::factory()->create();
    }

    protected function createAboutContent(): AboutContent
    {
        return AboutContent::factory()->create();
    }

    protected function createSharedData(string $type = 'banner'): SharedData
    {
        return SharedData::factory()->create([
            'type' => $type,
        ]);
    }
}
