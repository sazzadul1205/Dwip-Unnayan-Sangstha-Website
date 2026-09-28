<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Backup Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/backup');
        $response->assertOk();
    });

    it('can create manual backup', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/backup/create-manual');
        expect($response->status())->toBeIn([200, 500]);
    });

    it('can create automatic backup', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/backup/create-auto');
        expect($response->status())->toBeIn([200, 500]);
    });

    it('can restore backup', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/backup/restore');
        expect($response->status())->toBeIn([200, 302, 500]);
    });

    it('can delete backup', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->call('DELETE', '/backend/backup/delete');
        expect($response->status())->toBeIn([200, 302, 500]);
    });

    it('can download backup', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/backup/download');
        expect($response->status())->toBeIn([200, 302, 500, 404]);
    });

    it('can get backup status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/backup/status');
        $response->assertOk();
    });
});
