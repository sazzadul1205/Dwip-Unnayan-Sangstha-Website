<?php
// database/seeders/RBAC/UserRolesSeeder.php

namespace Database\Seeders\RBAC;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserRolesSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = DB::table('users')->where('email', 'superadmin@jobportal.com')->first();
        $adminUser = DB::table('users')->where('email', 'admin@jobportal.com')->first();
        $createdBy = $superAdmin?->id ?? $adminUser?->id ?? 1;

        $users = DB::table('users')->whereNull('deleted_at')->get();

        foreach ($users as $user) {
            $roleSlug = 'job-seeker';

            if ($user->email === 'superadmin@jobportal.com') {
                $roleSlug = 'super-admin';
            } elseif ($user->email === 'admin@jobportal.com') {
                $roleSlug = 'admin';
            } elseif (str_contains($user->email, '@company.com')) {
                $roleSlug = 'employer';
            }

            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if ($roleId) {
                DB::table('user_roles')->updateOrInsert(
                    ['user_id' => $user->id, 'role_id' => $roleId],
                    [
                        'assigned_by' => $createdBy,
                        'assigned_at' => now(),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}