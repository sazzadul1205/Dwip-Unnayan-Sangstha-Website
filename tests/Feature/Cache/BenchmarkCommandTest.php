<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\Support\SeedsFrontendContent;

uses(RefreshDatabase::class, SeedsFrontendContent::class);

it('runs the cache pipeline benchmark end to end', function () {
    Cache::flush();
    $this->seedFrontendContent();
    $this->withoutVite();

    $this->artisan('dus:cache-benchmark', ['--iterations' => 1])
        ->expectsOutputToContain('Cache is WORKING')
        ->assertExitCode(0);
});

it('supports the --json report mode', function () {
    $exitCode = $this->artisan('dus:cache-benchmark', ['--iterations' => 1, '--json' => true])->run();

    expect($exitCode)->toBe(0);
});
