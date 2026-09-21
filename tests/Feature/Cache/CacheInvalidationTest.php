<?php

use App\Services\ContentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Tests\Support\SeedsFrontendContent;

uses(RefreshDatabase::class, SeedsFrontendContent::class);

beforeEach(function () {
    Cache::flush();
    $this->seedFrontendContent();
    $this->withoutVite();
});

it('serves fresh content as soon as the purge the CMS controllers call is executed', function () {
    expect($this->get('/')->getContent())->toContain('Banner v1');

    DB::table('shared_data')
        ->where('type', 'banner')
        ->update(['data' => json_encode(['title' => 'Banner v2']), 'updated_at' => now()]);

    // Exactly what every Cms\*Controller does after a write:
    // app(\App\Services\ContentService::class)->clearCache();
    app(ContentService::class)->clearCache();

    $afterPurge = measureCall(fn () => $this->get('/'));

    reportFact('Frontend after ContentService::clearCache()', 'Banner v2 served from a fresh SQL read');

    expect($afterPurge['result']->getContent())->toContain('Banner v2')
        ->and($afterPurge['result']->getContent())->not->toContain('Banner v1')
        ->and($afterPurge['count'])->toBeGreaterThan(2);
});

it('serves stale content for up to one hour when the purge is not triggered', function () {
    $this->get('/');

    DB::table('shared_data')
        ->where('type', 'banner')
        ->update(['data' => json_encode(['title' => 'Banner v2']), 'updated_at' => now()]);

    reportFact('Cache::remember keys (page.*, sections.*)', 'expire after 60 s (the property claims 60 min)');
    reportFact('ContentService::getSharedData keys (shared.*)', 'expire after 3600 s');

    // 301 s: the 300 s PageController keys are gone, but shared.banner is not.
    $this->travel(301)->seconds();

    $afterFiveMinutes = measureCall(fn () => $this->get('/'));

    reportFact('Frontend 301 s after a raw SQL update', 'still serves the stale "Banner v1"');

    expect($afterFiveMinutes['result']->getContent())->toContain('Banner v1')
        ->and($afterFiveMinutes['result']->getContent())->not->toContain('Banner v2');

    // Past the 3600 s TTL of the shared data cache the value finally refreshes.
    $this->travel(3300)->seconds();

    $afterAnHour = measureCall(fn () => $this->get('/'));

    expect($afterAnHour['result']->getContent())->toContain('Banner v2');

    $this->travelBack();
});

it('clears the whole cache store, not just the content keys', function () {
    $sentinels = [
        'user_roles_permissions_1',
        'api_rate_limit_pages|127.0.0.1',
        'frontend_shared_data',
    ];

    foreach ($sentinels as $key) {
        Cache::put($key, 'sentinel', 300);
    }

    $this->get('/');

    app(ContentService::class)->clearCache();

    $survivors = collect($sentinels)->filter(fn ($key) => Cache::has($key))->values();

    reportFact('Unrelated keys surviving a CMS purge', $survivors->count() . ' of ' . count($sentinels) . ' (Cache::flush() is global)');

    expect($survivors)->toBeEmpty();
});

it('cannot purge everything through the console because that code path is broken', function (array $arguments) {
    $thrown = null;

    try {
        Artisan::call('frontend:clear-cache', $arguments);
    } catch (Throwable $exception) {
        $thrown = $exception;
    }

    $invocation = 'frontend:clear-cache ' . (implode(' ', array_keys($arguments)) ?: '(no options)');

    reportFact($invocation, $thrown ? class_basename($thrown) . ': ' . $thrown->getMessage() : 'worked');

    expect($thrown)->not->toBeNull('this purge path is expected to fail: it calls an undefined method')
        ->and($thrown->getMessage())->toContain('clearFrontendCache');
})->with([
    'no options' => [[]],
    'all pages' => [['--all' => true]],
]);

it('can still purge a single page through the console', function () {
    $this->get('/');

    expect(Cache::has('frontend_shared_data'))->toBeTrue();

    $exitCode = Artisan::call('frontend:clear-cache', ['--page' => 'home']);

    reportFact('frontend:clear-cache --page=home', 'exit code ' . $exitCode . ' (works)');

    expect($exitCode)->toBe(0)
        ->and(Cache::has('frontend_shared_data'))->toBeFalse();
});

it('keeps the purge wired into every CMS content controller', function () {
    $controllers = collect(File::files(app_path('Http/Controllers/Cms')))
        ->reject(fn ($file) => $file->getFilename() === 'EditorImageUploadController.php');

    $missing = $controllers
        ->filter(fn ($file) => ! str_contains(File::get($file->getPathname()), 'clearCache'))
        ->map(fn ($file) => $file->getFilename())
        ->values();

    reportFact('CMS content controllers calling the purge', ($controllers->count() - $missing->count()) . '/' . $controllers->count());

    expect($missing)->toBeEmpty(
        'A CMS controller that writes content without purging would leave the frontend stale for up to an hour.'
    );
});
