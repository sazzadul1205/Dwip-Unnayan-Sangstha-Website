<?php

use App\Models\Role;
use Illuminate\Support\Facades\DB;

uses(Tests\Support\RouteTestHelpers::class);

describe('Role Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/roles');
        $response->assertOk();
    });

    it('shows create form', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/roles/create');
        $response->assertOk();
    });

    it('can store a role', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/roles', [
            'name' => 'Test Role',
            'slug' => 'test-role',
            'description' => 'Test role description',
            'level' => 50,
            'is_active' => true,
        ]);

        $response->assertStatus(302);
    });

    it('can show trashed roles', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/roles/trashed');
        $response->assertOk();
    });

    it('can export roles', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/roles/export');
        $response->assertOk();
    });

    it('can show a role', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();

        $response = $this->get("/backend/roles/{$role->id}");
        $response->assertOk();
    });

    it('can show edit form', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();

        $response = $this->get("/backend/roles/{$role->id}/edit");
        $response->assertOk();
    });

    it('can update a role', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();

        $response = $this->put("/backend/roles/{$role->id}", [
            'name' => 'Updated Role',
        ]);

        $response->assertStatus(302);
    });

    it('can delete a role', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();

        $response = $this->delete("/backend/roles/{$role->id}");
        $response->assertStatus(302);
    });

    it('can restore a role', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();
        $role->delete();

        $response = $this->post("/backend/roles/{$role->id}/restore");
        $response->assertStatus(302);
    });

    it('can force delete a role', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();
        $role->delete();

        $response = $this->delete("/backend/roles/{$role->id}/force");
        $response->assertStatus(302);
    });

    it('can toggle status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();

        $response = $this->post("/backend/roles/{$role->id}/toggle-status");
        $response->assertStatus(302);
    });

    it('can clone a role', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $role = Role::factory()->create();

        $response = $this->post("/backend/roles/{$role->id}/clone");
        $response->assertStatus(302);
    });
});
