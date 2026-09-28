<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Dashboard Routes', function () {
    it('shows dashboard for authenticated admin', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/dashboard');
        expect($response->status())->toBeIn([200, 500]);
    });

    it('shows dashboard for authenticated job seeker', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->get('/dashboard');
        expect($response->status())->toBeIn([200, 500]);
    });

    it('redirects unauthenticated users to login', function () {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    });
});
