<?php

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

uses(Tests\Support\RouteTestHelpers::class);

describe('User Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/users');
        $response->assertOk();
    });

    it('can store a user', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $response = $this->post('/backend/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(302);
    });

    it('can update a user', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $user = User::factory()->create();

        $response = $this->put("/backend/users/{$user->id}", [
            'name' => 'Updated User',
        ]);

        $response->assertStatus(302);
    });

    it('can delete a user', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $user = User::factory()->create();

        $response = $this->delete("/backend/users/{$user->id}");
        $response->assertStatus(302);
    });

    it('can restore a user', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $user = User::factory()->create();
        $user->delete();

        $response = $this->patch("/backend/users/{$user->id}/restore");
        $response->assertStatus(302);
    });

    it('can verify a user', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $user = User::factory()->create(['email_verified_at' => null]);

        $response = $this->post("/backend/users/{$user->id}/verify");
        $response->assertStatus(302);
    });

    it('can force delete a user', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $user = User::factory()->create();
        $user->delete();

        $response = $this->delete("/backend/users/{$user->id}/force-delete");
        $response->assertStatus(302);
    });

    it('can bulk delete users', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $user = User::factory()->create();

        $response = $this->post('/backend/users/bulk/delete', [
            'ids' => [$user->id],
        ]);

        $response->assertStatus(302);
    });

    it('can bulk restore users', function () {
        $adminUser = $this->createAdminUser();
        $this->actingAs($adminUser);

        $user = User::factory()->create();
        $user->delete();

        $response = $this->post('/backend/users/bulk/restore', [
            'ids' => [$user->id],
        ]);

        $response->assertStatus(302);
    });
});
