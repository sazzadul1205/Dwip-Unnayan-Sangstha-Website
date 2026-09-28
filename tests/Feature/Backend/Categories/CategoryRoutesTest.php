<?php

use App\Models\JobCategory;

uses(Tests\Support\RouteTestHelpers::class);

describe('Category Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/categories');
        $response->assertOk();
    });

    it('can store a category', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/categories', [
            'name' => 'Test Category',
            'slug' => 'test-category',
        ]);

        $response->assertStatus(302);
    });

    it('can update a category', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $category = JobCategory::factory()->create();

        $response = $this->put("/backend/categories/{$category->id}", [
            'name' => 'Updated Category',
        ]);

        $response->assertStatus(302);
    });

    it('can toggle active status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $category = JobCategory::factory()->create();

        $response = $this->patch("/backend/categories/{$category->id}/toggle-active");
        $response->assertStatus(302);
    });

    it('can delete a category', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $category = JobCategory::factory()->create();

        $response = $this->delete("/backend/categories/{$category->id}");
        $response->assertStatus(302);
    });

    it('can restore a category', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $category = JobCategory::factory()->create();
        $category->delete();

        $response = $this->post("/backend/categories/{$category->id}/restore");
        $response->assertStatus(302);
    });

    it('can force delete a category', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $category = JobCategory::factory()->create();
        $category->delete();

        $response = $this->delete("/backend/categories/{$category->id}/force-delete");
        $response->assertStatus(302);
    });

    it('can bulk delete categories', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/categories/bulk-delete');
        $response->assertStatus(302);
    });

    it('can bulk restore categories', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/categories/bulk-restore');
        $response->assertStatus(302);
    });

    it('can bulk activate categories', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/categories/bulk-activate');
        $response->assertStatus(302);
    });

    it('can bulk deactivate categories', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/categories/bulk-deactivate');
        $response->assertStatus(302);
    });

    it('can bulk force delete categories', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/categories/bulk-force-delete');
        $response->assertStatus(302);
    });

    it('can get active categories', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/categories/active');
        $response->assertOk();
    });
});
