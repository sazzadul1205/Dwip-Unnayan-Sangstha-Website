<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(Tests\Support\RouteTestHelpers::class);

describe('Editor Image Upload Routes', function () {
    it('can upload image for admin', function () {
        Storage::fake('public');

        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/upload-editor-image', [
            'image' => 'data:image/png;base64,' . base64_encode('test-image-data'),
        ]);

        $response->assertOk();

        // Host-relative URL so saved HTML survives a domain change.
        expect($response->json('url'))->toStartWith('/storage/editor-images/');

        $url = $response->json('url');
        $relativePath = str_replace('/storage/', '', $url);
        Storage::disk('public')->assertExists($relativePath);

        // The URL that upload() returns must be deletable through the delete
        // endpoint — otherwise images are only ever written, never reclaimed.
        $delete = $this->deleteJson('/backend/cms/editor-image', ['urls' => [$url]]);

        $delete->assertOk();
        expect($delete->json('deleted'))->toContain($relativePath);
        expect($delete->json('success'))->toBeTrue();
        Storage::disk('public')->assertMissing($relativePath);
    });

    it('returns 403 for non-admin users', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/upload-editor-image', [
            'image' => 'data:image/png;base64,' . base64_encode('test-image-data'),
        ]);

        $response->assertStatus(403);
    });

    it('refuses to delete files outside the editor images folder', function () {
        Storage::fake('public');

        $user = $this->createAdminUser();
        $this->actingAs($user);

        // Other upload folders and traversal attempts must both be refused.
        $response = $this->deleteJson('/backend/cms/editor-image', [
            'urls' => [
                '/storage/banner/logo.png',
                '/storage/editor-images/../../../storage/framework/.gitignore',
            ],
        ]);

        $response->assertOk();
        expect($response->json('deleted'))->toBeEmpty();
        expect($response->json('success'))->toBeFalse();
        expect($response->json('errors'))->toHaveCount(2);
    });

    it('returns 403 for non-admin users deleting images', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->call('DELETE', '/backend/cms/editor-image', [
            'image_path' => 'test-image.png',
        ]);

        $response->assertStatus(403);
    });
});
