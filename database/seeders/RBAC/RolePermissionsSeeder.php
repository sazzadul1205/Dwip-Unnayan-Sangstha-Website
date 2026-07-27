<?php
// database/seeders/RBAC/RolePermissionsSeeder.php

namespace Database\Seeders\RBAC;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolePermissionsSeeder extends Seeder
{
  public function run(): void
  {
    // Get role IDs
    $superAdminRoleId = DB::table('roles')->where('slug', 'super-admin')->value('id');
    $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
    $employerRoleId = DB::table('roles')->where('slug', 'employer')->value('id');

    // Get all permission IDs
    $allPermissionIds = DB::table('permissions')->pluck('id');

    // Clear existing role_permissions
    DB::table('role_permissions')->whereIn('role_id', [
      $superAdminRoleId,
      $adminRoleId,
      $employerRoleId,
    ])->delete();

    // SUPER ADMIN – all permissions
    foreach ($allPermissionIds as $permissionId) {
      DB::table('role_permissions')->updateOrInsert(
        ['role_id' => $superAdminRoleId, 'permission_id' => $permissionId],
        ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
      );
    }

    // ADMIN – all permissions
    foreach ($allPermissionIds as $permissionId) {
      DB::table('role_permissions')->updateOrInsert(
        ['role_id' => $adminRoleId, 'permission_id' => $permissionId],
        ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
      );
    }

    // EMPLOYER – employment related (excluding CMS, logs, cache, backup, etc.)
    $employerPermissionSlugs = [
      // Dashboard
      'dashboard.view',
      'dashboard.stats.view',
      'dashboard.employer',

      // Job Listings
      'job_listings.view',
      'job_listings.create',
      'job_listings.store',
      'job_listings.edit',
      'job_listings.update',
      'job_listings.show',
      'job_listings.destroy',
      'job_listings.toggle_active',
      'job_listings.applications',
      'job.view.any',
      'job.view.own',
      'job.edit.own',
      'jobs.manage',

      // Applications (employer side)
      'applications.view',
      'applications.view.for_own_jobs',
      'applications.show',
      'applications.status.update',
      'applications.bulk_status.update',
      'applications.download_resume',
      'applications.bulk_download_resumes',
      'applications.email.send',
      'applications.bulk_email.send',
      'application.view.own',
      'application.view.any',
      'application.shortlist',
      'application.reject',

      // Categories & Locations (read only)
      'categories.view',
      'category.view',
      'categories.get_active',
      'locations.view',
      'location.view',
      'locations.get_active',

      // Employer Profile
      'employer_profile.view',
      'employer_profile.edit',
      'employer_profile.update',
      'employer_profile.update_password',

      // Notifications
      'notifications.view',
      'notifications.mark_read',
      'notifications.mark_all_read',

      // Statistics (employer‑relevant)
      'statistics.view',
      'statistics.ats',
      'statistics.jobs',
      'statistics.dashboard',

      // Applicant Profiles (read only)
      'applicant-profiles.view',
      'applicant-profiles.view.any',
      'applicant-profiles.show',
    ];

    foreach ($employerPermissionSlugs as $slug) {
      $permId = DB::table('permissions')->where('slug', $slug)->value('id');
      if ($permId) {
        DB::table('role_permissions')->updateOrInsert(
          ['role_id' => $employerRoleId, 'permission_id' => $permId],
          ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
        );
      }
    }

    // Job Seeker – no permissions (they use public routes only)
  }
}
