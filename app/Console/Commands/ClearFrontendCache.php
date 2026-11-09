<?php
// app/Console/Commands/ClearFrontendCache.php

namespace App\Console\Commands;

use App\Services\ContentService;
use Illuminate\Console\Command;

class ClearFrontendCache extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'frontend:clear-cache {--page= : Clear cache for a specific page} {--all : Clear all frontend cache}';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Clear frontend cache to force fresh data fetching';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    if ($this->option('all')) {
      $this->clearAllFrontendCache();
      $this->info('✅ All frontend cache has been cleared.');
      return;
    }

    if ($this->option('page')) {
      $pageSlug = $this->option('page');
      $this->clearPageCache($pageSlug);
      $this->info("✅ Frontend cache cleared (requested page '{$pageSlug}').");
      return;
    }

    // Default: clear all
    $this->clearAllFrontendCache();
    $this->info('✅ All frontend cache has been cleared.');
  }

  /**
   * Clear all frontend cache
   */
  private function clearAllFrontendCache(): void
  {
    app(ContentService::class)->clearCache();
  }

  /**
   * Clear cache for a specific page
   */
  private function clearPageCache(string $pageSlug): void
  {
    app(ContentService::class)->clearCache();
  }
}
