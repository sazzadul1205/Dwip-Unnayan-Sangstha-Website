<?php

// tests/Feature/Backend/Assets/AssetManagerTest.php

use App\Services\AssetLibrary;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
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

    // Scratch tables created by the reference-detection tests.
    foreach (['probe_payloads', 'probe_escaped', 'probe_deep', 'probe_huge', 'probe_unlisted', 'probe_mixed', 'probe_rows'] as $table) {
        Schema::dropIfExists($table);
    }

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
        // The reference scan uses an explicit table allowlist from config, so a
        // test that stores a reference in its own scratch table has to opt that
        // table in.
        config(['asset-library.reference_scan.database.tables' => ['users']]);

        $user = $this->createAdminUser();
        $user->forceFill(['name' => 'Banner 2026 uses /storage/banner/orphan.png as the hero'])->save();

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        expect($assets['orphan.png']['referenced'])->toBeTrue()
            ->and($assets['orphan.png']['references'][0]['source'])->toContain('users');
    });

    it('finds a name nested inside a JSON column', function () {
        config(['asset-library.reference_scan.database.tables' => ['probe_payloads']]);

        Schema::create('probe_payloads', function ($table) {
            $table->id();
            $table->json('payload')->nullable();
        });

        DB::table('probe_payloads')->insert([
            'payload' => json_encode([
                'sections' => [
                    ['type' => 'hero', 'image' => '/storage/banner/nested-hero.png'],
                ],
            ]),
        ]);

        File::copy($this->root . '/orphan.png', $this->root . '/nested-hero.png');

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        expect($assets['nested-hero.png']['referenced'])->toBeTrue()
            ->and($assets['nested-hero.png']['usage_state'])->toBe('referenced');
    });

    it('finds a name inside a slash-escaped JSON string', function () {
        config(['asset-library.reference_scan.database.tables' => ['probe_escaped']]);

        Schema::create('probe_escaped', function ($table) {
            $table->id();
            $table->text('payload')->nullable();
        });

        // Some drivers store JSON with forward slashes escaped.
        DB::table('probe_escaped')->insert([
            'payload' => '{"image":"images\\/banner\\/escaped.png"}',
        ]);

        File::copy($this->root . '/orphan.png', $this->root . '/escaped.png');

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        expect($assets['escaped.png']['referenced'])->toBeTrue();
    });

    it('reads past the old 2000 row cap so a late reference is still found', function () {
        config(['asset-library.reference_scan.database.tables' => ['probe_deep']]);

        Schema::create('probe_deep', function ($table) {
            $table->id();
            $table->text('body')->nullable();
        });

        $rows = [];
        for ($i = 0; $i < 2500; $i++) {
            $rows[] = ['body' => $i === 2499 ? 'hero /storage/banner/deep-tail.png' : 'filler ' . $i];
        }
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('probe_deep')->insert($chunk);
        }

        File::copy($this->root . '/orphan.png', $this->root . '/deep-tail.png');

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        // Row 2500 sits past the previous limit of 2000.
        expect($assets['deep-tail.png']['referenced'])->toBeTrue();
    });

    it('reports that content was not scanned when the database is unreachable', function () {
        config(['database.default' => 'no-such-connection']);

        $scan = app(AssetLibrary::class)->scan(true);

        // Still renders — the code-only result is returned instead of an error.
        expect($scan['content_scanned'])->toBeFalse()
            ->and($scan['assets'])->not->toBeEmpty();
    });

    it('only scans the tables an asset can actually be referenced from', function () {
        config(['asset-library.reference_scan.database.tables' => ['custom_section_data']]);

        Schema::create('probe_payloads', function ($table) {
            $table->id();
            $table->text('body')->nullable();
        });
        File::copy($this->root . '/orphan.png', $this->root . '/db-only.png');
        File::copy($this->root . '/orphan.png', $this->root . '/code-only.png');

        // probe_payloads holds a reference but is not on the allowlist, so its
        // row must not be read.
        DB::table('probe_payloads')->insert(['body' => 'holds /storage/db-only.png and /storage/code-only.png']);

        // A source file on disk is still searched; only the database side narrows.
        File::put($this->root . '/mentions.php', "<?php\n// /storage/code-only.png\n");

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        expect($assets['code-only.png']['referenced'])->toBeTrue()
            ->and($assets['db-only.png']['referenced'])->toBeFalse();

        Schema::dropIfExists('probe_payloads');
    });

    it('reads only the configured columns for a mixed table', function () {
        config([
            'asset-library.reference_scan.database.tables' => ['probe_mixed'],
            'asset-library.reference_scan.database.columns' => ['probe_mixed' => ['relevant']],
        ]);

        Schema::create('probe_mixed', function ($table) {
            $table->id();
            $table->string('relevant')->nullable();
            $table->text('irrelevant_bulk')->nullable();
        });

        DB::table('probe_mixed')->insert([
            'relevant' => 'kept /storage/kept-column.png',
            'irrelevant_bulk' => 'dropped /storage/dropped-column.png',
        ]);

        File::copy($this->root . '/orphan.png', $this->root . '/kept-column.png');
        File::copy($this->root . '/orphan.png', $this->root . '/dropped-column.png');

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');

        // Only the configured column is read, so a reference parked in the
        // bulky column is invisible. That is the trade being made for speed,
        // and it is why the column list lives in config beside the table list.
        expect($assets['kept-column.png']['referenced'])->toBeTrue()
            ->and($assets['dropped-column.png']['referenced'])->toBeFalse();

        Schema::dropIfExists('probe_mixed');
    });

    it('labels every row separately so no row is lost to a key collision', function () {
        config([
            'asset-library.reference_scan.database.tables' => ['probe_rows'],
            'asset-library.reference_scan.database.columns' => [],
        ]);

        Schema::create('probe_rows', function ($table) {
            $table->id();
            $table->text('body')->nullable();
        });

        // Three rows, the reference in the middle one. If the row label omits
        // the id, all three share the label "content: probe_rows" and only the
        // last one survives in the corpus map — which is how a real reference
        // silently disappears and a live image reads as unused.
        DB::table('probe_rows')->insert([
            ['body' => 'first row, nothing here'],
            ['body' => 'middle row holds /storage/middle-row.png'],
            ['body' => 'last row, nothing here'],
        ]);

        File::copy($this->root . '/orphan.png', $this->root . '/middle-row.png');

        $corpus = new ReflectionMethod(app(AssetLibrary::class), 'contentCorpus');
        $corpus->setAccessible(true);
        $rows = $corpus->invoke(app(AssetLibrary::class))['rows'];

        // One distinct entry per row, each with its own id.
        expect($rows)->toHaveCount(3)
            ->and(implode(',', array_keys($rows)))
            ->toContain('probe_rows #2');

        $assets = collect(app(AssetLibrary::class)->scan(true)['assets'])->keyBy('name');
        expect($assets['middle-row.png']['referenced'])->toBeTrue();

        Schema::dropIfExists('probe_rows');
    });

    it('marks files unknown rather than unused when the scan cannot be trusted', function () {
        $this->actingAs($this->createAdminUser());

        // No database at all: nothing can be said about any file.
        config(['database.default' => 'no-such-connection']);

        $scan = app(AssetLibrary::class)->scan(true);

        expect($scan['content_reliable'])->toBeFalse();

        foreach ($scan['assets'] as $asset) {
            if (! $asset['referenced']) {
                expect($asset['usage_state'])->toBe('unknown');
            }
        }
    });

    it('refuses to delete an unknown file even when forced', function () {
        $this->actingAs($this->createAdminUser());

        config(['database.default' => 'no-such-connection']);

        $this->post('/backend/assets/destroy', [
            'assets' => ['Uploads/orphan.png'],
            'force' => true,
        ])->assertRedirect();

        // The file must survive: an unverifiable file is not a deletable one.
        expect(File::exists($this->root . '/orphan.png'))->toBeTrue();
    });

    it('refuses to delete when a table is past the row cap', function () {
        $this->actingAs($this->createAdminUser());

        config([
            'asset-library.reference_scan.database.tables' => ['probe_huge'],
            'asset-library.reference_scan.database.max_rows_per_table' => 10,
        ]);

        Schema::create('probe_huge', function ($table) {
            $table->id();
            $table->text('body')->nullable();
        });

        $rows = [];
        for ($i = 0; $i < 40; $i++) {
            $rows[] = ['body' => 'row ' . $i];
        }
        DB::table('probe_huge')->insert($rows);

        $scan = app(AssetLibrary::class)->scan(true);

        expect($scan['content_reliable'])->toBeFalse()
            ->and($scan['scan_gaps'])->not->toBeEmpty();

        $this->post('/backend/assets/destroy', ['assets' => ['Uploads/orphan.png']])->assertRedirect();

        expect(File::exists($this->root . '/orphan.png'))->toBeTrue();
    });

    it('counts unknown separately from unused in the summary', function () {
        config(['database.default' => 'no-such-connection']);

        $summary = app(AssetLibrary::class)->scan(true)['summary'];

        expect($summary['unused'])->toBe(0)
            ->and($summary['unknown'])->toBeGreaterThan(0);
    });

    it('can be switched off entirely', function () {
        config(['asset-library.reference_scan.database.enabled' => false]);

        expect(app(AssetLibrary::class)->scan(true)['content_scanned'])->toBeFalse();
    });
});

describe('paging', function () {
    it('sends only one page of assets and reports the totals', function () {
        $this->actingAs($this->createAdminUser());

        $png = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        );
        for ($i = 0; $i < 40; $i++) {
            File::put($this->root . '/page-' . $i . '.png', $png);
        }

        // 4 files from beforeEach (used.png, orphan.png, manual.pdf, refs.php)
        // plus the 40 numbered ones.
        $this->get('/backend/assets?per_page=12')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Backend/Assets/Index')
                ->where('filters.folder', 'all')
                ->where('pagination.per_page', 12)
                ->where('pagination.total', 44)
                ->where('pagination.last_page', 4)
                ->where('pagination.current_page', 1)
                ->where('pagination.from', 1)
                ->where('pagination.to', 12)
                // Only the page is serialised, not the whole library.
                ->count('assets', 12)
            );
    });

    it('clamps a page beyond the end instead of erroring', function () {
        $this->actingAs($this->createAdminUser());

        $this->get('/backend/assets?per_page=12&page=99')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('pagination.current_page', 1)
                ->where('pagination.last_page', 1)
            );
    });

    it('applies folder, category, usage and search filters server side', function () {
        $this->actingAs($this->createAdminUser());

        // refs.php mentions used.png, so it is referenced; orphan.png is not.
        $this->get('/backend/assets?usage=unused&per_page=120')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.usage', 'unused')
                // unused: orphan.png, manual.pdf, refs.php.
                ->where('pagination.total', 3)
            );

        $this->get('/backend/assets?usage=referenced&per_page=120')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.usage', 'referenced')
                ->where('pagination.total', 1)
                ->where('assets.0.name', 'used.png')
            );

        $this->get('/backend/assets?search=used&per_page=120')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.search', 'used')
                ->has('assets', 1)
                ->where('assets.0.name', 'used.png')
            );

        $this->get('/backend/assets?folder=Uploads/banner&per_page=120')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('filters.folder', 'Uploads/banner')
                ->has('assets', 2)
            );
    });

    it('rejects an unknown sort and usage value', function () {
        $this->actingAs($this->createAdminUser());

        $this->get('/backend/assets?sort=whatever')->assertSessionHasErrors('sort');
        $this->get('/backend/assets?usage=whatever')->assertSessionHasErrors('usage');
    });

    it('clamps per_page to the configured bounds', function () {
        $this->actingAs($this->createAdminUser());

        $this->get('/backend/assets?per_page=5000')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('pagination.per_page', 120));
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