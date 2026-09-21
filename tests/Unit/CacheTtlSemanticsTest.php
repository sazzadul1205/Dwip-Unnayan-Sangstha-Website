<?php

use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\Repository;
use Illuminate\Support\Facades\Cache;

it('documents that an integer TTL handed to Cache::remember is interpreted as seconds', function () {
    $repository = new Repository(new ArrayStore());
    $getSeconds = new ReflectionMethod($repository, 'getSeconds');

    $seconds = $getSeconds->invoke($repository, 60);

    reportFact('Repository::getSeconds(60)', $seconds . ' -> seconds, not minutes');

    expect($seconds)->toBe(60);
});

it('expires a 60 second cache entry after 61 seconds', function () {
    Cache::put('ttl.probe', 'value', 60);

    expect(Cache::get('ttl.probe'))->toBe('value');

    $this->travel(61)->seconds();

    expect(Cache::get('ttl.probe'))->toBeNull();

    $this->travelBack();
});

it('keeps a 300 second entry alive after 299 seconds', function () {
    Cache::put('ttl.probe.300', 'value', 300);

    $this->travel(299)->seconds();

    expect(Cache::get('ttl.probe.300'))->toBe('value');

    $this->travel(2)->seconds();

    expect(Cache::get('ttl.probe.300'))->toBeNull();

    $this->travelBack();
});
