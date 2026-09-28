<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Shared Data Routes', function () {
    it('shows index for authenticated admin', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/cms/shared');
        expect($response->status())->toBeIn([200, 302]);
    });

    it('can update shared data', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->put('/backend/cms/shared/update/1');
        expect($response->status())->toBeIn([200, 302]);
    });
});
