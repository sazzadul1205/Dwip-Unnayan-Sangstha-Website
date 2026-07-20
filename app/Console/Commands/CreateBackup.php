<?php
// app/Console/Commands/CreateBackup.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Http\Controllers\Backup\BackupController;

class CreateBackup extends Command
{
  protected $signature = 'backup:create-auto {--type=full}';
  protected $description = 'Create an automatic backup';

  public function handle(BackupController $backupController)
  {
    $this->info('Creating automatic backup...');

    try {
      $type = $this->option('type');
      $backupController->createAuto(request()->merge(['type' => $type]));
      $this->info('Backup created successfully!');
      return 0;
    } catch (\Exception $e) {
      $this->error('Backup failed: ' . $e->getMessage());
      return 1;
    }
  }
}
