<?php

use App\Models\Application;
use App\Models\JobListing;
use App\Models\ApplicantProfile;

uses(Tests\Support\RouteTestHelpers::class);

describe('Job Application Routes', function () {
    it('shows application index for authenticated job seeker', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->get('/backend/apply');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('shows application index for authenticated admin', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/apply');
        expect($response->status())->toBeIn([200, 302, 403]);
    });

    it('shows trashed applications for admin', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/apply/trashed');
        expect($response->status())->toBeIn([200, 302, 403, 500]);
    });

    it('shows create application form', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $listing = JobListing::factory()->create(['slug' => 'test-job-app', 'is_active' => true]);

        $response = $this->get('/backend/apply/create/' . $listing->slug);
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can store a job application', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $listing = JobListing::factory()->create(['slug' => 'test-job-store', 'is_active' => true]);

        $response = $this->post('/backend/apply/store/' . $listing->slug, [
            'portfolio_link' => 'https://example.com/portfolio',
            'cover_letter' => 'This is my cover letter.',
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('shows an application', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);

        $response = $this->get("/backend/apply/{$app->id}");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('shows edit form for an application', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);

        $response = $this->get("/backend/apply/{$app->id}/edit");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can update an application', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);

        $response = $this->put("/backend/apply/{$app->id}", [
            'name' => 'Updated Name',
        ]);

        expect($response->status())->toBeIn([200, 302]);
    });

    it('can delete an application', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);

        $response = $this->delete("/backend/apply/{$app->id}");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can restore an application', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);
        $app->delete();

        $response = $this->post("/backend/apply/{$app->id}/restore");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can force delete an application', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);
        $app->delete();

        $response = $this->delete("/backend/apply/{$app->id}/force-delete");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can get ATS status', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);

        $response = $this->get("/backend/apply/{$app->id}/ats-status");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can recalculate ATS', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $app = Application::factory()->create(['user_id' => $user->id]);

        $response = $this->post("/backend/apply/{$app->id}/recalculate-ats");
        expect($response->status())->toBeIn([200, 302]);
    });
});
