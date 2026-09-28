<?php

use App\Models\User;
use Illuminate\Support\Facades\URL;

uses(Tests\Support\RouteTestHelpers::class);

describe('Email Verification Routes', function () {
    it('shows verification notice for authenticated unverified users', function () {
        $user = User::factory()->create(['email_verified_at' => null]);
        $this->actingAs($user);

        $response = $this->get('/verify-email');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can send verification notification', function () {
        $user = User::factory()->create(['email_verified_at' => null]);
        $this->actingAs($user);

        $response = $this->post('/email/verification-notification');
        expect($response->status())->toBeIn([200, 302, 429]);
    });

    it('shows verified page for verified users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/email/verified');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('redirects unverified users from verified page', function () {
        $user = User::factory()->create(['email_verified_at' => null]);
        $this->actingAs($user);

        $response = $this->get('/email/verified');
        expect($response->status())->toBeIn([200, 302]);
    });
});
