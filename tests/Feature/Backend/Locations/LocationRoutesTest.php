<?php

use App\Models\Location;

uses(Tests\Support\RouteTestHelpers::class);

describe('Location Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/locations');
        $response->assertOk();
    });

    it('can store a location', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/locations', [
            'name' => 'Test Location',
            'slug' => 'test-location',
            'address' => 'Test address',
            'is_active' => true,
        ]);

        $response->assertStatus(302);
    });

    it('can update a location', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $location = Location::factory()->create();

        $response = $this->put("/backend/locations/{$location->id}", [
            'name' => 'Updated Location',
        ]);

        $response->assertStatus(302);
    });

    it('can toggle active status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $location = Location::factory()->create();

        $response = $this->patch("/backend/locations/{$location->id}/toggle-active");
        $response->assertStatus(302);
    });

    it('can delete a location', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $location = Location::factory()->create();

        $response = $this->delete("/backend/locations/{$location->id}");
        $response->assertStatus(302);
    });

    it('can restore a location', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $location = Location::factory()->create();
        $location->delete();

        $response = $this->post("/backend/locations/{$location->id}/restore");
        $response->assertStatus(302);
    });

    it('can force delete a location', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $location = Location::factory()->create();
        $location->delete();

        $response = $this->delete("/backend/locations/{$location->id}/force-delete");
        $response->assertStatus(302);
    });

    it('can bulk delete locations', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/locations/bulk-delete');
        $response->assertStatus(302);
    });

    it('can bulk restore locations', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/locations/bulk-restore');
        $response->assertStatus(302);
    });

    it('can bulk activate locations', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/locations/bulk-activate');
        $response->assertStatus(302);
    });

    it('can bulk deactivate locations', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/locations/bulk-deactivate');
        $response->assertStatus(302);
    });

    it('can get active locations', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/locations/active');
        $response->assertOk();
    });
});
