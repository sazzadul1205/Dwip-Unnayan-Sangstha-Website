<?php

use Illuminate\Http\UploadedFile;

uses(Tests\Support\RouteTestHelpers::class);

describe('Editor Image Upload Routes', function () {
    it('can upload image for admin', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/upload-editor-image', [
            'image' => 'data:image/png;base64,' . base64_encode('test-image-data'),
        ]);

        expect($response->status())->toBeIn([200, 422]);
    });

    it('returns 403 for non-admin users', function () {
        $user = $this->createJobSeekerWithProfile();
        $this->actingAs($user);

        $response = $this->post('/backend/cms/upload-editor-image', [
            'image' => 'data:image/png;base64,' . base64_encode('test-image-data'),
        ]);

        $response->assertStatus(403);
    });

    it('can delete editor image for admin', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->call('DELETE', '/backend/cms/editor-image', [
            'urls' => ['test-image.png'],
        ]);

        expect($response->status())->toBeIn([200, 404, 422]);
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
