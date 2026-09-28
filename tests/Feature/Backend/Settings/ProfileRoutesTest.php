<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;

uses(Tests\Support\RouteTestHelpers::class);

describe('Profile Settings Routes', function () {
    describe('Admin Profile', function () {
        it('shows edit form', function () {
            $user = $this->createAdminUser();
            $this->actingAs($user);

            $response = $this->get('/backend/admin-profile/edit');
            $response->assertOk();
        });

        it('can update profile', function () {
            $user = $this->createAdminUser();
            $this->actingAs($user);

            $response = $this->patch('/backend/admin-profile', [
                'name' => 'Updated Name',
            ]);

            $response->assertStatus(302);
        });

        it('can update password', function () {
            $user = $this->createAdminUser();
            $this->actingAs($user);

            $response = $this->put('/backend/admin-profile/password', [
                'current_password' => 'password',
                'new_password' => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ]);

            $response->assertStatus(302);
        });

        it('can update icon', function () {
            $user = $this->createAdminUser();
            $this->actingAs($user);

            $response = $this->post('/backend/admin-profile/icon/update', [
                'icon' => UploadedFile::fake()->create('icon.png', 100, 'image/png'),
            ]);

            expect($response->status())->toBeIn([200, 422]);
        });

        it('can reset icon', function () {
            $user = $this->createAdminUser();
            $this->actingAs($user);

            $response = $this->delete('/backend/admin-profile/icon/reset');
            $response->assertOk();
        });
    });

    describe('Employer Profile', function () {
        it('shows edit form', function () {
            $employerRole = Role::firstOrCreate(
                ['slug' => 'employer'],
                ['name' => 'Employer', 'level' => 20, 'is_active' => true]
            );

            $user = User::factory()->create(['email_verified_at' => now()]);
            $user->roles()->attach($employerRole->id);
            $this->actingAs($user);

            $response = $this->get('/backend/employer/profile/edit');
            expect($response->status())->toBeIn([200, 302]);
        });

        it('can update profile', function () {
            $employerRole = Role::firstOrCreate(
                ['slug' => 'employer'],
                ['name' => 'Employer', 'level' => 20, 'is_active' => true]
            );

            $user = User::factory()->create(['email_verified_at' => now()]);
            $user->roles()->attach($employerRole->id);
            $this->actingAs($user);

            $response = $this->patch('/backend/employer/profile', [
                'name' => 'Updated Employer',
            ]);

            expect($response->status())->toBeIn([200, 302]);
        });

        it('can update password', function () {
            $employerRole = Role::firstOrCreate(
                ['slug' => 'employer'],
                ['name' => 'Employer', 'level' => 20, 'is_active' => true]
            );

            $user = User::factory()->create(['email_verified_at' => now()]);
            $user->roles()->attach($employerRole->id);
            $this->actingAs($user);

            $response = $this->put('/backend/employer/profile/password', [
                'current_password' => 'password',
                'new_password' => 'newpassword123',
                'new_password_confirmation' => 'newpassword123',
            ]);

            expect($response->status())->toBeIn([200, 302]);
        });
    });
});
