<?php

use App\Models\pages\Page;
use App\Models\pages\Blog;
use App\Models\pages\CustomSectionData;
use App\Models\pages\SectionConfig;
use App\Models\pages\SharedData;
use Illuminate\Support\Facades\Cache;

uses(Tests\Support\RouteTestHelpers::class);

describe('CMS Page Routes', function () {
    it('redirects unauthenticated users', function () {
        $response = $this->get('/backend/cms/pages');
        $response->assertRedirect('/login');
    });

    it('shows index for admin users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/pages');
        $response->assertOk();
    });

    it('can store a page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/pages/store', [
            'name' => 'Test Page',
            'slug' => 'test-page-slug',
            'title' => 'Test Title',
            'description' => 'Test description',
        ]);

        $response->assertStatus(302);
    });

    it('automatically creates PageBannerSection when creating a new page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/pages/store', [
            'name' => 'My New Page',
            'slug' => 'my-new-page',
            'title' => 'My Page Title',
            'description' => 'My page description',
        ]);

        $response->assertStatus(302);

        $page = Page::where('slug', 'my-new-page')->first();
        expect($page)->not->toBeNull();

        // Check that PageBannerSection was created
        $bannerSection = SectionConfig::where('page_slug', 'my-new-page')
            ->where('component', 'PageBannerSection')
            ->first();
        expect($bannerSection)->not->toBeNull();
        expect($bannerSection->section_key)->toBe('page-banner-my-new-page');
        expect($bannerSection->is_enabled)->toBeTrue();

        // Check that CustomSectionData was created with title and description
        $customData = CustomSectionData::where('page_slug', 'my-new-page')
            ->where('section_key', 'page-banner-my-new-page')
            ->first();
        expect($customData)->not->toBeNull();
        expect($customData->data['content']['title']['text'])->toBe('My Page Title');
        expect($customData->data['content']['description']['text'])->toBe('My page description');
    });

it('automatically creates PageBannerSection with fallback when title/description not provided', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/pages/store', [
            'name' => 'Another Page',
            'slug' => 'another-page',
            // No title or description provided
        ]);

        $response->assertStatus(302);

        $page = Page::where('slug', 'another-page')->first();
        expect($page)->not->toBeNull();

        $customData = CustomSectionData::where('page_slug', 'another-page')
            ->where('section_key', 'page-banner-another-page')
            ->first();
        expect($customData)->not->toBeNull();
        // Should fall back to page name for title
        expect($customData->data['content']['title']['text'])->toBe('Another Page');
        // Should use default description
        expect($customData->data['content']['description']['text'])->toContain('Page description goes here');
    });

    it('does not create duplicate PageBannerSection if one already exists', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create(['slug' => 'existing-page']);
        
        // Pre-create a PageBannerSection
        SectionConfig::create([
            'page_slug' => 'existing-page',
            'section_key' => 'page-banner-existing-page',
            'component' => 'PageBannerSection',
            'data_table' => 'custom_section_data',
            'data_key' => 'page_banner_existing-page',
            'prop_name' => 'pageBanner',
            'display_order' => 1,
            'is_enabled' => true,
            'is_fixed_section' => false,
            'is_special_component' => false,
        ]);

        $response = $this->post('/backend/cms/pages/store', [
            'name' => 'Existing Page',
            'slug' => 'existing-page',
            'title' => 'Existing Page Title',
        ]);

        // This should fail due to unique slug constraint
        $response->assertSessionHasErrors(['slug']);
    });

    it('can update a page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create();

        $response = $this->put("/backend/cms/pages/update/{$page->id}", [
            'name' => 'Updated Page',
        ]);

        $response->assertStatus(302);
    });

    it('can toggle page status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create();

        $response = $this->post("/backend/cms/pages/toggle-status/{$page->id}");
        $response->assertStatus(302);
    });

    it('can delete a page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create();

        $response = $this->delete("/backend/cms/pages/destroy/{$page->id}");
        $response->assertStatus(302);
    });

    it('can restore a page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create();
        $page->delete();

        $response = $this->post("/backend/cms/pages/restore/{$page->id}");
        $response->assertStatus(302);
    });

    it('can force delete a page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create();
        $page->delete();

        $response = $this->delete("/backend/cms/pages/force-delete/{$page->id}");
        $response->assertStatus(302);
    });
});

describe('CMS Section Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('can show sections for a page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create(['slug' => 'home']);

        $response = $this->get("/backend/cms/sections/page/{$page->id}");
        $response->assertOk();
    });

    it('can update section order', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $page = Page::factory()->create(['slug' => 'home']);
        $section = SectionConfig::factory()->create([
            'page_slug' => $page->slug,
            'component' => 'TestComponent',
            'section_key' => 'test-section',
            'data_key' => 'key',
            'prop_name' => 'prop',
        ]);

        $response = $this->post("/backend/cms/sections/{$page->id}/update-order", [
            'orders' => [
                ['id' => $section->id, 'display_order' => 1],
            ],
        ]);

        $response->assertOk();
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/sections/about-content-options');
        $response->assertOk();
    });
});

describe('CMS Shared Data Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('shows index', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/shared');
        $response->assertOk();
    });

    it('can update shared data', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $data = SharedData::factory()->create(['type' => 'banner']);

        $response = $this->put("/backend/cms/shared/update/{$data->id}", [
            'data' => ['key' => 'value'],
            'is_active' => true,
        ]);

        $response->assertStatus(302);
    });
});

describe('CMS Blog Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('shows index', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/blogs');
        $response->assertOk();
    });

    it('can store a blog', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/blogs/store', [
            'title' => 'Test Blog',
            'slug' => 'test-blog',
            'excerpt' => 'Test excerpt',
        ]);

        $response->assertStatus(302);
    });

    it('can update a blog', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $blog = Blog::factory()->create();

        $response = $this->put("/backend/cms/blogs/update/{$blog->id}", [
            'title' => 'Updated Blog',
        ]);

        $response->assertStatus(302);
    });
});

describe('CMS Program Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('shows index', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/programs');
        $response->assertOk();
    });
});

describe('CMS About Content Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('shows index', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/about');
        $response->assertOk();
    });
});

describe('CMS Publication Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('shows index', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/publications');
        $response->assertOk();
    });
});
