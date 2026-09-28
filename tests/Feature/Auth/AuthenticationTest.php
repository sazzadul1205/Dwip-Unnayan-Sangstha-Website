<?php

use Illuminate\Support\Facades\Event;
use Illuminate\Auth\Events\Verified;
use App\Models\User;

uses(Tests\Support\RouteTestHelpers::class);

describe('Authentication Routes', function () {
    describe('Guest Routes', function () {
        it('shows admin login form', function () {
            $response = $this->get('/login/staff');
            $response->assertOk();
        });

        it('shows job seeker login form', function () {
            $response = $this->get('/login/seeker');
            $response->assertOk();
        });

        it('redirects /login to seeker login', function () {
            $response = $this->get('/login');
            $response->assertRedirect('/login/seeker');
        });

        it('shows registration form', function () {
            $response = $this->get('/register');
            $response->assertOk();
        });

        it('shows forgot password form', function () {
            $response = $this->get('/forgot-password');
            $response->assertOk();
        });

        it('shows reset password form with token', function () {
            $response = $this->get('/reset-password/test-token');
            $response->assertOk();
        });
    });

    describe('Authenticated Routes', function () {
        it('shows email verification notice', function () {
            $user = User::factory()->create(['email_verified_at' => null]);
            $this->actingAs($user);

            $response = $this->get('/verify-email');
            $response->assertOk();
        });

        it('can verify email with valid signature', function () {
            $user = User::factory()->create(['email_verified_at' => null]);
            $this->actingAs($user);

            Event::fake([Verified::class]);

            $response = $this->get('/verify-email/' . $user->id . '/' . sha1($user->email));
            $response->assertStatus(200);
        });

        it('shows email verified page', function () {
            $user = User::factory()->create(['email_verified_at' => now()]);
            $this->actingAs($user);

            $response = $this->get('/email/verified');
            $response->assertOk();
        });

        it('shows confirm password page', function () {
            $user = User::factory()->create(['email_verified_at' => now()]);
            $this->actingAs($user);

            $response = $this->get('/confirm-password');
            $response->assertOk();
        });

        it('can logout', function () {
            $user = User::factory()->create(['email_verified_at' => now()]);
            $this->actingAs($user);

            $response = $this->post('/logout');
            $response->assertRedirect('/');
            $this->assertGuest();
        });
    });
});
