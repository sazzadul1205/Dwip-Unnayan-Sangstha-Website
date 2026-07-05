<?php
// database/seeders/pages/PagesTableSeeder.php

namespace Database\Seeders\pages;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PagesTableSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'id' => 1,
                'slug' => 'home',
                'name' => 'Home',
                'title' => 'DUS - Dwip Unnayan Songstha',
                'description' => 'Community based philanthropic and development organization',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 2,
                'slug' => 'about',
                'name' => 'About',
                'title' => 'About Us - DUS',
                'description' => 'Learn about DUS, our mission, vision, and impact',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 3,
                'slug' => 'about-details',
                'name' => 'About Details',
                'title' => 'About Details - DUS',
                'description' => 'Detailed information about DUS',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 4,
                'slug' => 'projects-programs',
                'name' => 'Projects & Programs',
                'title' => 'Projects & Programs - DUS',
                'description' => 'Our projects and programs for community development',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 5,
                'slug' => 'projects-programs-details',
                'name' => 'Program Details',
                'title' => 'Program Details - DUS',
                'description' => 'Detailed program information',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 6,
                'slug' => 'blog',
                'name' => 'Blogs',
                'title' => 'Blogs - DUS',
                'description' => 'Latest news, stories, and updates from DUS',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 7,
                'slug' => 'blog-details',
                'name' => 'Blog Details',
                'title' => 'Blog Details - DUS',
                'description' => 'Blog post details',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 8,
                'slug' => 'contact',
                'name' => 'Contact',
                'title' => 'Contact Us - DUS',
                'description' => 'Get in touch with DUS',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 9,
                'slug' => 'publications',
                'name' => 'Publications',
                'title' => 'Publications - DUS',
                'description' => 'Research papers, reports, and publications from DUS',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 10,
                'slug' => 'publications-details',
                'name' => 'Publication Details',
                'title' => 'Publication Details - DUS',
                'description' => 'Detailed publication information',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            [
                'id' => 11,
                'slug' => 'gallery',
                'name' => 'Gallery',
                'title' => 'Gallery - DUS',
                'description' => 'Image and video gallery showcasing our work and impact',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            // ============================================
            // NEW: JOBS PAGE
            // ============================================
            [
                'id' => 12,
                'slug' => 'jobs',
                'name' => 'Jobs',
                'title' => 'Career Opportunities - DUS',
                'description' => 'Join our team and make a difference in coastal communities',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
            // ============================================
            // NEW: JOBS DETAILS PAGE
            // ============================================
            [
                'id' => 13,
                'slug' => 'jobs-details',
                'name' => 'Job Details',
                'title' => 'Job Details - DUS',
                'description' => 'Detailed job opportunity information',
                'is_active' => 1,
                'created_at' => '2024-01-01 00:00:00',
                'updated_at' => '2024-01-01 00:00:00',
            ],
        ];

        DB::table('pages')->insert($pages);
    }
}
