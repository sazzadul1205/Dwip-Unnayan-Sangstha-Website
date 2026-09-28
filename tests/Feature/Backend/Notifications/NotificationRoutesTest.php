<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Notification Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/notifications');
        $response->assertOk();
    });

    it('can mark a notification as read', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/notifications/1/mark-as-read');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can mark all notifications as read', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/notifications/mark-all-read');
        expect($response->status())->toBeIn([200, 302]);
    });
});
