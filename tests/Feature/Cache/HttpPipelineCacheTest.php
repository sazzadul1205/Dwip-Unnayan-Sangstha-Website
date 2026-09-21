<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Support\SeedsFrontendContent;

uses(RefreshDatabase::class, SeedsFrontendContent::class);

beforeEach(function () {
    Cache::flush();
    $this->seedFrontendContent();
    $this->withoutVite();
});

it('measures a cold vs warm home page request through the whole HTTP pipeline', function () {
    $cold = measureCall(fn () => $this->get('/'));
    $warm = measureCall(fn () => $this->get('/'));

    $cold['result']->assertOk();
    $warm['result']->assertOk();

    reportMeasurement('GET / (home page, full HTML)', $cold, $warm);
    reportFact('HTML payload size', strlen($cold['result']->getContent()) . ' bytes');

    expect($cold['count'])->toBeGreaterThanOrEqual(10)
        ->and($warm['count'])->toBeLessThanOrEqual(2, 'after warming, only the two uncached PageController queries may remain')
        ->and($warm['ms'])->toBeLessThan($cold['ms'])
        ->and($cold['result']->getContent())->toContain('Banner v1');
});

it('shows exactly which queries the warm home page still runs', function () {
    $this->get('/');

    $warm = measureCall(fn () => $this->get('/'));

    reportFact('SQL statements left on a warm home request', count($warm['queries']));

    foreach ($warm['queries'] as $index => $sql) {
        reportFact('  warm query #' . ($index + 1), substr(preg_replace('/\s+/', ' ', $sql), 0, 110));
    }

    // These two come from PageController::getPageBySlug() and the jobs section
    // which bypass ContentService/cache entirely and hit SQL on every request.
    expect($warm['count'])->toBe(2)
        ->and(implode(' ', $warm['queries']))->toContain('pages')
        ->and(implode(' ', $warm['queries']))->toContain('job_listings');
});

it('measures the Inertia JSON payload the React frontend receives', function () {
    $headers = [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
    ];

    $cold = measureCall(fn () => $this->get('/', $headers));
    $warm = measureCall(fn () => $this->get('/', $headers));

    $cold['result']->assertOk();
    $warm['result']->assertOk();

    $coldPayload = json_decode($cold['result']->getContent(), true);
    $warmPayload = json_decode($warm['result']->getContent(), true);

    reportMeasurement('GET / (X-Inertia JSON)', $cold, $warm);
    reportFact('Inertia component', $coldPayload['component'] ?? 'n/a');
    reportFact('Inertia JSON size', strlen($cold['result']->getContent()) . ' bytes');
    reportFact('Props sent to the frontend', implode(', ', array_keys($coldPayload['props'] ?? [])));

    expect($coldPayload['component'])->toBe('Frontend/GenericPage')
        ->and($coldPayload['props']['pageData']['bannerData']['title'] ?? null)->toBe('Banner v1')
        ->and($warmPayload['props']['pageData']['bannerData'])->toBe($coldPayload['props']['pageData']['bannerData'])
        ->and($warm['count'])->toBeLessThan($cold['count']);
});

it('measures the JSON content API used by the React components', function () {
    $endpoints = ['/data/pages.json', '/data/section_configs.json', '/data/shared_data.json'];

    foreach ($endpoints as $endpoint) {
        $cold = measureCall(fn () => $this->getJson($endpoint));
        $warm = measureCall(fn () => $this->getJson($endpoint));

        $cold['result']->assertOk();
        $warm['result']->assertOk();

        reportMeasurement('GET ' . $endpoint, $cold, $warm);
        reportFact('  JSON size', strlen($cold['result']->getContent()) . ' bytes');

        foreach ($warm['queries'] as $index => $sql) {
            reportFact('  warm query #' . ($index + 1), substr(preg_replace('/\s+/', ' ', $sql), 0, 100));
        }

        expect($cold['count'])->toBeGreaterThan(0)
            ->and($warm['count'])->toBe(0, "{$endpoint} must be replayed from cache with zero SQL")
            ->and($warm['result']->getContent())->toBe($cold['result']->getContent());
    }
});

it('leaves /api/pages uncached because a duplicate route name shadows the cached action', function () {
    $cold = measureCall(fn () => $this->getJson('/api/pages'));
    $warm = measureCall(fn () => $this->getJson('/api/pages'));

    $cold['result']->assertOk();
    $warm['result']->assertOk();

    reportMeasurement('GET /api/pages (legacy closure wins)', $cold, $warm);

    foreach ($warm['queries'] as $index => $sql) {
        reportFact('  warm query #' . ($index + 1), substr(preg_replace('/\s+/', ' ', $sql), 0, 100));
    }

    // routes/api.php registers `api.pages` twice: ContentApiController@pages
    // (cached, 300 s) and a legacy closure. Laravel keys routes by method+URI,
    // so the closure replaces the cached action and every call hits SQL.
    expect($warm['count'])->toBe($cold['count'], 'this endpoint is not cached at all')
        ->and($warm['count'])->toBeGreaterThan(0)
        ->and(implode(' ', $warm['queries']))->toContain('pages')
        ->and($cold['result']->json('success'))->toBeTrue();
});

it('measures the sitemap page which aggregates every content source', function () {
    $cold = measureCall(fn () => $this->get('/sitemap'));
    $warm = measureCall(fn () => $this->get('/sitemap'));

    $cold['result']->assertOk();
    $warm['result']->assertOk();

    reportMeasurement('GET /sitemap (PageMapService aggregate)', $cold, $warm);

    expect($warm['count'])->toBeLessThan($cold['count'])
        ->and($warm['count'])->toBeLessThanOrEqual(2)
        ->and(Cache::has('sitemap_urls'))->toBeTrue();
});
