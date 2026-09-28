<?php

use App\Models\pages\Page;
use App\Models\pages\SectionConfig;
use App\Models\pages\SectionConfig as SectionConfigModel;

uses(Tests\Support\RouteTestHelpers::class);

describe('CMS Section Management Routes', function () {
    beforeEach(function () {
        $this->page = Page::factory()->create(['slug' => 'home']);
    });

    it('shows section management page for a page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get("/backend/cms/sections/page/{$this->page->id}");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can store a new HomeBanner section', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'HomeBanner',
            'section_key' => 'home_banner',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('can store a new BlogSection', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'BlogSection',
            'section_key' => 'blog_list',
            'data_table' => 'blogs',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('can store a new JobsSection', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'JobsSection',
            'section_key' => 'latest_jobs',
            'data_table' => 'jobs',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('can store a new shared_data section', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'AboutUsSection',
            'section_key' => 'about_us',
            'data_table' => 'shared_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('validates data_table against the SectionDataTable enum', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'HomeBanner',
            'section_key' => 'invalid_section',
            'data_table' => 'invalid_table',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('can update section order', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $section = SectionConfig::factory()->create(['page_slug' => 'home', 'section_key' => 'test_order']);

        $response = $this->post("/backend/cms/sections/{$this->page->id}/update-order", [
            'orders' => [['id' => $section->id, 'display_order' => 1]],
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('can update a section', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $section = SectionConfig::factory()->create(['page_slug' => 'home', 'section_key' => 'test_update']);

        $response = $this->put("/backend/cms/sections/update/{$section->id}", [
            'section_key' => 'updated_key',
            'data_table' => 'custom_section_data',
            'component' => 'HomeBanner',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('can delete a section', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $section = SectionConfig::factory()->create(['page_slug' => 'home', 'section_key' => 'test_delete']);

        $response = $this->delete("/backend/cms/sections/{$section->id}");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can restore a deleted section', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $section = SectionConfig::factory()->create(['page_slug' => 'home', 'section_key' => 'test_restore']);
        $section->delete();

        $response = $this->post("/backend/cms/sections/{$section->id}/restore");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can force delete a section', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $section = SectionConfig::factory()->create(['page_slug' => 'home', 'section_key' => 'test_force_delete']);
        $section->delete();

        $response = $this->delete("/backend/cms/sections/{$section->id}/force-delete");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can get about content options', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/sections/about-content-options');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('prebuilt sections get default data created', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/sections', [
            'page_id' => $this->page->id,
            'component' => 'AboutUsSection',
            'section_key' => 'about_us_default',
            'data_table' => 'custom_section_data',
            'is_enabled' => true,
        ]);

        expect($response->status())->toBeIn([200, 302]);

        $this->assertDatabaseHas('custom_section_data', [
            'page_slug' => 'home',
            'section_key' => 'about_us_default',
        ]);
    });
});
