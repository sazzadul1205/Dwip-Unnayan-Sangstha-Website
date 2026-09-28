<?php

use App\Models\JobListing;
use App\Models\JobCategory;
use App\Models\Location;

uses(Tests\Support\RouteTestHelpers::class);

describe('Job Listing Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/listing');
        $response->assertOk();
    });

    it('shows create form', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/listing/create');
        $response->assertOk();
    });

    it('can store a job listing', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $category = JobCategory::factory()->create();

        $response = $this->post('/backend/listing', [
            'title' => 'Test Job',
            'slug' => 'test-job',
            'category_id' => $category->id,
        ]);

        $response->assertStatus(302);
    });

    it('can show a job listing', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();

        $response = $this->get("/backend/listing/{$jobListing->id}");
        $response->assertOk();
    });

    it('can show edit form', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();

        $response = $this->get("/backend/listing/{$jobListing->id}/edit");
        $response->assertOk();
    });

    it('can update a job listing', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();

        $response = $this->put("/backend/listing/{$jobListing->id}", [
            'title' => 'Updated Job',
        ]);

        $response->assertStatus(302);
    });

    it('can delete a job listing', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();

        $response = $this->delete("/backend/listing/{$jobListing->id}");
        $response->assertStatus(302);
    });

    it('can toggle active status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();

        $response = $this->patch("/backend/listing/{$jobListing->id}/toggle-active");
        $response->assertStatus(302);
    });

    it('can restore a job listing', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();
        $jobListing->delete();

        $response = $this->patch("/backend/listing/{$jobListing->id}/restore");
        $response->assertStatus(302);
    });

    it('can force delete a job listing', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();
        $jobListing->delete();

        $response = $this->delete("/backend/listing/{$jobListing->id}/force-delete");
        $response->assertStatus(302);
    });

    it('shows applications for a job listing', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $jobListing = JobListing::factory()->create();

        $response = $this->get("/backend/listing/{$jobListing->id}/applications");
        $response->assertOk();
    });

    it('can bulk activate', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/listing/bulk-activate');
        $response->assertStatus(302);
    });

    it('can bulk deactivate', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/listing/bulk-deactivate');
        $response->assertStatus(302);
    });

    it('can bulk delete', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $listing = JobListing::factory()->create();

        $response = $this->call('DELETE', '/backend/listing/bulk-delete', [
            'ids' => [$listing->id],
        ]);
        $response->assertStatus(302);
    });

    it('shows statistics page', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/statistics');
        expect($response->status())->toBeIn([200, 302]);
    });
});
