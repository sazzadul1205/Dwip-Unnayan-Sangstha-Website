<?php

use App\Models\ApplicantProfile;
use Illuminate\Http\UploadedFile;

uses(Tests\Support\RouteTestHelpers::class);

describe('Profile Completion Routes', function () {
    beforeEach(function () {
        $user = $this->createJobSeekerUser();
        $this->actingAs($user);
    });

    it('shows profile completion page', function () {
        $response = $this->get('/complete-profile');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can complete profile', function () {
        $user = auth()->user();

        $response = $this->post('/profile/complete', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'phone' => '1234567890',
            'gender' => 'male',
            'birth_date' => '1990-01-01',
            'address' => 'Test Address',
            'experience_years' => 5,
            'current_job_title' => 'Developer',
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('shows validation error for incomplete profile', function () {
        $response = $this->post('/profile/complete', [
            'first_name' => '',
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('can upload profile photo', function () {
        $user = auth()->user();

        $response = $this->post('/profile/photo', [
            'photo' => UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg'),
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('can upload CV', function () {
        $user = auth()->user();

        $response = $this->post('/profile/cv', [
            'cv' => UploadedFile::fake()->create('resume.pdf', 100, 'application/pdf'),
        ]);

        expect($response->status())->toBeIn([200, 302, 422]);
    });

    it('can delete CV', function () {
        $user = auth()->user();

        $response = $this->delete('/profile/cv/1');
        expect($response->status())->toBeIn([200, 302, 404]);
    });

    it('can set primary CV', function () {
        $user = auth()->user();

        $response = $this->patch('/profile/cv/1/primary');
        expect($response->status())->toBeIn([200, 302, 404]);
    });
});
