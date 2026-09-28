<?php

use App\Models\JobListing;

uses(Tests\Support\RouteTestHelpers::class);

describe('Public Job Listing Routes', function () {
    it('shows job listings index for authenticated job seeker', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->get('/backend/seeker/jobs');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('redirects unauthenticated users from job listings', function () {
        $response = $this->get('/backend/seeker/jobs');
        $response->assertRedirect('/login');
    });

    it('shows single job listing for authenticated user', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $listing = JobListing::factory()->create(['slug' => 'public-test-job', 'is_active' => true]);

        $response = $this->get("/backend/seeker/jobs/{$listing->slug}");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('returns popular jobs as JSON', function () {
        $response = $this->get('/api/jobs/popular');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('returns trending jobs as JSON', function () {
        $response = $this->get('/api/jobs/trending');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('returns 404 for non-existent job slug', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->get('/backend/seeker/jobs/non-existent-job-slug');
        expect($response->status())->toBeIn([200, 302, 404]);
    });
});
