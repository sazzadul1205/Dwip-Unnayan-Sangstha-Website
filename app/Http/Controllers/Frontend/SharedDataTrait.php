<?php
// app/Http/Controllers/Frontend/SharedDataTrait.php

namespace App\Http\Controllers\Frontend;

use App\Models\pages\SharedData;

trait SharedDataTrait
{
  /**
   * Get shared data for all frontend pages (TopBar, Navbar, Footer)
   */
  public function getSharedData(): array
  {
    // Define a closure to transform asset placeholders into actual URLs
    $asset = function ($path) {
      return route('asset', ['path' => ltrim($path, '/')]);
    };

    // Define the types of shared data we want to retrieve
    $sharedTypes = [
      'topbar' => 'topbarData',
      'navbar' => 'navbarData',
      'footer' => 'footerData',
    ];

    // Initialize an array to hold the shared data
    $sharedData = [];

    // Loop through each shared data type and retrieve the corresponding record from the database
    foreach ($sharedTypes as $type => $key) {
      $record = SharedData::where('type', $type)
        ->where('is_active', true)
        ->first();

      // Transform the data and store it in the sharedData array, or set it to an empty array if no record is found
      $sharedData[$key] = $record ? $this->transformAssetUrls($record->data ?? [], $asset) : [];
    }

    // Return the shared data array containing topbar, navbar, and footer data
    return $sharedData;
  }

  /**
   * Transform asset placeholders in data
   */
  private function transformAssetUrls(array $data, callable $asset): array
  {
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
}
