<?php

use App\Models\pages\Page;
use App\Services\ContentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\Support\SeedsFrontendContent;

uses(RefreshDatabase::class, SeedsFrontendContent::class);

beforeEach(function () {
    Cache::flush();
    Cache::store('frontend')->flush();
    $this->seedFrontendContent();

    config(['cache.default' => 'database']);
    Cache::store('database')->flush();
    $this->withoutVite();
});

it('serves frontend cache hits without querying the database even when the default store is database', function () {
    $service = app(ContentService::class);

    $miss = measureCall(fn () => $service->getPage('home'));
    $hit = measureCall(fn () => $service->getPage('home'));
    $bypass = measureCall(fn () => Page::where('slug', 'home')->where('is_active', true)->first());

    reportMeasurement('getPage("home") via frontend file store', $miss, $hit, $bypass);

    expect($miss['count'])->toBe(1, 'a cache miss should only query the pages table')
        ->and($hit['count'])->toBe(0, 'a cache hit must not query either the content or cache tables')
        ->and($hit['result']->slug)->toBe('home');
});

it('uses a five minute TTL for frontend content data', function () {
    $property = new ReflectionProperty(ContentService::class, 'cacheSeconds');
    $ttl = $property->getValue(app(ContentService::class));

    app(ContentService::class)->getPage('home');
    app(ContentService::class)->getSharedData('banner');

    expect($ttl)->toBe(300)
        ->and(Cache::store('frontend')->has('page.home'))->toBeTrue()
        ->and(Cache::store('frontend')->has('shared.banner'))->toBeTrue()
        ->and(DB::table('cache')->whereIn('key', ['page.home', 'shared.banner'])->count())->toBe(0);
});

it('stores public page and shared data in the dedicated frontend store', function () {
    $this->get('/')->assertOk();

    expect(Cache::store('frontend')->has('page_sections_home'))->toBeTrue()
        ->and(Cache::store('frontend')->has('frontend_shared_data'))->toBeTrue()
        ->and(DB::table('cache')->count())->toBe(0);
});

it('stores a page model in the frontend cache without losing its attributes', function () {
    $service = app(ContentService::class);
    $service->getPage('home');

    $restored = Cache::store('frontend')->get('page.home');

    expect($restored)->toBeInstanceOf(Page::class)
        ->and($restored->slug)->toBe('home')
        ->and(DB::table('cache')->where('key', 'page.home')->exists())->toBeFalse();
});

it('keeps frontend cache data out of the database cache table', function () {
    $this->get('/')->assertOk();

    $keys = DB::table('cache')->pluck('key')->all();

    expect($keys)->toBeEmpty()
        ->and(Cache::store('frontend')->has('page_sections_home'))->toBeTrue()
        ->and(Cache::store('frontend')->has('frontend_shared_data'))->toBeTrue();
});
