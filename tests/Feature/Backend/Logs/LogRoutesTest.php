<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Log Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/logs');
        $response->assertOk();
    });

    it('can export logs', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/logs/export');
        expect($response->getStatusCode())->toBeIn([200, 302]);
    });

    it('can clear logs', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/logs/clear');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can get log stats', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/logs/stats');
        $response->assertOk();
    });
});
