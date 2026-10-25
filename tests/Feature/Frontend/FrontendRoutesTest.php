<?php

use App\Models\pages\Page;
use App\Models\pages\CustomSectionData;
use App\Models\pages\Program;
use App\Models\pages\SectionConfig;

uses(Tests\Support\RouteTestHelpers::class);

describe('Frontend Public Routes', function () {
    it('loads the home page', function () {
        Page::factory()->create([
            'slug' => 'home',
            'name' => 'Home',
            'is_active' => true,
        ]);

        $response = $this->get('/');
        $response->assertOk();
    });

    it('loads saved detail-page banner data on program pages', function () {
        Page::factory()->create([
            'slug' => 'projects-programs',
            'name' => 'Projects and Programs',
            'is_active' => true,
        ]);
        Page::factory()->create([
            'slug' => 'projects-programs-details',
            'name' => 'Projects and Programs Details',
            'is_active' => true,
        ]);
        Program::factory()->create(['slug' => 'micro-finance']);

        SectionConfig::factory()->create([
            'page_slug' => 'projects-programs-details',
            'section_key' => 'banner',
            'component' => 'PageBannerSection',
            'data_table' => 'custom_section_data',
            'data_key' => 'bannerData',
            'prop_name' => 'data',
            'display_order' => 1,
        ]);
        CustomSectionData::create([
            'page_slug' => 'projects-programs-details',
            'section_key' => 'banner',
            'data' => [
                'background' => ['src' => '/storage/micro-finance-banner.jpg'],
                'content' => ['title' => ['text' => 'Microfinance']],
            ],
            'is_active' => true,
        ]);

        $this->get('/projects-programs/micro-finance')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Frontend/ProjectsAndProgramsDetails/ProjectsAndProgramsDetails')
                ->where('pageData.bannerData.background.src', '/storage/micro-finance-banner.jpg')
                ->where('pageData.bannerData.content.title.text', 'Microfinance'));
    });

    it('loads the sitemap page', function () {
        $response = $this->get('/sitemap');
        $response->assertOk();
    });

    it('loads the playground page', function () {
        $response = $this->get('/playground');
        $response->assertOk();
    });

    it('loads the unauthorized access page', function () {
        $response = $this->get('/unauthorized');
        $response->assertOk();
    });

    it('serves storage files', function () {
        config(['filesystems.disks.public.root' => storage_path('app/public')]);

        $response = $this->get('/storage/test.txt');
        $response->assertNotFound();
    });
});
