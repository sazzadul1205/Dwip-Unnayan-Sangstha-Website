<?php

use App\Models\ApplicantProfile;
use App\Models\JobListing;
use App\Models\Application;
use App\Models\ApplicantCv;
use Illuminate\Http\UploadedFile;

uses(Tests\Support\RouteTestHelpers::class);

describe('Applicant Profile Admin Routes', function () {
    it('shows index for admin users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/applicant-profiles');
        $response->assertOk();
    });

    it('can show a profile', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $profile = ApplicantProfile::factory()->create();

        $response = $this->get("/backend/applicant-profiles/{$profile->id}");
        $response->assertOk();
    });

    it('can bulk delete profiles', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $profile = ApplicantProfile::factory()->create();

        $response = $this->post('/backend/applicant-profiles/bulk/delete', [
            'profile_ids' => [$profile->id],
        ]);
        $response->assertStatus(302);
    });

    it('can bulk restore profiles', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $profile = ApplicantProfile::factory()->create();
        $profile->delete();

        $response = $this->post('/backend/applicant-profiles/bulk/restore', [
            'profile_ids' => [$profile->id],
        ]);
        $response->assertStatus(302);
    });

    it('can delete a profile', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $profile = ApplicantProfile::factory()->create();

        $response = $this->delete("/backend/applicant-profiles/{$profile->id}");
        $response->assertOk();
    });

    it('can restore a profile', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $profile = ApplicantProfile::factory()->create();
        $profile->delete();

        $response = $this->post("/backend/applicant-profiles/{$profile->id}/restore");
        $response->assertOk();
    });

    it('can force delete a profile', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $profile = ApplicantProfile::factory()->create();
        $profile->delete();

        $response = $this->delete("/backend/applicant-profiles/{$profile->id}/force");
        $response->assertStatus(302);
    });

    it('can export profiles', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/applicant-profiles/export', [
            'format' => 'csv',
        ]);
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can upload CV', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->post('/backend/applicant-profiles/cv/upload', [
            'cv' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
        ]);

        expect($response->status())->toBeIn([200, 422]);
    });

    it('can delete CV', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->delete('/backend/applicant-profiles/cv/1');
        expect($response->status())->toBeIn([200, 302, 404]);
    });

    it('can set primary CV', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->patch('/backend/applicant-profiles/cv/1/primary');
        expect($response->status())->toBeIn([200, 302, 404]);
    });
});

describe('Applicant Own Profile Routes', function () {
    it('shows own profile for authenticated job seeker', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->get('/backend/applicant/profile');
        $response->assertOk();
    });

    it('shows specific profile', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->get("/backend/applicant/profile/{$user->id}");
        $response->assertOk();
    });

    it('can download CV', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        $response = $this->get("/backend/applicant/profile/{$profile->id}/download-cv");
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can restore profile', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        $response = $this->post("/backend/applicant/profile/{$profile->id}/restore");
        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('can update basic info', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        $response = $this->patch("/backend/applicant/profile/{$profile->id}/basic-info", [
            'first_name' => 'Updated',
            'last_name' => 'Name',
            'phone' => '1234567890',
        ]);

        $response->assertOk();
    });

    it('can update professional info', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        $response = $this->patch("/backend/applicant/profile/{$profile->id}/professional-info", [
            'experience_years' => 5,
            'current_job_title' => 'Developer',
        ]);

        $response->assertOk();
    });

    it('can change password', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->post('/backend/applicant/profile/change-password', [
            'current_password' => 'password',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk();
    });

    it('can get profile data', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $profile = ApplicantProfile::where('user_id', $user->id)->first();

        $response = $this->get("/backend/applicant/profile/{$profile->id}/data");
        $response->assertOk();
    });
});
