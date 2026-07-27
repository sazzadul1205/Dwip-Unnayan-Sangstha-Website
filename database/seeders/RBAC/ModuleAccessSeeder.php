<?php
// database/seeders/RBAC/ModuleAccessSeeder.php

namespace Database\Seeders\RBAC;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModuleAccessSeeder extends Seeder
{
  public function run(): void
  {
    $superAdminRoleId = DB::table('roles')->where('slug', 'super-admin')->value('id');
    $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
    $employerRoleId = DB::table('roles')->where('slug', 'employer')->value('id');
    $jobSeekerRoleId = DB::table('roles')->where('slug', 'job-seeker')->value('id');

    DB::table('role_module_access')->whereIn('role_id', [
      $superAdminRoleId,
      $adminRoleId,
      $employerRoleId,
      $jobSeekerRoleId
    ])->delete();

    $moduleAccess = [
      // ==================== SUPER ADMIN ====================
      ['role_id' => $superAdminRoleId, 'module' => 'dashboard', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'cms', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'pages', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'about', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'blogs', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'programs', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'publications', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'custom_sections', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'shared_data', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'sections', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'job_listings', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'public_jobs', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'applications', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'categories', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'locations', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'applicant_profiles', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'profiles', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'admin_profile', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'employer_profile', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'notifications', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'roles', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'users', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'statistics', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'logs', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'cache', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'newsletter', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'backup', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'apply', 'access_level' => 'manage'],

      // ==================== ADMIN ====================
      ['role_id' => $adminRoleId, 'module' => 'dashboard', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'cms', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'pages', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'about', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'blogs', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'programs', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'publications', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'custom_sections', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'shared_data', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'sections', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'job_listings', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'public_jobs', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'applications', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'categories', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'locations', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'applicant_profiles', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'profiles', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'admin_profile', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'employer_profile', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'notifications', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'roles', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'users', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'statistics', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'logs', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'cache', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'newsletter', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'backup', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'apply', 'access_level' => 'manage'],

      // ==================== EMPLOYER ====================
      ['role_id' => $employerRoleId, 'module' => 'dashboard', 'access_level' => 'write'],
      ['role_id' => $employerRoleId, 'module' => 'job_listings', 'access_level' => 'write'],
      ['role_id' => $employerRoleId, 'module' => 'applications', 'access_level' => 'write'],
      ['role_id' => $employerRoleId, 'module' => 'categories', 'access_level' => 'read'],
      ['role_id' => $employerRoleId, 'module' => 'locations', 'access_level' => 'read'],
      ['role_id' => $employerRoleId, 'module' => 'employer_profile', 'access_level' => 'write'],
      ['role_id' => $employerRoleId, 'module' => 'notifications', 'access_level' => 'write'],
      ['role_id' => $employerRoleId, 'module' => 'statistics', 'access_level' => 'read'],
      ['role_id' => $employerRoleId, 'module' => 'applicant_profiles', 'access_level' => 'read'],
      ['role_id' => $employerRoleId, 'module' => 'profiles', 'access_level' => 'read'],
      ['role_id' => $employerRoleId, 'module' => 'public_jobs', 'access_level' => 'read'],

      // ==================== JOB SEEKER ====================
      ['role_id' => $jobSeekerRoleId, 'module' => 'dashboard', 'access_level' => 'no_access'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'public_jobs', 'access_level' => 'no_access'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'apply', 'access_level' => 'no_access'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'profiles', 'access_level' => 'no_access'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'applicant_profiles', 'access_level' => 'no_access'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'notifications', 'access_level' => 'no_access'],
    ];

    foreach ($moduleAccess as $access) {
      DB::table('role_module_access')->updateOrInsert(
        ['role_id' => $access['role_id'], 'module' => $access['module']],
        ['access_level' => $access['access_level'], 'created_at' => now(), 'updated_at' => now()]
      );
    }
  }
}
