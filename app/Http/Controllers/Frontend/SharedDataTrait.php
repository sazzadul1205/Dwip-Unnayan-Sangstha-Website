<?php

namespace App\Http\Controllers\Frontend;

use App\Models\pages\SharedData;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

trait SharedDataTrait
{
  /**
   * Cache duration in minutes.
   */
  protected int $sharedDataCacheMinutes = 5;

  /**
   * Get shared data for all frontend pages.
   *
   * @return array<string, mixed>  Keys: topbarData, navbarData, footerData, storiesData
   */
  public function getSharedData(): array
  {
    // Cache the entire result to avoid multiple DB queries per request
    return Cache::remember('frontend_shared_data', $this->sharedDataCacheMinutes * 60, function () {
      $asset = fn(string $path): string => route('asset', ['path' => ltrim($path, '/')]);

      return $this->fetchSharedData($asset);
    });
  }

  /**
   * Fetch shared data from the database.
   *
   * @param callable(string): string $asset  Asset URL generator
   * @return array<string, mixed>
   */
  private function fetchSharedData(callable $asset): array
  {
    $sharedTypes = [
      'topbar'  => 'topbarData',
      'navbar'  => 'navbarData',
      'footer'  => 'footerData',
      'stories' => 'storiesData',
    ];

    $sharedData = [];

    foreach ($sharedTypes as $type => $key) {
      try {
        $record = SharedData::where('type', $type)
          ->where('is_active', true)
          ->first();

        if ($record && !empty($record->data)) {
          $data = is_string($record->data) ? json_decode($record->data, true) : $record->data;
          $sharedData[$key] = $this->transformAssetUrls($data ?? [], $asset);
        } else {
          $sharedData[$key] = [];
        }
      } catch (\Exception $e) {
        Log::error("Failed to fetch shared data for type: {$type}", [
          'error' => $e->getMessage(),
        ]);
        $sharedData[$key] = [];
      }
    }

    return $sharedData;
  }

  /**
   * Recursively transform asset: paths to actual URLs.
   *
   * @param mixed $data      The data to transform (array, string, or other)
   * @param callable $asset  Asset URL generator
   * @param int $depth       Current recursion depth (prevents infinite loops)
   * @return mixed
   */
  private function transformAssetUrls($data, callable $asset, int $depth = 0)
  {
    // Safety: prevent deep recursion (max 10 levels)
    if ($depth > 10) {
      Log::warning('transformAssetUrls recursion depth exceeded', ['depth' => $depth]);
      return $data;
    }

    // If it's a string with 'asset:' prefix, replace it
    if (is_string($data) && str_starts_with($data, 'asset:')) {
      $path = substr($data, 6);
      return $asset($path);
    }

    // If it's an array, recurse
    if (is_array($data)) {
      $result = [];
      foreach ($data as $key => $value) {
        $result[$key] = $this->transformAssetUrls($value, $asset, $depth + 1);
      }
      return $result;
    }

    // Other types (int, bool, null) – return as is
    return $data;
  }

  /**
   * Clear the shared data cache (useful after updating shared data in admin).
   */
  public function clearSharedDataCache(): void
  {
    Cache::forget('frontend_shared_data');
    Log::info('Shared data cache cleared');
  }
}
