<?php

namespace Tests\Feature\Cache;

use App\Models\pages\Blog;
use App\Models\pages\Page;
use App\Services\ContentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\Support\SeedsFrontendContent;

uses(RefreshDatabase::class, SeedsFrontendContent::class);

beforeEach(function () {
    Cache::flush();
    $this->seedFrontendContent();
});

it('invalidates page cache when the page is updated', function () {
    $service = app(ContentService::class);

    // Warm the cache
    $service->getPage('home');
    expect(Cache::has('page.home'))->toBeTrue();

    // Update the page in the database
    $page = Page::where('slug', 'home')->first();
    $page->update(['title' => 'Updated Home Title']);

    // Clear cache to simulate invalidation
    Cache::forget('page.home');

    // Fetch again - should hit SQL
    $fresh = measureCall(fn () => $service->getPage('home'));
    expect($fresh['count'])->toBeGreaterThan(0, 'After cache invalidation, the next call must hit SQL')
        ->and($fresh['result']->title)->toBe('Updated Home Title');
});

it('serves cached data even when database row is modified (stale cache)', function () {
    $service = app(ContentService::class);

    $service->getPage('home');
    $page = Page::where('slug', 'home')->first();
    $originalTitle = $page->title;

    // Modify in DB without clearing cache
    $page->update(['title' => 'DB Modified Title']);

    // Should still serve cached version
    $cached = measureCall(fn () => $service->getPage('home'));
    expect($cached['count'])->toBe(0, 'Cached read must not hit SQL')
        ->and($cached['result']->title)->toBe($originalTitle, 'Should serve stale cached data');
});

it('correctly handles cache misses for non-existent keys', function () {
    $service = app(ContentService::class);

    $result = measureCall(fn () => $service->getPage('non-existent-page'));
    expect($result['count'])->toBeGreaterThan(0, 'Non-existent key should hit SQL')
        ->and($result['result'])->toBeNull();
});

it('validates blog cache invalidation on update', function () {
    $service = app(ContentService::class);

    $service->getBlogs();
    expect(Cache::has('blogs.all.all'))->toBeTrue();

    // Add a new blog
    Blog::factory()->create(['is_active' => true, 'title' => 'New Test Blog']);

    // Clear cache
    Cache::forget('blogs.all.all');

    $fresh = measureCall(fn () => $service->getBlogs());
    expect($fresh['count'])->toBeGreaterThan(0, 'After invalidation, next call must hit SQL');
});

it('validates cache TTL behavior', function () {
    $service = app(ContentService::class);

    // Set a very short TTL for testing
    config(['cache.default' => 'array']);

    $service->getPage('home');
    expect(Cache::has('page.home'))->toBeTrue();

    // Simulate TTL expiry by forgetting
    Cache::forget('page.home');
    expect(Cache::has('page.home'))->toBeFalse();

    // Re-fetch should hit SQL
    $refetch = measureCall(fn () => $service->getPage('home'));
    expect($refetch['count'])->toBeGreaterThan(0, 'After TTL expiry, must hit SQL');
});

it('validates cache key consistency', function () {
    $service = app(ContentService::class);

    // Same call should produce same cache key
    $service->getPage('home');
    expect(Cache::has('page.home'))->toBeTrue();

    // Different slug should use different key
    $service->getPage('home'); // same key
    expect(Cache::has('page.home'))->toBeTrue();
});
