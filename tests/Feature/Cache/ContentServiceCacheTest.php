<?php

use App\Models\JobListing;
use App\Models\pages\Blog;
use App\Models\pages\Page;
use App\Models\pages\Program;
use App\Models\pages\Publication;
use App\Models\pages\SharedData;
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

it('serves ContentService::getPage() from cache on the second call', function () {
    $service = app(ContentService::class);

    $cold = measureCall(fn () => $service->getPage('home'));
    $warm = measureCall(fn () => $service->getPage('home'));

    reportMeasurement('ContentService::getPage("home")', $cold, $warm);

    expect($cold['count'])->toBe(1, 'the first call must query the pages table')
        ->and($warm['count'])->toBe(0, 'the second call must not touch SQL at all')
        ->and($cold['result'])->toBeInstanceOf(Page::class)
        ->and($warm['result'])->toBeInstanceOf(Page::class)
        ->and($warm['result']->slug)->toBe('home')
        ->and(Cache::has('page.home'))->toBeTrue();
});

it('keeps answering getPage() after the row is deleted from SQL', function () {
    $service = app(ContentService::class);

    $service->getPage('home');
    DB::table('pages')->where('slug', 'home')->delete();

    $after = measureCall(fn () => $service->getPage('home'));

    expect($after['count'])->toBe(0, 'a cached read must not query the database')
        ->and($after['result'])->toBeInstanceOf(Page::class)
        ->and($after['result']->slug)->toBe('home');
});

it('caches section configs, shared data, blogs, programs, publications and jobs', function () {
    $service = app(ContentService::class);

    $readers = [
        'getPageSections("home")' => fn () => $service->getPageSections('home'),
        'getSharedData("banner")' => fn () => $service->getSharedData('banner'),
        'getTopbar()' => fn () => $service->getTopbar(),
        'getBlogs()' => fn () => $service->getBlogs(),
        'getPrograms()' => fn () => $service->getPrograms(),
        'getPublications()' => fn () => $service->getPublications(),
        'getJobs()' => fn () => $service->getJobs(),
        'getSectionData("home", "intro")' => fn () => $service->getSectionData('home', 'intro'),
    ];

    $report = [];

    foreach ($readers as $label => $reader) {
        $cold = measureCall($reader);
        $warm = measureCall($reader);

        reportMeasurement('ContentService::' . $label, $cold, $warm);

        expect($cold['count'])->toBeGreaterThan(0, "{$label} should hit SQL when the cache is cold")
            ->and($warm['count'])->toBe(0, "{$label} must be served from cache on the second call");

        $report[$label] = ['cold' => $cold, 'warm' => $warm];
    }

    expect($report)->toHaveCount(8);
});

it('returns the correct cached payload types', function () {
    $service = app(ContentService::class);

    $service->getBlogs();
    $service->getPrograms();
    $service->getPublications();
    $service->getJobs();
    $service->getTopbar();

    expect(measureCall(fn () => $service->getBlogs())['result'])->each->toBeInstanceOf(Blog::class)
        ->and(measureCall(fn () => $service->getPrograms())['result'])->each->toBeInstanceOf(Program::class)
        ->and(measureCall(fn () => $service->getPublications())['result'])->each->toBeInstanceOf(Publication::class)
        ->and(measureCall(fn () => $service->getJobs())['result'])->each->toBeInstanceOf(JobListing::class)
        ->and(measureCall(fn () => $service->getTopbar())['result'])->toBeInstanceOf(SharedData::class);
});

it('caches the first load of a whole page in a single pass and replays it with 0 SQL', function () {
    $service = app(ContentService::class);

    $firstLoad = function () use ($service) {
        $service->getPage('home');
        $service->getPageSections('home');
        $service->getSharedData('banner');
        $service->getSharedData('topbar');
        $service->getSharedData('navbar');
        $service->getSharedData('footer');
        $service->getSharedData('stories');
        $service->getBlogs();
        $service->getPrograms();
        $service->getPublications();
        $service->getJobs();
        $service->getSectionData('home', 'intro');
    };

    $cold = measureCall($firstLoad);
    $warm = measureCall($firstLoad);

    reportMeasurement('full ContentService warm set (12 readers)', $cold, $warm);

    expect($cold['count'])->toBeGreaterThanOrEqual(10)
        ->and($warm['count'])->toBe(0, 'a fully warmed page must not issue a single SQL query')
        ->and($warm['ms'])->toBeLessThan($cold['ms']);
});

it('re-queries (does not cache) a null result for a missing page', function () {
    $service = app(ContentService::class);

    $first = measureCall(fn () => $service->getPage('does-not-exist'));
    $second = measureCall(fn () => $service->getPage('does-not-exist'));

    expect($first['count'])->toBe(1)
        ->and($second['count'])->toBe(1, 'null results are never stored by Cache::remember, so every 404 re-queries SQL')
        ->and($second['result'])->toBeNull();
});
