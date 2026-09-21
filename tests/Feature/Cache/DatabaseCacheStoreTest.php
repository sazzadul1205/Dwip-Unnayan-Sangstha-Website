<?php

use App\Models\pages\Page;
use App\Services\ContentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\Support\SeedsFrontendContent;

uses(RefreshDatabase::class, SeedsFrontendContent::class);

/*
| Production uses CACHE_STORE=database (.env). This file reproduces that store
| so the numbers reflect what the real deployment does: every cache lookup is
| itself a SQL statement against the `cache` table.
*/

beforeEach(function () {
    Cache::flush();
    $this->seedFrontendContent();

    config(['cache.default' => 'database']);
    Cache::store('database')->flush();
    $this->withoutVite();
});

it('turns a cache miss into a cache hit but still issues one SQL query per hit', function () {
    $service = app(ContentService::class);

    $miss = measureCall(fn () => $service->getPage('home'));
    $hit = measureCall(fn () => $service->getPage('home'));
    $bypass = measureCall(fn () => Page::where('slug', 'home')->where('is_active', true)->first());

    reportMeasurement('getPage("home") via database store', $miss, $hit, $bypass);

    expect($miss['count'])->toBe(3, 'miss = cache select + pages select + cache insert')
        ->and($hit['count'])->toBe(1, 'hit = a single select against the cache table')
        ->and($hit['queries'][0])->toContain('cache')
        ->and($hit['result']->slug)->toBe('home');
});

it('writes a 60 second TTL although the property is named $cacheMinutes = 60', function () {
    $property = new ReflectionProperty(ContentService::class, 'cacheMinutes');
    $declaredValue = $property->getValue(app(ContentService::class));

    app(ContentService::class)->getPage('home');

    $pageKeyTtl = (int) DB::table('cache')->where('key', 'page.home')->value('expiration') - now()->getTimestamp();

    app(ContentService::class)->getSharedData('banner');

    $sharedKeyTtl = (int) DB::table('cache')->where('key', 'shared.banner')->value('expiration') - now()->getTimestamp();

    reportFact('ContentService::$cacheMinutes (intended)', $declaredValue . ' minutes');
    reportFact('TTL actually written for Cache::remember keys', $pageKeyTtl . ' seconds');
    reportFact('TTL actually written for getSharedData (cacheMinutes * 60)', $sharedKeyTtl . ' seconds');

    expect($declaredValue)->toBe(60)
        ->and($pageKeyTtl)->toBeGreaterThanOrEqual(55)->toBeLessThanOrEqual(60)
        ->and($sharedKeyTtl)->toBeGreaterThanOrEqual(3590)->toBeLessThanOrEqual(3600);
});

it('records every TTL the page controller writes for a home page request', function () {
    $this->get('/')->assertOk();

    $expected = [
        'page_sections_home' => 300,
        'frontend_shared_data' => 300,
    ];

    foreach ($expected as $key => $intendedTtl) {
        $expiration = DB::table('cache')->where('key', $key)->value('expiration');

        expect($expiration)->not->toBeNull("cache key {$key} was never written");

        $ttl = (int) $expiration - now()->getTimestamp();
        reportFact("TTL written for {$key}", $ttl . ' seconds (intended ' . $intendedTtl . 's)');

        expect($ttl)->toBeGreaterThanOrEqual($intendedTtl - 5)
            ->toBeLessThanOrEqual($intendedTtl);
    }
});

it('stores a page model object in the cache table without losing its attributes', function () {
    $service = app(ContentService::class);
    $service->getPage('home');

    $raw = DB::table('cache')->where('key', 'page.home')->value('value');

    // SQLite/Postgres payloads are base64 encoded when they contain null bytes
    // (see Illuminate\Cache\DatabaseStore::serialize()).
    $payload = (str_contains($raw, ':') || str_contains($raw, ';')) ? $raw : base64_decode($raw);
    $restored = unserialize($payload);

    reportFact('Serialized page.home payload', strlen($raw) . ' bytes of ' . get_class($restored));

    expect($raw)->toBeString()
        ->and($restored)->toBeInstanceOf(Page::class)
        ->and($restored->slug)->toBe('home')
        ->and(strlen($raw))->toBeGreaterThan(100);
});

it('reports how much payload the cache table holds for the frontend keys', function () {
    $this->get('/')->assertOk();

    $keys = DB::table('cache')->pluck('key')->all();
    $bytes = (int) DB::table('cache')->selectRaw('SUM(LENGTH(value)) as total')->value('total');

    reportFact('cache rows after one home page request', count($keys) . ' rows');
    reportFact('cache table payload', $bytes . ' bytes');
    reportFact('cache keys', implode(', ', $keys));

    expect($keys)->toContain('page_sections_home')
        ->and($keys)->toContain('frontend_shared_data')
        ->and($bytes)->toBeGreaterThan(0);
});
