<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Page Map Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/page-map');
        $response->assertOk();
    });

    it('can export JSON', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/page-map/export');
        $response->assertOk();
    });

    it('can get admin menu', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/page-map/admin-menu');
        $response->assertOk();
    });

    it('can get navigation tree', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/page-map/navigation-tree');
        $response->assertOk();
    });

    it('can get sitemap URLs', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/page-map/sitemap-urls');
        $response->assertOk();
    });

    it('can clear cache', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/page-map/clear-cache');
        $response->assertOk();
    });
});
