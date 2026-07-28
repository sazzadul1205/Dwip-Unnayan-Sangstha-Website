<?php
// database/seeders/ResetAndSeedAll.php
// Run with: php artisan db:seed --class=ResetAndSeedAll

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ResetAndSeedAll extends Seeder
{
  public function run(): void
  {
    // ==========================================
    // COMPLETE RESET - DISABLE FOREIGN KEY CHECKS
    // ==========================================
    DB::statement('SET FOREIGN_KEY_CHECKS=0');

    // Get all table names
    $tables = DB::select('SHOW TABLES');
    $databaseName = env('DB_DATABASE');
    $tableKey = "Tables_in_{$databaseName}";

    // Tables to exclude (keep these)
    $excludeTables = ['migrations', 'failed_jobs', 'password_reset_tokens', 'personal_access_tokens', 'sessions'];

    foreach ($tables as $table) {
      $tableName = $table->{$tableKey};

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
    DB::statement('SET FOREIGN_KEY_CHECKS=1');

    $this->command->info('✅ All tables truncated successfully!');
    $this->command->info('🚀 Starting seeders...');

    // ==========================================
    // RUN ALL SEEDERS
    // ==========================================
    $this->call(DatabaseSeeder::class);
  }
}
