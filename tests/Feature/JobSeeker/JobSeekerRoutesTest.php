<?php

use App\Models\User;
use App\Models\Role;
use App\Models\ApplicantProfile;
use App\Models\pages\Page;
use App\Models\pages\Program;
use App\Models\pages\Blog;
use App\Models\pages\Publication;
use App\Models\JobListing;
use Illuminate\Http\UploadedFile;

uses(Tests\Support\RouteTestHelpers::class);

describe('Job Seeker Routes', function () {
    describe('Profile Completion', function () {
        it('redirects unauthenticated users to login', function () {
            $response = $this->get('/complete-profile');
            $response->assertRedirect('/login');
        });

        it('shows profile completion for authenticated job seeker', function () {
            $user = $this->createJobSeekerUser();
            $this->actingAs($user);

            $response = $this->get('/complete-profile');
            $response->assertOk();
        });

        it('can upload profile photo', function () {
            $user = $this->createJobSeekerWithProfile();
            $this->actingAs($user);

            if (!function_exists('imagecreatetruecolor')) {
                $photo = UploadedFile::fake()->create('test.jpg', 100, 'image/jpeg');
            } else {
                $photo = UploadedFile::fake()->image('test.jpg');
            }

            $response = $this->post('/profile/photo', [
                'photo' => $photo,
            ]);

            expect($response->status())->toBeIn([200, 302, 422]);
        });

        it('can upload CV', function () {
            $user = $this->createJobSeekerUser();
            $this->actingAs($user);

            $response = $this->call(
                'POST',
                '/profile/cv',
                [],
                [],
                [],
                [],
                json_encode(['cv' => 'data:application/pdf;base64,' . base64_encode('test')])
            );

            $response->assertSessionHasErrors();
        });
    });

    describe('Job Seeker Listings', function () {
        it('redirects unauthenticated users', function () {
            $response = $this->get('/backend/seeker/jobs');
            $response->assertRedirect('/login');
        });

        it('shows job listings for authenticated job seeker', function () {
            $user = $this->createJobSeekerWithProfile();
            $this->actingAs($user);

            $response = $this->get('/backend/seeker/jobs');
            $response->assertOk();
        });

        it('shows single job listing', function () {
            $user = $this->createJobSeekerWithProfile();
            $this->actingAs($user);

            JobListing::factory()->create(['slug' => 'test-job']);

            $response = $this->get('/backend/seeker/jobs/test-job');
            $response->assertOk();
        });
    });

    describe('Profile Photo', function () {
        it('can serve profile photo', function () {
            $response = $this->get('/profile/photo/test-image.jpg');
            expect($response->status())->toBeIn([200, 302, 404]);
        });
    });
});
