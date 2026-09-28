<?php

use App\Models\Application;
use App\Models\JobListing;

uses(Tests\Support\RouteTestHelpers::class);

describe('Application Management Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/applications');
        $response->assertOk();
    });

    it('shows applications for a job', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $job = JobListing::factory()->create();

        $response = $this->get("/backend/applications/job/{$job->id}");
        $response->assertOk();
    });

    it('can show an application', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->get("/backend/applications/{$app->id}");
        $response->assertOk();
    });

    it('can update application status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->put("/backend/applications/{$app->id}/status", [
            'status' => 'reviewed',
        ]);

        $response->assertStatus(302);
    });

    it('can bulk update status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->post('/backend/applications/bulk-status', [
            'application_ids' => [$app->id],
            'status' => 'shortlisted',
            'notes' => 'Test note',
        ]);

        $response->assertStatus(302);
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->delete("/backend/applications/{$app->id}");
        $response->assertStatus(302);
    });

    it('can bulk delete applications', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->post('/backend/applications/bulk-delete', [
            'ids' => [$app->id],
        ]);

        $response->assertStatus(302);
    });

    it('can download resume', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->get("/backend/applications/{$app->id}/download-resume");
        $response->assertStatus(302);
    });

    it('can download resume (legacy)', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->get("/backend/applications/{$app->id}/download");
        $response->assertStatus(302);
    });

    it('can bulk download resumes', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->post('/backend/applications/bulk-download', [
            'application_ids' => [$app->id],
        ]);

        $response->assertStatus(302);
    });

    it('can send email for an application', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->post("/backend/applications/{$app->id}/send-email");
        $response->assertStatus(302);
    });

    it('can send bulk email', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->post('/backend/applications/bulk-send-email', [
            'ids' => [$app->id],
        ]);

        $response->assertStatus(302);
    });

    it('can recalculate ATS', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->post("/backend/applications/{$app->id}/recalculate-ats");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can export applications', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();
        $job = $app->jobListing;

        $response = $this->post("/backend/applications/export/{$job->id}", [
            'format' => 'csv',
        ]);

        $response->assertOk();
    });

    it('can export single application', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $app = Application::factory()->create();

        $response = $this->post("/backend/applications/export-single/{$app->id}", [
            'format' => 'csv',
        ]);

        $response->assertOk();
    });
});
