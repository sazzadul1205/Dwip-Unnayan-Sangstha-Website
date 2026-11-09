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
    Cache::store('frontend')->flush();
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

it('refreshes content after the five-minute TTL if the purge is not triggered', function () {
    $this->get('/');

    DB::table('shared_data')
        ->where('type', 'banner')
        ->update(['data' => json_encode(['title' => 'Banner v2']), 'updated_at' => now()]);

    reportFact('Frontend content cache TTL', '300 s');

    // At 301 s all cached page and shared data has expired.
    $this->travel(301)->seconds();

    $afterFiveMinutes = measureCall(fn () => $this->get('/'));

    reportFact('Frontend 301 s after a raw SQL update', 'serves the fresh "Banner v2"');

    expect($afterFiveMinutes['result']->getContent())->toContain('Banner v2')
        ->and($afterFiveMinutes['result']->getContent())->not->toContain('Banner v1');

    $this->travelBack();
});

it('clears only the frontend cache and preserves unrelated application cache keys', function () {
    $sentinels = [
        'user_roles_permissions_1',
        'api_rate_limit_pages|127.0.0.1',
    ];

    foreach ($sentinels as $key) {
        Cache::put($key, 'sentinel', 300);
    }
    Cache::store('frontend')->put('frontend_shared_data', 'sentinel', 300);

    $this->get('/');

    app(ContentService::class)->clearCache();

    $survivors = collect($sentinels)->filter(fn ($key) => Cache::has($key))->values();

    reportFact('Unrelated keys surviving a CMS purge', $survivors->count() . ' of ' . count($sentinels));

    expect($survivors)->toHaveCount(count($sentinels))
          ->and(Cache::store('frontend')->has('frontend_shared_data'))->toBeFalse();
});

it('purges frontend content through the console with or without the all option', function (array $arguments) {
    $this->get('/');

    expect(Cache::store('frontend')->has('frontend_shared_data'))->toBeTrue();

    $exitCode = Artisan::call('frontend:clear-cache', $arguments);

    expect($exitCode)->toBe(0)
          ->and(Cache::store('frontend')->has('frontend_shared_data'))->toBeFalse();
})->with([
    'no options' => [[]],
    'all pages' => [['--all' => true]],
]);

it('can still purge a single page through the console', function () {
    $this->get('/');

    expect(Cache::store('frontend')->has('frontend_shared_data'))->toBeTrue();

    $exitCode = Artisan::call('frontend:clear-cache', ['--page' => 'home']);

    reportFact('frontend:clear-cache --page=home', 'exit code ' . $exitCode . ' (works)');

    expect($exitCode)->toBe(0)
        ->and(Cache::store('frontend')->has('frontend_shared_data'))->toBeFalse();
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
