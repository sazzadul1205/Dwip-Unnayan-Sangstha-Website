<?php
// database/seeders/RBAC/RolesSeeder.php

namespace Database\Seeders\RBAC;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
  public function run(): void
  {
    $superAdmin = DB::table('users')->where('email', 'superadmin@jobportal.com')->first();
    $adminUser = DB::table('users')->where('email', 'admin@jobportal.com')->first();
    $createdBy = $superAdmin?->id ?? $adminUser?->id ?? 1;

    $roles = [
      [
        'name' => 'Super Admin',
        'slug' => 'super-admin',
        'description' => 'Full system access with all permissions',
        'level' => 100,
        'is_default' => false,
        'is_active' => true,
        'created_by' => $createdBy,
        'updated_by' => $createdBy,
      ],
      [
        'name' => 'Admin',
        'slug' => 'admin',
        'description' => 'Administrative access with most permissions',
        'level' => 90,
        'is_default' => false,
        'is_active' => true,
        'created_by' => $createdBy,
        'updated_by' => $createdBy,
      ],
      [
        'name' => 'Employer',
        'slug' => 'employer',
        'description' => 'Employer who can post jobs and manage applications',
        'level' => 50,
        'is_default' => false,
        'is_active' => true,
        'created_by' => $createdBy,
        'updated_by' => $createdBy,
      ],
      [
        'name' => 'Job Seeker',
        'slug' => 'job-seeker',
        'description' => 'Regular job seeker who can apply to jobs',
        'level' => 20,
        'is_default' => true,
        'is_active' => true,
        'created_by' => $createdBy,
        'updated_by' => $createdBy,
      ],
    ];

    DB::statement('SET FOREIGN_KEY_CHECKS=0');
    DB::table('roles')->truncate();
    DB::statement('SET FOREIGN_KEY_CHECKS=1');

    foreach ($roles as $role) {
      DB::table('roles')->updateOrInsert(
        ['slug' => $role['slug']],
        [
          'name' => $role['name'],
          'description' => $role['description'],
          'level' => $role['level'],
          'is_default' => $role['is_default'],
          'is_active' => $role['is_active'],
          'created_by' => $role['created_by'],
          'updated_by' => $role['updated_by'],
          'created_at' => now(),
          'updated_at' => now(),
        ]
      );
    }
  }
}
