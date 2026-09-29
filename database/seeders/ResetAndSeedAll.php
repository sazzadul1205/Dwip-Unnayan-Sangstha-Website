<?php
// database/seeders/ResetAndSeedAll.php
// Run with: php artisan db:seed --class=ResetAndSeedAll

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetAndSeedAll extends Seeder
{
  public function run(): void
  {
    // ==========================================
    // COMPLETE RESET - DISABLE FOREIGN KEY CHECKS
    // ==========================================
    $driver = DB::getDriverName();
    if ($driver === 'mysql') {
      DB::statement('SET FOREIGN_KEY_CHECKS=0');
    } elseif ($driver === 'sqlite') {
      DB::statement('PRAGMA foreign_keys = OFF');
    }

    // Tables to exclude (keep these)
    $excludeTables = ['migrations', 'failed_jobs', 'password_reset_tokens', 'personal_access_tokens', 'sessions'];

    foreach (Schema::getTableListing() as $tableName) {
      // Skip excluded tables
      if (in_array($tableName, $excludeTables)) {
        continue;
      }

      DB::table($tableName)->truncate();
      $this->command->info("🗑️ Truncated: {$tableName}");
    }

    // ==========================================
    // RE-ENABLE FOREIGN KEY CHECKS
    // ==========================================
    if ($driver === 'mysql') {
      DB::statement('SET FOREIGN_KEY_CHECKS=1');
    } elseif ($driver === 'sqlite') {
      DB::statement('PRAGMA foreign_keys = ON');
    }

    $this->command->info('✅ All tables truncated successfully!');
    $this->command->info('🚀 Starting seeders...');

    // ==========================================
    // RUN ALL SEEDERS
    // ==========================================
    $this->call(DatabaseSeeder::class);
  }
}
