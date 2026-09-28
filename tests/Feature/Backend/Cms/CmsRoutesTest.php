<?php

use App\Models\pages\Page;
use App\Models\pages\Blog;
use App\Models\pages\SharedData;
use App\Models\pages\SectionConfig;
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
