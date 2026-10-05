<?php

// tests/Feature/Backend/Assets/AssetManagerTest.php

use App\Services\AssetLibrary;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Tests\Support\RouteTestHelpers;

uses(Tests\Support\RouteTestHelpers::class);

/**
 * The asset manager reads the filesystem only — no database — so these tests
 * point the configured roots at a scratch directory inside the project (the
 * service refuses any path outside base_path()) and drive real files.
 */
beforeEach(function () {
    $this->originalDb = config('database.default');
    $this->root = storage_path('framework/testing/assets-' . uniqid());
    File::ensureDirectoryExists($this->root . '/banner');

    config([
        'asset-library.roots' => [
            ['path' => $this->root, 'label' => 'Uploads', 'url_prefix' => '/storage'],
        ],
        'asset-library.reference_scan.paths' => [$this->root],
        'asset-library.reference_scan.always_referenced' => [],
        'asset-library.cache_ttl' => 0,
    ]);

    // A 1x1 transparent PNG.
    $png = base64_decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
    File::put($this->root . '/banner/used.png', $png);
    File::put($this->root . '/orphan.png', $png);
    File::put($this->root . '/banner/manual.pdf', "%PDF-1.4\n% test\n");

    // A source file that mentions used.png but never orphan.png.
    File::put($this->root . '/refs.php', "<?php\n// sees used.png only\n");

    app(AssetLibrary::class)->forget();
});

afterEach(function () {
    // One test deliberately breaks the connection; restore it before the next.
    config(['database.default' => $this->originalDb]);
    DB::setDefaultConnection($this->originalDb);

    File::deleteDirectory($this->root);
    app(AssetLibrary::class)->forget();
});

describe('asset scanning', function () {
    it('lists every file under the configured roots', function () {
        $assets = app(AssetLibrary::class)->scan(true)['assets'];

        $names = array_column($assets, 'name');
        sort($names);

        expect($names)->toBe(['manual.pdf', 'orphan.png', 'refs.php', 'used.png']);
    });

    it('reads image dimensions and classifies by type', function () {
        $assets = collect(app(AssetLibrary::class)->scan(true)['assets']);

        $png = $assets->firstWhere('name', 'used.png');
        $pdf = $assets->firstWhere('name', 'manual.pdf');

        expect($png['category'])->toBe('image')
            ->and($png['dimensions'])->toBe(['width' => 1, 'height' => 1])
            ->and($pdf['category'])->toBe('document')
            ->and($pdf['dimensions'])->toBeNull();
    });

    it('marks an asset referenced when a source file mentions its name', function () {
        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        expect($assets['used.png']['referenced'])->toBeTrue()
            ->and($assets['orphan.png']['referenced'])->toBeFalse();
    });

    it('does not match a partial name inside a longer file name', function () {
        File::delete($this->root . '/orphan.png');
        File::copy($this->root . '/banner/used.png', $this->root . '/banner/my-used.png');

        File::put($this->root . '/refs.php', "<?php\n// sees used.png only\n");

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        // "used.png" must not be credited because "my-used.png" exists.
        expect($assets['my-used.png']['referenced'])->toBeFalse();
    });

    it('builds a public url from the root prefix', function () {
        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        expect($assets['used.png']['url'])->toBe('/storage/banner/used.png');
    });

    it('summarises totals and counts unreferenced files', function () {
        $summary = app(AssetLibrary::class)->scan(true)['summary'];

        // Only used.png is mentioned by a source file. refs.php does not
        // reference itself, so it counts as unreferenced like the other three.
        expect($summary['total'])->toBe(4)
            ->and($summary['unused'])->toBe(3)
            ->and($summary['referenced'])->toBe(1)
            ->and($summary['size_label'])->toBeString();
    });

    it('lists folders with their own counts', function () {
        $folders = collect(app(AssetLibrary::class)->scan(true)['folders'])->keyBy('label');

        expect($folders)->toHaveKeys(['Uploads', 'Uploads/banner'])
            ->and($folders['Uploads/banner']['count'])->toBe(2)
            ->and($folders['Uploads/banner']['unused'])->toBe(1)
            ->and($folders['Uploads']['parent'])->toBeNull()
            ->and($folders['Uploads/banner']['parent'])->toBe('Uploads');
    });
});

describe('reference detection across stored content', function () {
    it('marks an asset referenced when stored content mentions it', function () {
        // The file name appears only in stored content, never in source.
        $user = $this->createAdminUser();
        $user->forceFill(['name' => 'Banner 2026 uses /storage/banner/orphan.png as the hero'])->save();

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        expect($assets['orphan.png']['referenced'])->toBeTrue()
            ->and($assets['orphan.png']['references'][0]['source'])->toContain('users');
    });

    it('reports that content was not scanned when the database is unreachable', function () {
        config(['database.default' => 'no-such-connection']);

        $scan = app(AssetLibrary::class)->scan(true);

        // Still renders — the code-only result is returned instead of an error.
        expect($scan['content_scanned'])->toBeFalse()
            ->and($scan['assets'])->not->toBeEmpty();
    });

    it('can be switched off entirely', function () {
        config(['asset-library.reference_scan.database.enabled' => false]);

        expect(app(AssetLibrary::class)->scan(true)['content_scanned'])->toBeFalse();
    });
});

describe('asset path safety', function () {
    it('refuses a path that escapes the root', function () {
        expect(app(AssetLibrary::class)->resolve('Uploads/../../../../.env'))->toBeNull()
            ->and(app(AssetLibrary::class)->resolve('Uploads/..%2F..%2F.env'))->toBeNull();
    });

    it('refuses an absolute path and an unknown root label', function () {
        expect(app(AssetLibrary::class)->resolve('C:\\Windows\\win.ini'))->toBeNull()
            ->and(app(AssetLibrary::class)->resolve('Elsewhere/secret.txt'))->toBeNull()
            ->and(app(AssetLibrary::class)->resolve('Uploads/nope.png'))->toBeNull();
    });

    it('resolves a genuine file inside a root', function () {
        $resolved = app(AssetLibrary::class)->resolve('Uploads/banner/used.png');

        expect($resolved)->not->toBeNull()
            ->and($resolved['absolute'])->toEndWith('used.png');
    });
});

describe('asset manager routes', function () {
    it('redirects guests to login', function () {
        $this->get('/backend/assets')->assertRedirect('/login');
    });

    it('denies a user without the permission', function () {
        $this->actingAs($this->createJobSeekerUser());

        $this->get('/backend/assets')->assertRedirect(route('unauthorized.access'));
    });

    it('renders the browser for an admin', function () {
        $this->actingAs($this->createAdminUser());

        $this->get('/backend/assets')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('assets')
                ->has('folders')
                ->has('summary')
                ->has('can.delete')
            );
    });

    it('returns metadata and references for one asset', function () {
        $this->actingAs($this->createAdminUser());

        $this->getJson('/backend/assets/Uploads/banner/used.png')
            ->assertOk()
            ->assertJsonPath('asset.name', 'used.png')
            ->assertJsonPath('asset.referenced', true);
    });

    it('404s an unknown asset', function () {
        $this->actingAs($this->createAdminUser());

        $this->getJson('/backend/assets/Uploads/missing.png')->assertStatus(404);
    });

    it('deletes an unreferenced file from disk', function () {
        $this->actingAs($this->createAdminUser());

        $this->post('/backend/assets/destroy', ['assets' => ['Uploads/orphan.png']])
            ->assertRedirect();

        expect(File::exists($this->root . '/orphan.png'))->toBeFalse();
    });

    it('refuses to delete a referenced file without force', function () {
        $this->actingAs($this->createAdminUser());

        $this->post('/backend/assets/destroy', ['assets' => ['Uploads/banner/used.png']])
            ->assertRedirect();

        expect(File::exists($this->root . '/banner/used.png'))->toBeTrue();
    });

    it('deletes a referenced file when forced', function () {
        $this->actingAs($this->createAdminUser());

        $this->post('/backend/assets/destroy', [
            'assets' => ['Uploads/banner/used.png'],
            'force' => true,
        ])->assertRedirect();

        expect(File::exists($this->root . '/banner/used.png'))->toBeFalse();
    });

    it('refuses a traversal attempt even when posted directly', function () {
        $this->actingAs($this->createAdminUser());

        $envBefore = File::exists(base_path('.env'));

        $this->post('/backend/assets/destroy', [
            'assets' => ['Uploads/../../../../.env'],
            'force' => true,
        ])->assertRedirect();

        expect(File::exists(base_path('.env')))->toBe($envBefore);
    });

    it('validates the request shape', function () {
        $this->actingAs($this->createAdminUser());

        $this->post('/backend/assets/destroy', [])
            ->assertSessionHasErrors('assets');

        $this->post('/backend/assets/destroy', ['assets' => 'not-an-array'])
            ->assertSessionHasErrors('assets');
    });
});