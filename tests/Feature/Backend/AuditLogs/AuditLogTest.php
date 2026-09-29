<?php

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\SimpleLogger;
use Illuminate\Support\Facades\DB;

uses(Tests\Support\RouteTestHelpers::class);

/**
 * The audit trail is written by a global middleware, so these tests drive
 * real HTTP requests rather than calling the logger directly — that is the
 * only way to prove the coverage is actually automatic.
 */
describe('Audit capture', function () {
    it('records a successful create', function () {
        $admin = $this->createAdminUser();
        $this->actingAs($admin);

        $this->post('/backend/categories', ['name' => 'Audited Category', 'slug' => 'audited-category'])
            ->assertStatus(302);

        $log = AuditLog::where('description', 'like', '%Category%')->latest('id')->first();

        expect($log)->not->toBeNull()
            ->and($log->user_id)->toBe($admin->id)
            ->and($log->method)->toBe('POST')
            ->and($log->status_code)->toBe(302)
            ->and($log->new_values['name'] ?? null)->toBe('Audited Category');
    });

    it('records a delete', function () {
        $this->actingAs($this->createAdminUser());

        $category = \App\Models\JobCategory::factory()->create();
        $id = $category->id;

        $this->delete("/backend/categories/{$id}")->assertStatus(302);

        expect(AuditLog::where('event', AuditLog::DELETED)->exists())->toBeTrue();
    });

    it('does not record a read', function () {
        $this->actingAs($this->createAdminUser());

        $this->get('/backend/categories')->assertOk();

        expect(AuditLog::where('method', 'GET')->exists())->toBeFalse();
    });

    it('does not record a rejected request as a change', function () {
        $this->actingAs($this->createAdminUser());

        // No name => validation fails with 302 back + errors, but the
        // controller returns early, so nothing changed.
        $this->from('/backend/categories')
            ->post('/backend/categories', ['slug' => ''])
            ->assertSessionHasErrors();

        // A 422 is still a success status for the middleware, but the
        // point of the test is that no row claims a category was created.
        expect(AuditLog::where('event', AuditLog::CREATED)->exists())->toBeFalse();
    });

    it('records a refused request as a denial, not a change', function () {
        // A job seeker is authenticated but lacks the permission. The
        // controller refuses with a redirect to the unauthorized page.
        $this->actingAs($this->createJobSeekerUser());

        $this->put('/backend/email-templates/newsletter-test', ['source' => 'nope']);

        $denial = AuditLog::where('event', AuditLog::DENIED)->latest('id')->first();

        expect($denial)->not->toBeNull()
            ->and($denial->method)->toBe('PUT')
            ->and($denial->status_code)->toBe(302);

        // Crucially, the refusal must not also look like a successful write.
        expect(AuditLog::where('event', AuditLog::UPDATED)->exists())->toBeFalse();
    });

    it('records a 403 as a denial too', function () {
        $this->actingAs($this->createJobSeekerUser());

        $this->postJson('/backend/email-templates/newsletter-test/test-send', ['email' => 'a@b.test'])
            ->assertStatus(403);

        expect(AuditLog::where('event', AuditLog::DENIED)->exists())->toBeTrue();
    });

    it('never stores credentials', function () {
        $this->actingAs($this->createAdminUser());

        $this->post('/backend/categories', [
            'name' => 'Redaction Check',
            'slug' => 'redaction-check',
            'password' => 'super-secret-value',
            'api_token' => 'tok_live_123456',
            'nested' => ['current_password' => 'hunter2', 'keep' => 'visible'],
        ]);

        $log = AuditLog::where('description', 'like', '%Category%')->latest('id')->first();

        expect($log)->not->toBeNull();

        $serialised = json_encode($log->toArray());

        expect($serialised)->not->toContain('super-secret-value')
            ->and($serialised)->not->toContain('tok_live_123456')
            ->and($serialised)->not->toContain('hunter2')
            ->and($serialised)->toContain('Redaction Check')
            ->and($serialised)->toContain('visible');
    });

    it('survives a failure without breaking the request', function () {
        $this->actingAs($this->createAdminUser());

        DB::statement('DROP TABLE audit_logs');

        // The route must still succeed even though auditing cannot write.
        $this->post('/backend/categories', ['name' => 'Still Works', 'slug' => 'still-works'])
            ->assertStatus(302);
    });
});

describe('Audit authentication events', function () {
    it('records a successful sign-in and sign-out', function () {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'password' => bcrypt('secret1234'),
        ]);

        $this->post('/login/seeker', ['email' => $user->email, 'password' => 'secret1234']);

        expect(AuditLog::where('event', AuditLog::LOGIN)->exists())->toBeTrue();

        $this->post('/logout');

        expect(AuditLog::where('event', AuditLog::LOGOUT)->exists())->toBeTrue();
    });

    it('records a failed sign-in attempt with the identifier', function () {
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'password' => bcrypt('secret1234'),
        ]);

        $this->from('/login/seeker')
            ->post('/login/seeker', ['email' => $user->email, 'password' => 'wrong-password']);

        $log = AuditLog::where('event', AuditLog::FAILED_LOGIN)->latest('id')->first();

        expect($log)->not->toBeNull()
            ->and($log->new_values['identifier'] ?? null)->toBe($user->email)
            ->and(json_encode($log->toArray()))->not->toContain('wrong-password');
    });
});

describe('Audit logger internals', function () {
    it('diffs only the fields that changed', function () {
        $diff = app(AuditLogger::class)->diff(
            ['name' => 'Old', 'slug' => 'same', 'updated_at' => 'x'],
            ['name' => 'New', 'slug' => 'same', 'updated_at' => 'y']
        );

        expect($diff)->toHaveCount(1)
            ->and($diff['name'])->toBe(['old' => 'Old', 'new' => 'New']);
    });

    it('maps routes to events', function () {
        $audit = app(AuditLogger::class);

        expect($audit->eventForRoute('backend.cms.blogs.store', 'POST'))->toBe(AuditLog::CREATED)
            ->and($audit->eventForRoute('backend.cms.blogs.update', 'PUT'))->toBe(AuditLog::UPDATED)
            ->and($audit->eventForRoute('backend.cms.blogs.destroy', 'DELETE'))->toBe(AuditLog::DELETED)
            ->and($audit->eventForRoute('backend.cms.blogs.force-delete', 'DELETE'))->toBe(AuditLog::FORCE_DELETED)
            ->and($audit->eventForRoute('backend.cms.blogs.restore', 'POST'))->toBe(AuditLog::RESTORED)
            ->and($audit->eventForRoute('some.unknown.route', 'POST'))->toBe(AuditLog::CREATED);
    });

    it('treats password-like keys as sensitive', function () {
        $audit = app(AuditLogger::class);

        expect($audit->isSensitive('password'))->toBeTrue()
            ->and($audit->isSensitive('Password'))->toBeTrue()
            ->and($audit->isSensitive('user_password'))->toBeTrue()
            ->and($audit->isSensitive('api-token'))->toBeTrue()
            ->and($audit->isSensitive('client_secret'))->toBeTrue()
            ->and($audit->isSensitive('name'))->toBeFalse();
    });
});

describe('Audit trail routes', function () {
    it('redirects guests to login', function () {
        $this->get('/backend/audit-logs')->assertRedirect('/login');
    });

    it('denies users without the permission', function () {
        $this->actingAs($this->createJobSeekerUser());

        $this->get('/backend/audit-logs')->assertRedirect(route('unauthorized.access'));
    });

    it('lists entries for an admin', function () {
        AuditLog::create([
            'event' => AuditLog::CREATED,
            'description' => 'Seeded entry',
            'method' => 'POST',
        ]);

        $this->actingAs($this->createAdminUser());

        $this->get('/backend/audit-logs')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('logs')->has('events')->has('actors'));
    });

    it('returns the change set for one entry', function () {
        $log = AuditLog::create([
            'event' => AuditLog::UPDATED,
            'description' => 'Updated Blog #1 (1 field changed)',
            'method' => 'PUT',
            'old_values' => ['title' => 'Before'],
            'new_values' => ['title' => 'After'],
        ]);

        $this->actingAs($this->createAdminUser());

        $this->getJson("/backend/audit-logs/{$log->id}")
            ->assertOk()
            ->assertJsonPath('changes.title.old', 'Before')
            ->assertJsonPath('changes.title.new', 'After');
    });

    it('404s an unknown entry', function () {
        $this->actingAs($this->createAdminUser());

        $this->getJson('/backend/audit-logs/999999')->assertStatus(404);
    });

    it('exports the trail as CSV and records the export', function () {
        AuditLog::create([
            'event' => AuditLog::CREATED,
            'description' => 'Exportable entry',
            'method' => 'POST',
        ]);

        $this->actingAs($this->createAdminUser());

        $response = $this->get('/backend/audit-logs/export');

        $response->assertOk();
        expect($response->headers->get('content-disposition'))->toContain('.csv');
        expect(AuditLog::where('event', AuditLog::EXPORTED)->exists())->toBeTrue();
    });

    it('filters by event', function () {
        AuditLog::create(['event' => AuditLog::CREATED, 'description' => 'a create', 'method' => 'POST']);
        AuditLog::create(['event' => AuditLog::DELETED, 'description' => 'a delete', 'method' => 'DELETE']);

        $this->actingAs($this->createAdminUser());

        $this->get('/backend/audit-logs?event=deleted')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('logs.data', 1)
                ->where('logs.data.0.event', AuditLog::DELETED));
    });
});

describe('Audit pruning', function () {
    it('deletes entries older than the retention window', function () {
        AuditLog::create(['event' => AuditLog::CREATED, 'description' => 'ancient', 'method' => 'POST']);
        AuditLog::where('description', 'ancient')
            ->update(['created_at' => now()->subDays(400)]);

        AuditLog::create(['event' => AuditLog::CREATED, 'description' => 'recent', 'method' => 'POST']);

        $this->artisan('audit:prune --days=365')->assertSuccessful();

        expect(AuditLog::where('description', 'ancient')->exists())->toBeFalse()
            ->and(AuditLog::where('description', 'recent')->exists())->toBeTrue();

        // The prune itself is part of the trail.
        expect(AuditLog::where('event', AuditLog::PRUNED)->exists())->toBeTrue();
    });

    it('reports without deleting on a dry run', function () {
        AuditLog::create(['event' => AuditLog::CREATED, 'description' => 'keepme', 'method' => 'POST']);
        AuditLog::where('description', 'keepme')->update(['created_at' => now()->subDays(400)]);

        $this->artisan('audit:prune --days=365 --dry-run')->assertSuccessful();

        expect(AuditLog::where('description', 'keepme')->exists())->toBeTrue();
    });
});

describe('Audit and the existing file logger', function () {
    it('keeps SimpleLogger working alongside the database trail', function () {
        $user = $this->createAdminUser();
        $this->actingAs($user);

        SimpleLogger::users('Audit coexistence check', ['user_id' => $user->id]);

        $logFile = storage_path('logs/users.log');

        expect(file_exists($logFile))->toBeTrue()
            ->and(file_get_contents($logFile))->toContain('Audit coexistence check');

        @unlink($logFile);
    });
});
