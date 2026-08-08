<?php

namespace App\Console\Commands;

use App\Services\PageMapService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class GenerateSitemap extends Command
{
  protected $signature = 'sitemap:generate';
  protected $description = 'Generate a sitemap from the dynamic page map';

  public function handle(PageMapService $pageMapService)
  {
    $this->info('Generating sitemap...');

    $urls = Cache::remember('sitemap_urls', 3600, function () use ($pageMapService) {
      return $pageMapService->getPublicUrls();
    });

    $xml = $this->buildSitemap($urls);

    Storage::disk('public')->put('sitemap.xml', $xml);

    $this->info('Sitemap generated successfully with ' . count($urls) . ' URLs.');
    $this->info('File saved to: ' . Storage::disk('public')->path('sitemap.xml'));
  }

  private function buildSitemap(array $urls): string
  {
    $appUrl = config('app.url');

    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    foreach ($urls as $url) {
      $fullUrl = $appUrl . $url;
      $xml .= "  <url>\n";
      $xml .= "    <loc>" . htmlspecialchars($fullUrl) . "</loc>\n";
      $xml .= "    <lastmod>" . now()->toDateString() . "</lastmod>\n";
      $xml .= "    <changefreq>weekly</changefreq>\n";
      $xml .= "    <priority>0.8</priority>\n";
      $xml .= "  </url>\n";
    }

    $xml .= '</urlset>';

    return $xml;
  }
}
