<?php

namespace Tests\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds the minimum CMS content required to exercise the public frontend
 * pipeline (PageController -> ContentService -> cache -> Inertia props).
 */
trait SeedsFrontendContent
{
    protected int $seededUserId = 0;

    protected int $seededCategoryId = 0;

    protected function seedFrontendContent(): static
    {
        $now = now();

        $this->seededUserId = DB::table('users')->insertGetId([
            'name' => 'Cache Pipeline Tester',
            'email' => 'cache-pipeline@example.com',
            'password' => Hash::make('password'),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->seededCategoryId = DB::table('job_categories')->insertGetId([
            'name' => 'Engineering',
            'slug' => 'engineering',
            'is_active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('pages')->insert([
            [
                'slug' => 'home',
                'name' => 'Home',
                'title' => 'Home | DUS',
                'description' => 'Home page',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'blog',
                'name' => 'Blog',
                'title' => 'Blog | DUS',
                'description' => 'Blog listing',
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('section_configs')->insert([
            [
                'page_slug' => 'home',
                'section_key' => 'hero',
                'component' => 'HomeBanner',
                'data_table' => 'shared_data',
                'data_key' => 'bannerData',
                'prop_name' => 'bannerData',
                'display_order' => 1,
                'is_enabled' => 1,
                'is_fixed_section' => 0,
                'is_special_component' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'page_slug' => 'home',
                'section_key' => 'intro',
                'component' => 'IntroSection',
                'data_table' => 'custom_section_data',
                'data_key' => 'introData',
                'prop_name' => 'introData',
                'display_order' => 2,
                'is_enabled' => 1,
                'is_fixed_section' => 0,
                'is_special_component' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'page_slug' => 'home',
                'section_key' => 'latest-jobs',
                'component' => 'LatestJobs',
                'data_table' => 'jobs',
                'data_key' => 'jobsData',
                'prop_name' => 'jobsData',
                'display_order' => 3,
                'is_enabled' => 1,
                'is_fixed_section' => 0,
                'is_special_component' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('custom_section_data')->insert([
            'page_slug' => 'home',
            'section_key' => 'intro',
            'data' => json_encode(['heading' => 'Welcome to DUS']),
            'is_active' => 1,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('shared_data')->insert([
            [
                'type' => 'banner',
                'data' => json_encode(['title' => 'Banner v1']),
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type' => 'topbar',
                'data' => json_encode(['phone' => '+8801000000000']),
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type' => 'navbar',
                'data' => json_encode(['items' => [['label' => 'Home', 'url' => '/']]]),
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type' => 'footer',
                'data' => json_encode(['copyright' => 'DUS']),
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'type' => 'stories',
                'data' => json_encode([['title' => 'Story one']]),
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('blogs')->insert([
            [
                'slug' => 'blog-one',
                'title' => 'Blog one',
                'excerpt' => 'First blog',
                'is_featured' => 0,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'blog-two',
                'title' => 'Blog two',
                'excerpt' => 'Second blog',
                'is_featured' => 1,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('programs')->insert([
            [
                'slug' => 'program-one',
                'title' => 'Program one',
                'display_order' => 1,
                'is_featured' => 0,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('publications')->insert([
            [
                'slug' => 'publication-one',
                'title' => 'Publication one',
                'is_featured' => 0,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('job_listings')->insert([
            [
                'title' => 'Field Officer',
                'slug' => 'field-officer',
                'description' => 'Field work',
                'requirements' => 'BSc',
                'job_type' => 'full-time',
                'category_id' => $this->seededCategoryId,
                'experience_level' => 'entry',
                'application_deadline' => $now->copy()->addMonth()->toDateString(),
                'views_count' => 25,
                'is_active' => 1,
                'user_id' => $this->seededUserId,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'title' => 'Program Manager',
                'slug' => 'program-manager',
                'description' => 'Manage programs',
                'requirements' => 'MBA',
                'job_type' => 'full-time',
                'category_id' => $this->seededCategoryId,
                'experience_level' => 'mid',
                'application_deadline' => $now->copy()->addMonth()->toDateString(),
                'views_count' => 10,
                'is_active' => 1,
                'user_id' => $this->seededUserId,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        return $this;
    }
}
