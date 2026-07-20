<?php
// app/Providers/BackupServiceProvider.php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Console\Scheduling\Schedule;

class BackupServiceProvider extends ServiceProvider
{
  public function boot()
  {
    if ($this->app->runningInConsole()) {
      $this->commands([
        \App\Console\Commands\CreateBackup::class,
      ]);
    }

    // Schedule automatic backups
    $this->app->booted(function () {
      $schedule = $this->app->make(Schedule::class);
      $schedule->command('backup:create-auto')->daily()->at('02:00');
      $schedule->command('backup:create-auto')->weekly()->sundays()->at('03:00');
    });
  }
}
