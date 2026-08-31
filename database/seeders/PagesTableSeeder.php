<?php
// database/seeders/PagesTableSeeder.php
// Convenience wrapper so `php artisan db:seed --class=PagesTableSeeder` works.
// The actual implementation lives in Database\Seeders\pages\PagesTableSeeder.

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PagesTableSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(\Database\Seeders\pages\PagesTableSeeder::class);
    }
}