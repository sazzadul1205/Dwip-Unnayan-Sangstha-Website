<?php
// database/seeders/PermissionsSeeder.php
// Convenience wrapper so `php artisan db:seed --class=PermissionsSeeder` works.
// The actual implementation lives in Database\Seeders\RBAC\PermissionsSeeder.

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(\Database\Seeders\RBAC\PermissionsSeeder::class);
    }
}