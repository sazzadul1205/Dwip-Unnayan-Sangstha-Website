<?php

uses(Tests\Support\RouteTestHelpers::class);

describe('Apply Routes', function () {
    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/apply');
        $response->assertOk();
    });

    it('shows trashed applications', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/apply/trashed');
        $response->assertOk();
    });
});
