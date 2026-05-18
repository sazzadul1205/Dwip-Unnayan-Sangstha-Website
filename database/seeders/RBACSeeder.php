<?php
// database/seeders/RBACSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RBACSeeder extends Seeder
{
  public function run(): void
  {
    // Get super admin user (first admin user created)
    $superAdmin = DB::table('users')->where('email', 'superadmin@jobportal.com')->first();
    $adminUser = DB::table('users')->where('email', 'admin@jobportal.com')->first();
    $createdBy = $superAdmin?->id ?? $adminUser?->id ?? 1;

    // Disable foreign key checks to allow truncation
    DB::statement('SET FOREIGN_KEY_CHECKS=0');

    // Clear existing data in correct order
    DB::table('user_roles')->truncate();
    DB::table('role_permissions')->truncate();
    DB::table('role_module_access')->truncate();
    DB::table('permissions')->truncate();
    DB::table('roles')->truncate();

    // Re-enable foreign key checks
    DB::statement('SET FOREIGN_KEY_CHECKS=1');

    // ==========================================
    // 1. INSERT ALL PERMISSIONS (NO DUPLICATE NAMES)
    // ==========================================
    $permissions = [
      // Dashboard Module
      ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard', 'action' => 'view'],
      ['name' => 'View Dashboard Stats', 'slug' => 'dashboard.stats.view', 'module' => 'dashboard', 'action' => 'stats_view'],
      ['name' => 'View Dashboard Quick Actions', 'slug' => 'dashboard.quick_actions.view', 'module' => 'dashboard', 'action' => 'quick_actions_view'],
      ['name' => 'View Dashboard Recent Activity', 'slug' => 'dashboard.recent_activity.view', 'module' => 'dashboard', 'action' => 'recent_activity_view'],
      ['name' => 'Job Seeker Dashboard', 'slug' => 'dashboard.job_seeker', 'module' => 'dashboard', 'action' => 'job_seeker'],
      ['name' => 'Employer Dashboard', 'slug' => 'dashboard.employer', 'module' => 'dashboard', 'action' => 'employer'],
      ['name' => 'Admin Dashboard', 'slug' => 'dashboard.admin', 'module' => 'dashboard', 'action' => 'admin'],

      // Job Listings Module - Core CRUD
      ['name' => 'View Job Listings', 'slug' => 'job_listings.view', 'module' => 'job_listings', 'action' => 'view'],
      ['name' => 'Create Job Listing', 'slug' => 'job_listings.create', 'module' => 'job_listings', 'action' => 'create'],
      ['name' => 'Edit Job Listing', 'slug' => 'job_listings.edit', 'module' => 'job_listings', 'action' => 'edit'],
      ['name' => 'Update Job Listing', 'slug' => 'job_listings.update', 'module' => 'job_listings', 'action' => 'update'],
      ['name' => 'Delete Job Listing', 'slug' => 'job_listings.destroy', 'module' => 'job_listings', 'action' => 'destroy'],
      ['name' => 'Restore Job Listing', 'slug' => 'job_listings.restore', 'module' => 'job_listings', 'action' => 'restore'],
      ['name' => 'Force Delete Job Listing', 'slug' => 'job_listings.force_delete', 'module' => 'job_listings', 'action' => 'force_delete'],
      ['name' => 'Show Job Listing', 'slug' => 'job_listings.show', 'module' => 'job_listings', 'action' => 'show'],
      ['name' => 'Store Job Listing', 'slug' => 'job_listings.store', 'module' => 'job_listings', 'action' => 'store'],
      ['name' => 'Toggle Job Active', 'slug' => 'job_listings.toggle_active', 'module' => 'job_listings', 'action' => 'toggle_active'],
      ['name' => 'Bulk Activate Jobs', 'slug' => 'job_listings.bulk_activate', 'module' => 'job_listings', 'action' => 'bulk_activate'],
      ['name' => 'Bulk Deactivate Jobs', 'slug' => 'job_listings.bulk_deactivate', 'module' => 'job_listings', 'action' => 'bulk_deactivate'],
      ['name' => 'Bulk Delete Jobs', 'slug' => 'job_listings.bulk_delete', 'module' => 'job_listings', 'action' => 'bulk_delete'],
      ['name' => 'View Job Applications', 'slug' => 'job_listings.applications', 'module' => 'job_listings', 'action' => 'applications'],
      ['name' => 'Job Statistics', 'slug' => 'job_listings.statistics', 'module' => 'job_listings', 'action' => 'statistics'],
      ['name' => 'Update Job Statuses', 'slug' => 'job_listings.update_statuses', 'module' => 'job_listings', 'action' => 'update_statuses'],

      // Job View Permissions
      ['name' => 'View Any Job', 'slug' => 'job.view.any', 'module' => 'job_listings', 'action' => 'view_any'],
      ['name' => 'View Own Job', 'slug' => 'job.view.own', 'module' => 'job_listings', 'action' => 'view_own'],
      ['name' => 'Edit Own Job', 'slug' => 'job.edit.own', 'module' => 'job_listings', 'action' => 'edit_own'],

      // Public Job Listings Module
      ['name' => 'View Public Jobs', 'slug' => 'public_jobs.view', 'module' => 'public_jobs', 'action' => 'view'],
      ['name' => 'Show Public Job', 'slug' => 'public_jobs.show', 'module' => 'public_jobs', 'action' => 'show'],
      ['name' => 'View Popular Jobs', 'slug' => 'public_jobs.popular', 'module' => 'public_jobs', 'action' => 'popular'],
      ['name' => 'View Trending Jobs', 'slug' => 'public_jobs.trending', 'module' => 'public_jobs', 'action' => 'trending'],
      ['name' => 'Bookmark Job', 'slug' => 'public_jobs.bookmark', 'module' => 'public_jobs', 'action' => 'bookmark'],
      ['name' => 'Share Job', 'slug' => 'public_jobs.share', 'module' => 'public_jobs', 'action' => 'share'],
      ['name' => 'Print Job Details', 'slug' => 'public_jobs.print', 'module' => 'public_jobs', 'action' => 'print'],

      // Applications Module - Core
      ['name' => 'View Applications', 'slug' => 'applications.view', 'module' => 'applications', 'action' => 'view'],
      ['name' => 'View Own Job Applications', 'slug' => 'applications.view.for_own_jobs', 'module' => 'applications', 'action' => 'view_for_own_jobs'],
      ['name' => 'Show Application', 'slug' => 'applications.show', 'module' => 'applications', 'action' => 'show'],
      ['name' => 'Update Application Status', 'slug' => 'applications.status.update', 'module' => 'applications', 'action' => 'status_update'],
      ['name' => 'Bulk Update Status', 'slug' => 'applications.bulk_status.update', 'module' => 'applications', 'action' => 'bulk_status_update'],
      ['name' => 'Delete Application', 'slug' => 'applications.destroy', 'module' => 'applications', 'action' => 'destroy'],
      ['name' => 'Bulk Delete Applications', 'slug' => 'applications.bulk_delete', 'module' => 'applications', 'action' => 'bulk_delete'],
      ['name' => 'Restore Application', 'slug' => 'applications.restore', 'module' => 'applications', 'action' => 'restore'],
      ['name' => 'Bulk Restore Applications', 'slug' => 'applications.bulk_restore', 'module' => 'applications', 'action' => 'bulk_restore'],
      ['name' => 'Force Delete Application', 'slug' => 'applications.force_delete', 'module' => 'applications', 'action' => 'force_delete'],
      ['name' => 'Download Resume', 'slug' => 'applications.download_resume', 'module' => 'applications', 'action' => 'download_resume'],
      ['name' => 'Bulk Download Resumes', 'slug' => 'applications.bulk_download_resumes', 'module' => 'applications', 'action' => 'bulk_download_resumes'],
      ['name' => 'Send Application Email', 'slug' => 'applications.email.send', 'module' => 'applications', 'action' => 'email_send'],
      ['name' => 'Bulk Send Email', 'slug' => 'applications.bulk_email.send', 'module' => 'applications', 'action' => 'bulk_email_send'],
      ['name' => 'Export Applications', 'slug' => 'applications.export', 'module' => 'applications', 'action' => 'export'],
      ['name' => 'Export Single Application', 'slug' => 'applications.export_single', 'module' => 'applications', 'action' => 'export_single'],
      ['name' => 'Recalculate ATS', 'slug' => 'applications.recalculate_ats', 'module' => 'applications', 'action' => 'recalculate_ats'],
      ['name' => 'Manage All Applications', 'slug' => 'applications.manage', 'module' => 'applications', 'action' => 'manage'],
      ['name' => 'Job Applications View', 'slug' => 'applications.job_applications', 'module' => 'applications', 'action' => 'job_applications'],

      // Application View Permissions
      ['name' => 'View Own Applications', 'slug' => 'application.view.own', 'module' => 'applications', 'action' => 'view_own'],
      ['name' => 'View Any Application', 'slug' => 'application.view.any', 'module' => 'applications', 'action' => 'view_any'],
      ['name' => 'Shortlist Application', 'slug' => 'application.shortlist', 'module' => 'applications', 'action' => 'shortlist'],
      ['name' => 'Reject Application', 'slug' => 'application.reject', 'module' => 'applications', 'action' => 'reject'],

      // Apply Module (Job Seekers)
      ['name' => 'View My Applications', 'slug' => 'apply.view', 'module' => 'apply', 'action' => 'view'],
      ['name' => 'View My Own Applications', 'slug' => 'apply.view.own', 'module' => 'apply', 'action' => 'view_own'],
      ['name' => 'Create New Application', 'slug' => 'apply.create', 'module' => 'apply', 'action' => 'create'],
      ['name' => 'Store New Application', 'slug' => 'apply.store', 'module' => 'apply', 'action' => 'store'],
      ['name' => 'Show My Application Details', 'slug' => 'apply.show', 'module' => 'apply', 'action' => 'show'],
      ['name' => 'Edit My Application', 'slug' => 'apply.edit', 'module' => 'apply', 'action' => 'edit'],
      ['name' => 'Update My Application', 'slug' => 'apply.update', 'module' => 'apply', 'action' => 'update'],
      ['name' => 'Withdraw My Application', 'slug' => 'apply.destroy', 'module' => 'apply', 'action' => 'destroy'],
      ['name' => 'Restore My Application', 'slug' => 'apply.restore', 'module' => 'apply', 'action' => 'restore'],
      ['name' => 'Force Delete My Application', 'slug' => 'apply.force_delete', 'module' => 'apply', 'action' => 'force_delete'],
      ['name' => 'View My Trashed Applications', 'slug' => 'apply.trashed', 'module' => 'apply', 'action' => 'trashed'],
      ['name' => 'Recalculate My ATS Score', 'slug' => 'apply.recalculate_ats', 'module' => 'apply', 'action' => 'recalculate_ats'],
      ['name' => 'Get My ATS Status', 'slug' => 'apply.ats_status', 'module' => 'apply', 'action' => 'ats_status'],

      // Job Categories Module
      ['name' => 'View Categories', 'slug' => 'categories.view', 'module' => 'categories', 'action' => 'view'],
      ['name' => 'Create Category', 'slug' => 'categories.create', 'module' => 'categories', 'action' => 'create'],
      ['name' => 'Edit Category', 'slug' => 'categories.edit', 'module' => 'categories', 'action' => 'edit'],
      ['name' => 'Delete Category', 'slug' => 'categories.delete', 'module' => 'categories', 'action' => 'delete'],
      ['name' => 'Restore Category', 'slug' => 'categories.restore', 'module' => 'categories', 'action' => 'restore'],
      ['name' => 'Force Delete Category', 'slug' => 'categories.force_delete', 'module' => 'categories', 'action' => 'force_delete'],
      ['name' => 'Toggle Category Active', 'slug' => 'categories.toggle_active', 'module' => 'categories', 'action' => 'toggle_active'],
      ['name' => 'Bulk Delete Categories', 'slug' => 'categories.bulk_delete', 'module' => 'categories', 'action' => 'bulk_delete'],
      ['name' => 'Bulk Restore Categories', 'slug' => 'categories.bulk_restore', 'module' => 'categories', 'action' => 'bulk_restore'],
      ['name' => 'Bulk Activate Categories', 'slug' => 'categories.bulk_activate', 'module' => 'categories', 'action' => 'bulk_activate'],
      ['name' => 'Bulk Deactivate Categories', 'slug' => 'categories.bulk_deactivate', 'module' => 'categories', 'action' => 'bulk_deactivate'],
      ['name' => 'Bulk Force Delete Categories', 'slug' => 'categories.bulk_force_delete', 'module' => 'categories', 'action' => 'bulk_force_delete'],
      ['name' => 'Get Active Categories', 'slug' => 'categories.get_active', 'module' => 'categories', 'action' => 'get_active'],
      ['name' => 'Manage Categories', 'slug' => 'categories.manage', 'module' => 'categories', 'action' => 'manage'],
      ['name' => 'View Category', 'slug' => 'category.view', 'module' => 'categories', 'action' => 'category_view'],

      // Locations Module
      ['name' => 'View Locations', 'slug' => 'locations.view', 'module' => 'locations', 'action' => 'view'],
      ['name' => 'Create Location', 'slug' => 'locations.create', 'module' => 'locations', 'action' => 'create'],
      ['name' => 'Edit Location', 'slug' => 'locations.edit', 'module' => 'locations', 'action' => 'edit'],
      ['name' => 'Delete Location', 'slug' => 'locations.delete', 'module' => 'locations', 'action' => 'delete'],
      ['name' => 'Restore Location', 'slug' => 'locations.restore', 'module' => 'locations', 'action' => 'restore'],
      ['name' => 'Force Delete Location', 'slug' => 'locations.force_delete', 'module' => 'locations', 'action' => 'force_delete'],
      ['name' => 'Toggle Location Active', 'slug' => 'locations.toggle_active', 'module' => 'locations', 'action' => 'toggle_active'],
      ['name' => 'Bulk Delete Locations', 'slug' => 'locations.bulk_delete', 'module' => 'locations', 'action' => 'bulk_delete'],
      ['name' => 'Bulk Restore Locations', 'slug' => 'locations.bulk_restore', 'module' => 'locations', 'action' => 'bulk_restore'],
      ['name' => 'Bulk Activate Locations', 'slug' => 'locations.bulk_activate', 'module' => 'locations', 'action' => 'bulk_activate'],
      ['name' => 'Bulk Deactivate Locations', 'slug' => 'locations.bulk_deactivate', 'module' => 'locations', 'action' => 'bulk_deactivate'],
      ['name' => 'Bulk Force Delete Locations', 'slug' => 'locations.bulk_force_delete', 'module' => 'locations', 'action' => 'bulk_force_delete'],
      ['name' => 'Get Active Locations', 'slug' => 'locations.get_active', 'module' => 'locations', 'action' => 'get_active'],
      ['name' => 'Manage Locations', 'slug' => 'locations.manage', 'module' => 'locations', 'action' => 'manage'],
      ['name' => 'View Location', 'slug' => 'location.view', 'module' => 'locations', 'action' => 'location_view'],

      // Applicant Profiles Module
      ['name' => 'View Applicant Profiles', 'slug' => 'profiles.view', 'module' => 'profiles', 'action' => 'view'],
      ['name' => 'View Any Profile', 'slug' => 'profiles.view.any', 'module' => 'profiles', 'action' => 'view_any'],
      ['name' => 'View My Own Profile', 'slug' => 'profiles.view.own', 'module' => 'profiles', 'action' => 'view_own'],
      ['name' => 'Show Profile Details', 'slug' => 'profiles.show', 'module' => 'profiles', 'action' => 'show'],
      ['name' => 'Edit My Profile', 'slug' => 'profiles.edit.own', 'module' => 'profiles', 'action' => 'edit_own'],
      ['name' => 'Edit Basic Information', 'slug' => 'profiles.edit_basic', 'module' => 'profiles', 'action' => 'edit_basic'],
      ['name' => 'Edit Professional Information', 'slug' => 'profiles.edit_professional', 'module' => 'profiles', 'action' => 'edit_professional'],
      ['name' => 'Edit Work Experience', 'slug' => 'profiles.edit_work', 'module' => 'profiles', 'action' => 'edit_work'],
      ['name' => 'Edit Education History', 'slug' => 'profiles.edit_education', 'module' => 'profiles', 'action' => 'edit_education'],
      ['name' => 'Edit Achievements', 'slug' => 'profiles.edit_achievements', 'module' => 'profiles', 'action' => 'edit_achievements'],
      ['name' => 'Update Basic Information', 'slug' => 'profiles.update_basic', 'module' => 'profiles', 'action' => 'update_basic'],
      ['name' => 'Update Professional Information', 'slug' => 'profiles.update_professional', 'module' => 'profiles', 'action' => 'update_professional'],
      ['name' => 'Update Work Experience', 'slug' => 'profiles.update_work', 'module' => 'profiles', 'action' => 'update_work'],
      ['name' => 'Update Education History', 'slug' => 'profiles.update_education', 'module' => 'profiles', 'action' => 'update_education'],
      ['name' => 'Update Achievements', 'slug' => 'profiles.update_achievements', 'module' => 'profiles', 'action' => 'update_achievements'],
      ['name' => 'Delete Profile', 'slug' => 'profiles.destroy', 'module' => 'profiles', 'action' => 'destroy'],
      ['name' => 'Restore Profile', 'slug' => 'profiles.restore', 'module' => 'profiles', 'action' => 'restore'],
      ['name' => 'Force Delete Profile', 'slug' => 'profiles.force_delete', 'module' => 'profiles', 'action' => 'force_delete'],
      ['name' => 'Bulk Delete Profiles', 'slug' => 'profiles.bulk_delete', 'module' => 'profiles', 'action' => 'bulk_delete'],
      ['name' => 'Bulk Restore Profiles', 'slug' => 'profiles.bulk_restore', 'module' => 'profiles', 'action' => 'bulk_restore'],
      ['name' => 'Export Profiles', 'slug' => 'profiles.export', 'module' => 'profiles', 'action' => 'export'],
      ['name' => 'Upload CV Document', 'slug' => 'profiles.upload_cv', 'module' => 'profiles', 'action' => 'upload_cv'],
      ['name' => 'Delete CV Document', 'slug' => 'profiles.destroy_cv', 'module' => 'profiles', 'action' => 'destroy_cv'],
      ['name' => 'Set Primary CV', 'slug' => 'profiles.set_primary_cv', 'module' => 'profiles', 'action' => 'set_primary_cv'],
      ['name' => 'Change Profile Password', 'slug' => 'profiles.change_password', 'module' => 'profiles', 'action' => 'change_password'],
      ['name' => 'Download CV Document', 'slug' => 'profiles.download_cv', 'module' => 'profiles', 'action' => 'download_cv'],
      ['name' => 'View Profile Photo', 'slug' => 'profiles.photo', 'module' => 'profiles', 'action' => 'photo'],
      ['name' => 'Get Profile Data', 'slug' => 'profiles.get_data', 'module' => 'profiles', 'action' => 'get_data'],
      ['name' => 'Manage Profiles', 'slug' => 'profiles.manage', 'module' => 'profiles', 'action' => 'manage'],
      ['name' => 'Delete Any Profile', 'slug' => 'profiles.delete.any', 'module' => 'profiles', 'action' => 'delete_any'],

      // Profile Completion Module
      ['name' => 'Show Profile Completion', 'slug' => 'profile_completion.show', 'module' => 'profile_completion', 'action' => 'show'],
      ['name' => 'Store Profile Completion', 'slug' => 'profile_completion.store', 'module' => 'profile_completion', 'action' => 'store'],
      ['name' => 'Upload Profile Photo', 'slug' => 'profile_completion.upload_photo', 'module' => 'profile_completion', 'action' => 'upload_photo'],
      ['name' => 'Delete Profile Photo', 'slug' => 'profile_completion.delete_photo', 'module' => 'profile_completion', 'action' => 'delete_photo'],
      ['name' => 'Upload Pending CV', 'slug' => 'profile_completion.upload_cv', 'module' => 'profile_completion', 'action' => 'upload_cv'],
      ['name' => 'Delete Pending CV', 'slug' => 'profile_completion.destroy_cv', 'module' => 'profile_completion', 'action' => 'destroy_cv'],
      ['name' => 'Set Primary Pending CV', 'slug' => 'profile_completion.set_primary_cv', 'module' => 'profile_completion', 'action' => 'set_primary_cv'],

      // Admin Profile Module
      ['name' => 'Edit Admin Profile', 'slug' => 'admin_profile.edit', 'module' => 'admin_profile', 'action' => 'edit'],
      ['name' => 'Update Admin Profile', 'slug' => 'admin_profile.update', 'module' => 'admin_profile', 'action' => 'update'],
      ['name' => 'Update Admin Password', 'slug' => 'admin_profile.update_password', 'module' => 'admin_profile', 'action' => 'update_password'],

      // Employer Profile Module
      ['name' => 'View Employer Profile', 'slug' => 'employer_profile.view', 'module' => 'employer_profile', 'action' => 'view'],
      ['name' => 'Edit Employer Profile', 'slug' => 'employer_profile.edit', 'module' => 'employer_profile', 'action' => 'edit'],
      ['name' => 'Update Employer Profile', 'slug' => 'employer_profile.update', 'module' => 'employer_profile', 'action' => 'update'],
      ['name' => 'Update Employer Password', 'slug' => 'employer_profile.update_password', 'module' => 'employer_profile', 'action' => 'update_password'],

      // Notifications Module
      ['name' => 'View Notifications', 'slug' => 'notifications.view', 'module' => 'notifications', 'action' => 'view'],
      ['name' => 'Mark Notification Read', 'slug' => 'notifications.mark_read', 'module' => 'notifications', 'action' => 'mark_read'],
      ['name' => 'Mark All Notifications Read', 'slug' => 'notifications.mark_all_read', 'module' => 'notifications', 'action' => 'mark_all_read'],
      ['name' => 'View Notification', 'slug' => 'notification.view', 'module' => 'notifications', 'action' => 'notification_view'],

      // Roles Module
      ['name' => 'View Roles', 'slug' => 'roles.view', 'module' => 'roles', 'action' => 'view'],
      ['name' => 'Create Role', 'slug' => 'roles.create', 'module' => 'roles', 'action' => 'create'],
      ['name' => 'Store Role', 'slug' => 'roles.store', 'module' => 'roles', 'action' => 'store'],
      ['name' => 'Show Role', 'slug' => 'roles.show', 'module' => 'roles', 'action' => 'show'],
      ['name' => 'Edit Role', 'slug' => 'roles.edit', 'module' => 'roles', 'action' => 'edit'],
      ['name' => 'Update Role', 'slug' => 'roles.update', 'module' => 'roles', 'action' => 'update'],
      ['name' => 'Delete Role', 'slug' => 'roles.destroy', 'module' => 'roles', 'action' => 'destroy'],
      ['name' => 'Restore Role', 'slug' => 'roles.restore', 'module' => 'roles', 'action' => 'restore'],
      ['name' => 'Force Delete Role', 'slug' => 'roles.force_delete', 'module' => 'roles', 'action' => 'force_delete'],
      ['name' => 'View Trashed Roles', 'slug' => 'roles.trashed', 'module' => 'roles', 'action' => 'trashed'],
      ['name' => 'Bulk Delete Roles', 'slug' => 'roles.bulk_delete', 'module' => 'roles', 'action' => 'bulk_delete'],
      ['name' => 'Bulk Restore Roles', 'slug' => 'roles.bulk_restore', 'module' => 'roles', 'action' => 'bulk_restore'],
      ['name' => 'Toggle Role Status', 'slug' => 'roles.toggle_status', 'module' => 'roles', 'action' => 'toggle_status'],
      ['name' => 'Clone Role', 'slug' => 'roles.clone', 'module' => 'roles', 'action' => 'clone'],
      ['name' => 'Export Roles', 'slug' => 'roles.export', 'module' => 'roles', 'action' => 'export'],
      ['name' => 'View Role', 'slug' => 'role.view', 'module' => 'roles', 'action' => 'role_view'],
      ['name' => 'Create Role Action', 'slug' => 'role.create', 'module' => 'roles', 'action' => 'role_create'],
      ['name' => 'Edit Role Action', 'slug' => 'role.edit', 'module' => 'roles', 'action' => 'role_edit'],
      ['name' => 'Delete Role Action', 'slug' => 'role.delete', 'module' => 'roles', 'action' => 'role_delete'],

      // Users Module
      ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'users', 'action' => 'view'],
      ['name' => 'Create User', 'slug' => 'users.create', 'module' => 'users', 'action' => 'create'],
      ['name' => 'Update User', 'slug' => 'users.update', 'module' => 'users', 'action' => 'update'],
      ['name' => 'Delete User', 'slug' => 'users.destroy', 'module' => 'users', 'action' => 'destroy'],
      ['name' => 'Restore User', 'slug' => 'users.restore', 'module' => 'users', 'action' => 'restore'],
      ['name' => 'Force Delete User', 'slug' => 'users.force_delete', 'module' => 'users', 'action' => 'force_delete'],
      ['name' => 'Bulk Delete Users', 'slug' => 'users.bulk_delete', 'module' => 'users', 'action' => 'bulk_delete'],
      ['name' => 'Bulk Restore Users', 'slug' => 'users.bulk_restore', 'module' => 'users', 'action' => 'bulk_restore'],
      ['name' => 'Verify User Email', 'slug' => 'users.verify', 'module' => 'users', 'action' => 'verify'],
      ['name' => 'View User', 'slug' => 'user.view', 'module' => 'users', 'action' => 'user_view'],
      ['name' => 'Create User Action', 'slug' => 'user.create', 'module' => 'users', 'action' => 'user_create'],
      ['name' => 'Edit User Action', 'slug' => 'user.edit', 'module' => 'users', 'action' => 'user_edit'],

      // Permissions Module
      ['name' => 'View Permissions', 'slug' => 'permissions.view', 'module' => 'permissions', 'action' => 'view'],
      ['name' => 'Create Permission', 'slug' => 'permissions.create', 'module' => 'permissions', 'action' => 'create'],
      ['name' => 'Edit Permission', 'slug' => 'permissions.edit', 'module' => 'permissions', 'action' => 'edit'],
      ['name' => 'Delete Permission', 'slug' => 'permissions.delete', 'module' => 'permissions', 'action' => 'delete'],
      ['name' => 'Bulk Assign Permissions', 'slug' => 'permissions.bulk_assign', 'module' => 'permissions', 'action' => 'bulk_assign'],

      // Statistics Module
      ['name' => 'View Statistics', 'slug' => 'statistics.view', 'module' => 'statistics', 'action' => 'view'],
      ['name' => 'Export Statistics', 'slug' => 'statistics.export', 'module' => 'statistics', 'action' => 'export'],
      ['name' => 'ATS Stats', 'slug' => 'statistics.ats', 'module' => 'statistics', 'action' => 'ats'],
      ['name' => 'Employer Stats', 'slug' => 'statistics.employers', 'module' => 'statistics', 'action' => 'employers'],
      ['name' => 'Job Stats', 'slug' => 'statistics.jobs', 'module' => 'statistics', 'action' => 'jobs'],
      ['name' => 'Manage Statistics', 'slug' => 'statistics.manage', 'module' => 'statistics', 'action' => 'manage'],
      ['name' => 'View Job Reports', 'slug' => 'report.jobs', 'module' => 'reports', 'action' => 'jobs'],

      // Admin Management
      ['name' => 'Manage Admins', 'slug' => 'admin.manage', 'module' => 'admin', 'action' => 'manage'],
      ['name' => 'View Admins', 'slug' => 'admin.view', 'module' => 'admin', 'action' => 'view'],
      ['name' => 'Create Admin', 'slug' => 'admin.create', 'module' => 'admin', 'action' => 'create'],
      ['name' => 'Update Admin', 'slug' => 'admin.update', 'module' => 'admin', 'action' => 'update'],
      ['name' => 'Delete Admin', 'slug' => 'admin.destroy', 'module' => 'admin', 'action' => 'destroy'],

      // Employer Management
      ['name' => 'Manage Employers', 'slug' => 'employer.manage', 'module' => 'employer', 'action' => 'manage'],
      ['name' => 'View Employers', 'slug' => 'employer.view', 'module' => 'employer', 'action' => 'view'],
      ['name' => 'Update Employer', 'slug' => 'employer.update', 'module' => 'employer', 'action' => 'update'],
      ['name' => 'Delete Employer', 'slug' => 'employer.destroy', 'module' => 'employer', 'action' => 'destroy'],
    ];

    // Insert permissions using updateOrInsert to avoid duplicates
    foreach ($permissions as $permission) {
      DB::table('permissions')->updateOrInsert(
        ['slug' => $permission['slug']],
        [
          'name' => $permission['name'],
          'module' => $permission['module'],
          'action' => $permission['action'],
          'is_active' => true,
          'created_at' => now(),
          'updated_at' => now(),
        ]
      );
    }

    // ==========================================
    // 2. INSERT ROLES
    // ==========================================
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
        'name' => 'Employer Admin',
        'slug' => 'employer-admin',
        'description' => 'Full employer access for company',
        'level' => 70,
        'is_default' => false,
        'is_active' => true,
        'created_by' => $createdBy,
        'updated_by' => $createdBy,
      ],
      [
        'name' => 'HR Manager',
        'slug' => 'hr-manager',
        'description' => 'HR staff who can manage jobs and applications',
        'level' => 60,
        'is_default' => false,
        'is_active' => true,
        'created_by' => $createdBy,
        'updated_by' => $createdBy,
      ],
      [
        'name' => 'Recruiter',
        'slug' => 'recruiter',
        'description' => 'Recruiter who can post jobs and review applications',
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

    // Get role IDs after upsert
    $superAdminRoleId = DB::table('roles')->where('slug', 'super-admin')->value('id');
    $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
    $employerAdminRoleId = DB::table('roles')->where('slug', 'employer-admin')->value('id');
    $hrManagerRoleId = DB::table('roles')->where('slug', 'hr-manager')->value('id');
    $recruiterRoleId = DB::table('roles')->where('slug', 'recruiter')->value('id');
    $jobSeekerRoleId = DB::table('roles')->where('slug', 'job-seeker')->value('id');

    // Clear existing role_permissions for these roles
    DB::table('role_permissions')->whereIn('role_id', [
      $superAdminRoleId,
      $adminRoleId,
      $employerAdminRoleId,
      $hrManagerRoleId,
      $recruiterRoleId,
      $jobSeekerRoleId,
    ])->delete();

    // ==========================================
    // 3. ASSIGN PERMISSIONS TO ROLES
    // ==========================================

    // Get all permission IDs
    $allPermissionIds = DB::table('permissions')->pluck('id');

    // Super Admin gets ALL permissions
    foreach ($allPermissionIds as $permissionId) {
      DB::table('role_permissions')->updateOrInsert(
        ['role_id' => $superAdminRoleId, 'permission_id' => $permissionId],
        ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
      );
    }

    // Admin gets ALL permissions
    foreach ($allPermissionIds as $permissionId) {
      DB::table('role_permissions')->updateOrInsert(
        ['role_id' => $adminRoleId, 'permission_id' => $permissionId],
        ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
      );
    }

    // Employer Admin permissions
    $employerAdminPermissionSlugs = [
      'dashboard.view',
      'dashboard.stats.view',
      'dashboard.quick_actions.view',
      'dashboard.recent_activity.view',
      'dashboard.employer',
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
      'categories.view',
      'category.view',
      'categories.get_active',
      'locations.view',
      'location.view',
      'locations.get_active',
      'employer_profile.view',
      'employer_profile.edit',
      'employer_profile.update',
      'employer_profile.update_password',
      'notifications.view',
      'notification.view',
      'notifications.mark_read',
      'notifications.mark_all_read',
      'statistics.view',
      'statistics.ats',
      'statistics.employers',
      'statistics.jobs',
      'report.jobs',
    ];

    foreach ($employerAdminPermissionSlugs as $slug) {
      $permId = DB::table('permissions')->where('slug', $slug)->value('id');
      if ($permId) {
        DB::table('role_permissions')->updateOrInsert(
          ['role_id' => $employerAdminRoleId, 'permission_id' => $permId],
          ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
        );
      }
    }

    // HR Manager permissions
    $hrManagerPermissionSlugs = [
      'dashboard.view',
      'dashboard.employer',
      'job_listings.view',
      'job_listings.create',
      'job_listings.store',
      'job_listings.edit',
      'job_listings.update',
      'job_listings.show',
      'job.view.any',
      'job.view.own',
      'applications.view',
      'applications.view.for_own_jobs',
      'applications.show',
      'applications.status.update',
      'applications.download_resume',
      'applications.email.send',
      'application.view.own',
      'application.shortlist',
      'categories.view',
      'locations.view',
      'employer_profile.view',
      'employer_profile.edit',
      'employer_profile.update',
      'employer_profile.update_password',
      'notifications.view',
      'notifications.mark_read',
    ];

    foreach ($hrManagerPermissionSlugs as $slug) {
      $permId = DB::table('permissions')->where('slug', $slug)->value('id');
      if ($permId) {
        DB::table('role_permissions')->updateOrInsert(
          ['role_id' => $hrManagerRoleId, 'permission_id' => $permId],
          ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
        );
      }
    }

    // Recruiter permissions
    $recruiterPermissionSlugs = [
      'dashboard.view',
      'job_listings.view',
      'job_listings.create',
      'job_listings.store',
      'job_listings.edit',
      'job_listings.update',
      'job_listings.show',
      'job.view.any',
      'job.view.own',
      'applications.view',
      'applications.view.for_own_jobs',
      'applications.show',
      'applications.status.update',
      'applications.download_resume',
      'application.view.own',
      'application.shortlist',
      'categories.view',
      'locations.view',
      'employer_profile.view',
      'employer_profile.edit',
      'employer_profile.update',
      'employer_profile.update_password',
      'notifications.view',
    ];

    foreach ($recruiterPermissionSlugs as $slug) {
      $permId = DB::table('permissions')->where('slug', $slug)->value('id');
      if ($permId) {
        DB::table('role_permissions')->updateOrInsert(
          ['role_id' => $recruiterRoleId, 'permission_id' => $permId],
          ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
        );
      }
    }

    // Job Seeker permissions
    $jobSeekerPermissionSlugs = [
      'dashboard.view',
      'dashboard.job_seeker',
      'public_jobs.view',
      'public_jobs.show',
      'public_jobs.popular',
      'public_jobs.trending',
      'public_jobs.bookmark',
      'public_jobs.share',
      'public_jobs.print',
      'job.view.any',
      'apply.view',
      'apply.view.own',
      'apply.create',
      'apply.store',
      'apply.show',
      'apply.edit',
      'apply.update',
      'apply.destroy',
      'apply.restore',
      'apply.recalculate_ats',
      'apply.ats_status',
      'application.view.own',
      'profiles.view.own',
      'profiles.show',
      'profiles.edit.own',
      'profiles.edit_basic',
      'profiles.edit_professional',
      'profiles.edit_work',
      'profiles.edit_education',
      'profiles.edit_achievements',
      'profiles.update_basic',
      'profiles.update_professional',
      'profiles.update_work',
      'profiles.update_education',
      'profiles.update_achievements',
      'profiles.destroy',
      'profiles.restore',
      'profiles.upload_cv',
      'profiles.destroy_cv',
      'profiles.set_primary_cv',
      'profiles.change_password',
      'profiles.download_cv',
      'profile_completion.show',
      'profile_completion.store',
      'profile_completion.upload_photo',
      'profile_completion.delete_photo',
      'profile_completion.upload_cv',
      'profile_completion.destroy_cv',
      'profile_completion.set_primary_cv',
      'notifications.view',
      'notification.view',
      'notifications.mark_read',
      'notifications.mark_all_read',
    ];

    foreach ($jobSeekerPermissionSlugs as $slug) {
      $permId = DB::table('permissions')->where('slug', $slug)->value('id');
      if ($permId) {
        DB::table('role_permissions')->updateOrInsert(
          ['role_id' => $jobSeekerRoleId, 'permission_id' => $permId],
          ['granted' => true, 'created_at' => now(), 'updated_at' => now()]
        );
      }
    }

    // ==========================================
    // 4. SET ROLE MODULE ACCESS
    // ==========================================

    DB::table('role_module_access')->whereIn('role_id', [
      $superAdminRoleId,
      $adminRoleId,
      $employerAdminRoleId,
      $hrManagerRoleId,
      $recruiterRoleId,
      $jobSeekerRoleId,
    ])->delete();

    $moduleAccess = [
      // Super Admin
      ['role_id' => $superAdminRoleId, 'module' => 'dashboard', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'job_listings', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'public_jobs', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'applications', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'apply', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'categories', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'locations', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'profiles', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'profile_completion', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'admin_profile', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'admin', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'employer_profile', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'employer', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'notifications', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'roles', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'users', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'permissions', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'statistics', 'access_level' => 'manage'],
      ['role_id' => $superAdminRoleId, 'module' => 'reports', 'access_level' => 'manage'],

      // Admin
      ['role_id' => $adminRoleId, 'module' => 'dashboard', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'job_listings', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'public_jobs', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'applications', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'apply', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'categories', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'locations', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'profiles', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'profile_completion', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'admin_profile', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'admin', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'employer_profile', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'employer', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'notifications', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'roles', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'users', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'permissions', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'statistics', 'access_level' => 'manage'],
      ['role_id' => $adminRoleId, 'module' => 'reports', 'access_level' => 'manage'],

      // Employer Admin
      ['role_id' => $employerAdminRoleId, 'module' => 'dashboard', 'access_level' => 'write'],
      ['role_id' => $employerAdminRoleId, 'module' => 'job_listings', 'access_level' => 'write'],
      ['role_id' => $employerAdminRoleId, 'module' => 'applications', 'access_level' => 'write'],
      ['role_id' => $employerAdminRoleId, 'module' => 'categories', 'access_level' => 'read'],
      ['role_id' => $employerAdminRoleId, 'module' => 'locations', 'access_level' => 'read'],
      ['role_id' => $employerAdminRoleId, 'module' => 'employer_profile', 'access_level' => 'write'],
      ['role_id' => $employerAdminRoleId, 'module' => 'notifications', 'access_level' => 'write'],
      ['role_id' => $employerAdminRoleId, 'module' => 'statistics', 'access_level' => 'read'],
      ['role_id' => $employerAdminRoleId, 'module' => 'reports', 'access_level' => 'read'],

      // HR Manager
      ['role_id' => $hrManagerRoleId, 'module' => 'dashboard', 'access_level' => 'write'],
      ['role_id' => $hrManagerRoleId, 'module' => 'job_listings', 'access_level' => 'write'],
      ['role_id' => $hrManagerRoleId, 'module' => 'applications', 'access_level' => 'write'],
      ['role_id' => $hrManagerRoleId, 'module' => 'categories', 'access_level' => 'read'],
      ['role_id' => $hrManagerRoleId, 'module' => 'locations', 'access_level' => 'read'],
      ['role_id' => $hrManagerRoleId, 'module' => 'employer_profile', 'access_level' => 'write'],
      ['role_id' => $hrManagerRoleId, 'module' => 'notifications', 'access_level' => 'read'],

      // Recruiter
      ['role_id' => $recruiterRoleId, 'module' => 'dashboard', 'access_level' => 'read'],
      ['role_id' => $recruiterRoleId, 'module' => 'job_listings', 'access_level' => 'write'],
      ['role_id' => $recruiterRoleId, 'module' => 'applications', 'access_level' => 'write'],
      ['role_id' => $recruiterRoleId, 'module' => 'categories', 'access_level' => 'read'],
      ['role_id' => $recruiterRoleId, 'module' => 'locations', 'access_level' => 'read'],
      ['role_id' => $recruiterRoleId, 'module' => 'employer_profile', 'access_level' => 'write'],
      ['role_id' => $recruiterRoleId, 'module' => 'notifications', 'access_level' => 'read'],

      // Job Seeker
      ['role_id' => $jobSeekerRoleId, 'module' => 'dashboard', 'access_level' => 'read'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'public_jobs', 'access_level' => 'read'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'apply', 'access_level' => 'write'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'profiles', 'access_level' => 'write'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'profile_completion', 'access_level' => 'write'],
      ['role_id' => $jobSeekerRoleId, 'module' => 'notifications', 'access_level' => 'read'],
    ];

    foreach ($moduleAccess as $access) {
      DB::table('role_module_access')->updateOrInsert(
        ['role_id' => $access['role_id'], 'module' => $access['module']],
        ['access_level' => $access['access_level'], 'created_at' => now(), 'updated_at' => now()]
      );
    }

    // ==========================================
    // 5. ASSIGN ROLES TO EXISTING USERS
    // ==========================================
    $users = DB::table('users')->whereNull('deleted_at')->get();

    foreach ($users as $user) {
      $roleSlug = 'job-seeker';

      if ($user->email === 'superadmin@jobportal.com') {
        $roleSlug = 'super-admin';
      } elseif ($user->email === 'admin@jobportal.com') {
        $roleSlug = 'admin';
      } elseif ($user->email === 'hrmanager@company.com') {
        $roleSlug = 'hr-manager';
      } elseif (str_contains($user->email, '@company.com')) {
        $roleSlug = 'employer-admin';
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
