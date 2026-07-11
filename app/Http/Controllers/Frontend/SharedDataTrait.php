<?php
// app/Http/Controllers/Frontend/SharedDataTrait.php

namespace App\Http\Controllers\Frontend;

use App\Models\pages\SharedData;

trait SharedDataTrait
{
  /**
   * Get shared data for all frontend pages
   * (TopBar, Navbar, Footer, Stories)
   */
  public function getSharedData(): array
  {
    $asset = function ($path) {
      return route('asset', ['path' => ltrim($path, '/')]);
    };

    return $this->fetchSharedData($asset);
  }

  /**
   * Fetch shared data from database
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
      $record = SharedData::where('type', $type)
        ->where('is_active', true)
        ->first();

      $sharedData[$key] = $record && !empty($record->data)
        ? $this->transformAssetUrls($record->data, $asset)
        : [];
    }

    return $sharedData;
  }

  /**
   * Transform asset placeholders in data
   */
  private function transformAssetUrls($data, callable $asset): array
  {
    // If data is not an array, try to decode it from JSON
    if (is_string($data)) {
      $decoded = json_decode($data, true);
      if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $data = $decoded;
      } else {
        // If it's a string that's not JSON, return it as a string in an array
        return $this->transformStringValue($data, $asset);
      }
    }

    // If data is null or not an array, return empty array
    if (!is_array($data)) {
      return [];
    }

    $transformed = [];

    foreach ($data as $key => $value) {
      if (is_array($value)) {
        $transformed[$key] = $this->transformAssetUrls($value, $asset);
      } elseif (is_string($value) && str_starts_with($value, 'asset:')) {
        $path = substr($value, 6);
        $transformed[$key] = $asset($path);
      } else {
        $transformed[$key] = $value;
      }
    }

    return $transformed;
  }

  /**
   * Transform a string value that might contain asset placeholders
   */
  private function transformStringValue(string $value, callable $asset): array
  {
    // If the string contains asset: prefix, transform it
    if (str_starts_with($value, 'asset:')) {
      $path = substr($value, 6);
      return [$asset($path)];
    }

    // Otherwise return the string as is in an array
    return [$value];
  }
}
