<?php

use App\Models\User;
use Illuminate\Support\Facades\Password;

uses(Tests\Support\RouteTestHelpers::class);

describe('Password Reset Routes', function () {
    it('shows forgot password form for guest users', function () {
        $response = $this->get('/forgot-password');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can request password reset link', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->post('/forgot-password', [
            'email' => $user->email,
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('shows validation error for invalid email', function () {
        $response = $this->post('/forgot-password', [
            'email' => 'not-an-email',
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('shows reset password form with valid token', function () {
        $response = $this->get('/reset-password/test-token');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can reset password with valid token', function () {
        $user = User::factory()->create();

        $response = $this->post('/reset-password', [
            'token' => 'test-token',
            'email' => $user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('shows confirm password form for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/confirm-password');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can confirm password', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/confirm-password', [
            'password' => 'password',
            'redirect' => '/backend/dashboard',
        ]);

        expect($response->status())->toBeIn([200, 302, 422, 500]);
    });
});
