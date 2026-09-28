<?php

use App\Models\pages\Page;
use App\Models\pages\Program;
use App\Models\pages\Blog;
use App\Models\pages\AboutContent;
use App\Models\pages\Publication;
use App\Models\pages\SharedData;
use App\Models\pages\SectionConfig;
use App\Models\JobListing;
use App\Models\JobCategory;
use App\Models\Location;
use App\Models\User;
use Illuminate\Support\Facades\DB;

uses(Tests\Support\RouteTestHelpers::class)
    ;

describe('Public API Routes', function () {
    beforeEach(function () {
        $this->withoutVite();
        Page::factory()->count(5)->create(['is_active' => true]);
        Program::factory()->count(5)->create(['is_active' => true]);
        Blog::factory()->count(5)->create(['is_active' => true]);
        AboutContent::factory()->count(3)->create(['is_active' => true]);
        Publication::factory()->count(5)->create(['is_active' => true]);
        SharedData::factory()->create(['type' => 'banner', 'is_active' => true]);
        SharedData::factory()->create(['type' => 'footer', 'is_active' => true]);
    });

    it('returns jobs data as JSON', function () {
        $response = $this->get('/data/jobs.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns blogs data as JSON', function () {
        $response = $this->get('/data/blogs.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns pages data as JSON', function () {
        $response = $this->get('/data/pages.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns programs data as JSON', function () {
        $response = $this->get('/data/programs.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns shared data as JSON', function () {
        $response = $this->get('/data/shared_data.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns about content as JSON', function () {
        $response = $this->get('/data/about_content.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns section configs as JSON', function () {
        $response = $this->get('/data/section_configs.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns custom section data as JSON', function () {
        $response = $this->get('/data/custom_section_data.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns API blogs endpoint', function () {
        $response = $this->get('/api/blogs');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns API pages endpoint', function () {
        $response = $this->get('/api/pages');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns API programs endpoint', function () {
        $response = $this->get('/api/programs');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns API jobs endpoint', function () {
        $response = $this->get('/api/jobs');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns navigation data', function () {
        $response = $this->get('/data/navigation.json');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json')
            ->assertJsonStructure(['success', 'items']);
    });
});

describe('Job Listing API Routes', function () {
    it('returns job listings index', function () {
        JobListing::factory()->count(15)->create();

        $response = $this->get('/api/jobs');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns filter options', function () {
        $response = $this->get('/api/jobs/filter-options');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns popular jobs', function () {
        $response = $this->get('/api/jobs/popular');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });

    it('returns trending jobs', function () {
        $response = $this->get('/api/jobs/trending');
        $response->assertOk()
            ->assertHeader('Content-Type', 'application/json');
    });
});
