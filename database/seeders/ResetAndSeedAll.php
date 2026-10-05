<?php
// database/seeders/ResetAndSeedAll.php
// Run with: php artisan db:seed --class=ResetAndSeedAll

namespace Database\Seeders;

use App\Services\CurrentDatabaseTables;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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

    // Listing the tables unqualified keeps `migrations` comparable against the
    // bare name below; comparing it against a schema-qualified "db.migrations"
    // never matched, so migrations were truncated along with everything else
    // and the app then believed no migration had ever run.
    foreach (CurrentDatabaseTables::names() as $name) {
      // Skip excluded tables
      if (in_array($name, $excludeTables)) {
        continue;
      }

      DB::table($name)->truncate();
      $this->command->info("🗑️ Truncated: {$name}");
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
