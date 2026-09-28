<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

uses(Tests\Support\RouteTestHelpers::class);

describe('Newsletter Public Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('can subscribe with valid email', function () {
        $response = $this->post('/newsletter/subscribe', [
            'email' => 'test@example.com',
        ]);
        $response->assertOk();
    });

    it('can check subscription status', function () {
        $response = $this->post('/newsletter/status', [
            'email' => 'test@example.com',
        ]);
        $response->assertOk();
    });

    it('can unsubscribe via token', function () {
        DB::table('newsletter_subscriptions')->insert([
            'email' => 'test@example.com',
            'token' => 'test-token-123',
            'status' => 'subscribed',
            'subscribed_at' => now(),
        ]);

        $response = $this->get('/newsletter/unsubscribe/test-token-123');
        $response->assertOk();
    });

    it('can resubscribe via token', function () {
        DB::table('newsletter_subscriptions')->insert([
            'email' => 'test@example.com',
            'token' => 'test-token-456',
            'status' => 'unsubscribed',
            'subscribed_at' => now(),
        ]);

        $response = $this->get('/newsletter/resubscribe/test-token-456');
        $response->assertOk();
    });
});

describe('Newsletter Admin Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('redirects to login for unauthenticated users', function () {
        $response = $this->get('/backend/newsletter');
        $response->assertRedirect('/login');
    });

    it('shows index for authenticated users', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/newsletter');
        $response->assertOk();
    });

    it('can export subscribers', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/newsletter/export');
        $response->assertOk();
    });

    it('can bulk delete subscribers', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $id = DB::table('newsletter_subscriptions')->insertGetId([
            'email' => 'test@example.com',
            'token' => 'token-abc',
            'status' => 'subscribed',
            'subscribed_at' => now(),
        ]);

        $response = $this->post('/backend/newsletter/bulk-delete', [
            'ids' => [$id],
        ]);

        $response->assertOk();
    });

    it('can bulk unsubscribe subscribers', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/newsletter/bulk-unsubscribe');
        $response->assertStatus(422);
    });

    it('can send bulk email', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/newsletter/send-bulk');
        $response->assertStatus(302);
    });

    it('can send test email', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/newsletter/send-test', [
            'email' => 'test@example.com',
        ]);

        $response->assertJsonStructure(['success']);
    });

    it('can show campaign status', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        DB::table('newsletter_campaigns')->insert([
            'subject' => 'Test',
            'content' => 'Test content',
            'status' => 'draft',
        ]);

        $response = $this->get('/backend/newsletter/campaign/1');
        $response->assertOk();
    });

    it('can show legacy campaigns list', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/newsletter/campaigns-legacy');
        $response->assertOk();
    });
});

describe('Campaign Manager Routes', function () {
    beforeEach(function () {
        Cache::flush();
    });

    it('can list campaigns', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/newsletter/campaigns');
        $response->assertOk();
    });

    it('can show create campaign form', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->get('/backend/newsletter/campaigns/create');
        $response->assertOk();
    });

    it('can store campaign', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/newsletter/campaigns', [
            'subject' => 'Test Campaign',
            'content' => 'Test content',
        ]);

        $response->assertStatus(302);
    });

    it('can preview campaign', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        $response = $this->post('/backend/newsletter/campaigns/preview');
        $response->assertOk();
    });

    it('can show campaign', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        DB::table('newsletter_campaigns')->insert([
            'subject' => 'Test',
            'content' => 'Test content',
            'status' => 'draft',
        ]);

        $response = $this->get('/backend/newsletter/campaigns/1');
        $response->assertOk();
    });

    it('can show edit campaign form', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        DB::table('newsletter_campaigns')->insert([
            'subject' => 'Test',
            'content' => 'Test content',
            'status' => 'draft',
        ]);

        $response = $this->get('/backend/newsletter/campaigns/1/edit');
        $response->assertOk();
    });

    it('can duplicate campaign', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        DB::table('newsletter_campaigns')->insert([
            'subject' => 'Test',
            'content' => 'Test content',
            'status' => 'draft',
        ]);

        $response = $this->post('/backend/newsletter/campaigns/1/duplicate');
        $response->assertStatus(302);
    });

    it('can retry failed campaign', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        DB::table('newsletter_campaigns')->insert([
            'subject' => 'Test',
            'content' => 'Test content',
            'status' => 'sent',
        ]);

        $response = $this->post('/backend/newsletter/campaigns/1/retry-failed');
        $response->assertStatus(302);
    });

    it('can export campaign HTML', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        DB::table('newsletter_campaigns')->insert([
            'subject' => 'Test',
            'content' => 'Test content',
            'status' => 'draft',
        ]);

        $response = $this->get('/backend/newsletter/campaigns/1/export/html');
        $response->assertOk();
    });

    it('can export campaign recipients', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        DB::table('newsletter_campaigns')->insert([
            'subject' => 'Test',
            'content' => 'Test content',
            'status' => 'draft',
        ]);

        $response = $this->get('/backend/newsletter/campaigns/1/export/recipients');
        $response->assertOk();
    });
});
