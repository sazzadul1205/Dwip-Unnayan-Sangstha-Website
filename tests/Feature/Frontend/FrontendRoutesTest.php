<?php

use App\Models\pages\Page;

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
