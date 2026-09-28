<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Google OAuth Routes', function () {
    it('can access google redirect', function () {
        $response = $this->get('/auth/google/redirect');
        expect($response->status())->toBeIn([200, 302, 400]);
    });

    it('handles google callback', function () {
        $response = $this->get('/auth/google/callback');
        expect($response->status())->toBeIn([200, 302, 400]);
    });
});
