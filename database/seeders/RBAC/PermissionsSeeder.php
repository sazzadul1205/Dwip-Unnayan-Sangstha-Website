<?php
// database/seeders/RBAC/PermissionsSeeder.php

namespace Database\Seeders\RBAC;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionsSeeder extends Seeder
{
  public function run(): void
  {
    $permissions = [
      // ==================== DASHBOARD ====================
      ['name' => 'View Dashboard', 'slug' => 'dashboard.view', 'module' => 'dashboard', 'action' => 'view'],
      ['name' => 'View Dashboard Stats', 'slug' => 'dashboard.stats.view', 'module' => 'dashboard', 'action' => 'stats_view'],
      ['name' => 'View Dashboard Quick Actions', 'slug' => 'dashboard.quick_actions.view', 'module' => 'dashboard', 'action' => 'quick_actions_view'],
      ['name' => 'View Dashboard Recent Activity', 'slug' => 'dashboard.recent_activity.view', 'module' => 'dashboard', 'action' => 'recent_activity_view'],
      ['name' => 'Job Seeker Dashboard', 'slug' => 'dashboard.job_seeker', 'module' => 'dashboard', 'action' => 'job_seeker'],
      ['name' => 'Employer Dashboard', 'slug' => 'dashboard.employer', 'module' => 'dashboard', 'action' => 'employer'],
      ['name' => 'Admin Dashboard', 'slug' => 'dashboard.admin', 'module' => 'dashboard', 'action' => 'admin'],

      // ==================== ABOUT CONTENT ====================
      ['name' => 'View About Content', 'slug' => 'about.view', 'module' => 'about', 'action' => 'view'],
      ['name' => 'Create About Content', 'slug' => 'about.create', 'module' => 'about', 'action' => 'create'],
      ['name' => 'Update About Content', 'slug' => 'about.update', 'module' => 'about', 'action' => 'update'],
      ['name' => 'Delete About Content', 'slug' => 'about.destroy', 'module' => 'about', 'action' => 'destroy'],
      ['name' => 'Restore About Content', 'slug' => 'about.restore', 'module' => 'about', 'action' => 'restore'],
      ['name' => 'Force Delete About Content', 'slug' => 'about.force-delete', 'module' => 'about', 'action' => 'force_delete'],
      ['name' => 'Toggle About Status', 'slug' => 'about.toggle-status', 'module' => 'about', 'action' => 'toggle_status'],
      ['name' => 'Toggle About Featured', 'slug' => 'about.toggle-featured', 'module' => 'about', 'action' => 'toggle_featured'],

      // ==================== ADMIN PROFILE ====================
      ['name' => 'View Admin', 'slug' => 'admin.view', 'module' => 'admin', 'action' => 'view'],
      ['name' => 'Manage Admin', 'slug' => 'admin.manage', 'module' => 'admin', 'action' => 'manage'],
      ['name' => 'Create Admin', 'slug' => 'admin.create', 'module' => 'admin', 'action' => 'create'],
      ['name' => 'Update Admin', 'slug' => 'admin.update', 'module' => 'admin', 'action' => 'update'],
      ['name' => 'Delete Admin', 'slug' => 'admin.destroy', 'module' => 'admin', 'action' => 'destroy'],
      ['name' => 'View Admin Profile', 'slug' => 'admin_profile.view', 'module' => 'admin_profile', 'action' => 'view'],
      ['name' => 'Edit Admin Profile', 'slug' => 'admin_profile.edit', 'module' => 'admin_profile', 'action' => 'edit'],
      ['name' => 'Update Admin Profile', 'slug' => 'admin_profile.update', 'module' => 'admin_profile', 'action' => 'update'],
      ['name' => 'Update Admin Password', 'slug' => 'admin_profile.update_password', 'module' => 'admin_profile', 'action' => 'update_password'],

      // ==================== APPLICANT PROFILES ====================
      ['name' => 'View Applicant Profiles', 'slug' => 'applicant-profiles.view', 'module' => 'applicant_profiles', 'action' => 'view'],
      ['name' => 'View Any Applicant Profile', 'slug' => 'applicant-profiles.view.any', 'module' => 'applicant_profiles', 'action' => 'view_any'],
      ['name' => 'View Own Applicant Profile', 'slug' => 'applicant-profiles.view.own', 'module' => 'applicant_profiles', 'action' => 'view_own'],
      ['name' => 'Show Applicant Profile', 'slug' => 'applicant-profiles.show', 'module' => 'applicant_profiles', 'action' => 'show'],
      ['name' => 'Create Applicant Profile', 'slug' => 'applicant-profiles.create', 'module' => 'applicant_profiles', 'action' => 'create'],
      ['name' => 'Store Applicant Profile', 'slug' => 'applicant-profiles.store', 'module' => 'applicant_profiles', 'action' => 'store'],
      ['name' => 'Edit Applicant Profile', 'slug' => 'applicant-profiles.edit', 'module' => 'applicant_profiles', 'action' => 'edit'],
      ['name' => 'Update Applicant Profile', 'slug' => 'applicant-profiles.update', 'module' => 'applicant_profiles', 'action' => 'update'],
      ['name' => 'Delete Applicant Profile', 'slug' => 'applicant-profiles.destroy', 'module' => 'applicant_profiles', 'action' => 'destroy'],
      ['name' => 'Restore Applicant Profile', 'slug' => 'applicant-profiles.restore', 'module' => 'applicant_profiles', 'action' => 'restore'],
      ['name' => 'Force Delete Applicant Profile', 'slug' => 'applicant-profiles.force_delete', 'module' => 'applicant_profiles', 'action' => 'force_delete'],
      ['name' => 'Bulk Delete Applicant Profiles', 'slug' => 'applicant-profiles.bulk_delete', 'module' => 'applicant_profiles', 'action' => 'bulk_delete'],
      ['name' => 'Bulk Restore Applicant Profiles', 'slug' => 'applicant-profiles.bulk_restore', 'module' => 'applicant_profiles', 'action' => 'bulk_restore'],
      ['name' => 'Bulk Activate Applicant Profiles', 'slug' => 'applicant-profiles.bulk_activate', 'module' => 'applicant_profiles', 'action' => 'bulk_activate'],
      ['name' => 'Bulk Deactivate Applicant Profiles', 'slug' => 'applicant-profiles.bulk_deactivate', 'module' => 'applicant_profiles', 'action' => 'bulk_deactivate'],
      ['name' => 'Filter Applicant Profiles', 'slug' => 'applicant-profiles.filter', 'module' => 'applicant_profiles', 'action' => 'filter'],
      ['name' => 'Export Applicant Profiles', 'slug' => 'applicant-profiles.export', 'module' => 'applicant_profiles', 'action' => 'export'],
      ['name' => 'Export Single Applicant Profile', 'slug' => 'applicant-profiles.export_single', 'module' => 'applicant_profiles', 'action' => 'export_single'],
      ['name' => 'View Applicant Profile Stats', 'slug' => 'applicant-profiles.stats', 'module' => 'applicant_profiles', 'action' => 'stats'],
      ['name' => 'View Applicant Analytics', 'slug' => 'applicant-profiles.analytics', 'module' => 'applicant_profiles', 'action' => 'analytics'],
      ['name' => 'Manage Profile Basic Info', 'slug' => 'applicant-profiles.manage_basic', 'module' => 'applicant_profiles', 'action' => 'manage_basic'],
      ['name' => 'Manage Profile Professional', 'slug' => 'applicant-profiles.manage_professional', 'module' => 'applicant_profiles', 'action' => 'manage_professional'],
      ['name' => 'Manage Profile Work History', 'slug' => 'applicant-profiles.manage_work', 'module' => 'applicant_profiles', 'action' => 'manage_work'],
      ['name' => 'Manage Profile Education', 'slug' => 'applicant-profiles.manage_education', 'module' => 'applicant_profiles', 'action' => 'manage_education'],
      ['name' => 'Manage Profile Achievements', 'slug' => 'applicant-profiles.manage_achievements', 'module' => 'applicant_profiles', 'action' => 'manage_achievements'],
      ['name' => 'Manage Profile Documents', 'slug' => 'applicant-profiles.manage_documents', 'module' => 'applicant_profiles', 'action' => 'manage_documents'],
      ['name' => 'Upload CV to Applicant Profile', 'slug' => 'applicant-profiles.upload_cv', 'module' => 'applicant_profiles', 'action' => 'upload_cv'],
      ['name' => 'Delete CV from Applicant Profile', 'slug' => 'applicant-profiles.delete_cv', 'module' => 'applicant_profiles', 'action' => 'delete_cv'],
      ['name' => 'Set Primary CV on Applicant Profile', 'slug' => 'applicant-profiles.set_primary_cv', 'module' => 'applicant_profiles', 'action' => 'set_primary_cv'],
      ['name' => 'Download CV from Applicant Profile', 'slug' => 'applicant-profiles.download_cv', 'module' => 'applicant_profiles', 'action' => 'download_cv'],
      ['name' => 'Upload Photo to Applicant Profile', 'slug' => 'applicant-profiles.upload_photo', 'module' => 'applicant_profiles', 'action' => 'upload_photo'],
      ['name' => 'Delete Photo from Applicant Profile', 'slug' => 'applicant-profiles.delete_photo', 'module' => 'applicant_profiles', 'action' => 'delete_photo'],
      ['name' => 'View Applicant Profile Completion', 'slug' => 'applicant-profiles.completion_view', 'module' => 'applicant_profiles', 'action' => 'completion_view'],
      ['name' => 'Update Applicant Profile Completion', 'slug' => 'applicant-profiles.completion_update', 'module' => 'applicant_profiles', 'action' => 'completion_update'],
      ['name' => 'Manage All Applicant Profiles', 'slug' => 'applicant-profiles.manage', 'module' => 'applicant_profiles', 'action' => 'manage'],
      ['name' => 'Assign Applicant Profile Roles', 'slug' => 'applicant-profiles.assign_roles', 'module' => 'applicant_profiles', 'action' => 'assign_roles'],

      // ==================== APPLICATIONS (Admin/Employer) ====================
      ['name' => 'View Applications', 'slug' => 'applications.view', 'module' => 'applications', 'action' => 'view'],
      ['name' => 'View Applications for Own Jobs', 'slug' => 'applications.view.for_own_jobs', 'module' => 'applications', 'action' => 'view_for_own_jobs'],
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
      ['name' => 'View Own Applications (Job Seeker)', 'slug' => 'application.view.own', 'module' => 'applications', 'action' => 'view_own'],
      ['name' => 'View Any Application', 'slug' => 'application.view.any', 'module' => 'applications', 'action' => 'view_any'],
      ['name' => 'Shortlist Application', 'slug' => 'application.shortlist', 'module' => 'applications', 'action' => 'shortlist'],
      ['name' => 'Reject Application', 'slug' => 'application.reject', 'module' => 'applications', 'action' => 'reject'],

      // ==================== APPLY (Job Seeker) ====================
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

      // ==================== BACKUP ====================
      ['name' => 'View Backups', 'slug' => 'backup.view', 'module' => 'backup', 'action' => 'view'],
      ['name' => 'Create Backup', 'slug' => 'backup.create', 'module' => 'backup', 'action' => 'create'],
      ['name' => 'Download Backup', 'slug' => 'backup.download', 'module' => 'backup', 'action' => 'download'],
      ['name' => 'Delete Backup', 'slug' => 'backup.delete', 'module' => 'backup', 'action' => 'delete'],
      ['name' => 'Restore Backup', 'slug' => 'backup.restore', 'module' => 'backup', 'action' => 'restore'],

      // ==================== BLOGS ====================
      ['name' => 'View Blogs', 'slug' => 'blogs.view', 'module' => 'blogs', 'action' => 'view'],
      ['name' => 'Create Blog', 'slug' => 'blogs.create', 'module' => 'blogs', 'action' => 'create'],
      ['name' => 'Update Blog', 'slug' => 'blogs.update', 'module' => 'blogs', 'action' => 'update'],
      ['name' => 'Delete Blog', 'slug' => 'blogs.destroy', 'module' => 'blogs', 'action' => 'destroy'],
      ['name' => 'Restore Blog', 'slug' => 'blogs.restore', 'module' => 'blogs', 'action' => 'restore'],
      // CMS Blog aliases (frontend uses cms.blogs.*)
      ['name' => 'CMS View Blogs', 'slug' => 'cms.blogs.view', 'module' => 'cms', 'action' => 'blogs_view'],
      ['name' => 'CMS Create Blog', 'slug' => 'cms.blogs.create', 'module' => 'cms', 'action' => 'blogs_create'],
      ['name' => 'CMS Edit Blog', 'slug' => 'cms.blogs.edit', 'module' => 'cms', 'action' => 'blogs_edit'],
      ['name' => 'CMS Delete Blog', 'slug' => 'cms.blogs.delete', 'module' => 'cms', 'action' => 'blogs_delete'],
      ['name' => 'CMS Restore Blog', 'slug' => 'cms.blogs.restore', 'module' => 'cms', 'action' => 'blogs_restore'],
      ['name' => 'CMS Force Delete Blog', 'slug' => 'cms.blogs.force-delete', 'module' => 'cms', 'action' => 'blogs_force_delete'],
      ['name' => 'CMS Toggle Blog Status', 'slug' => 'cms.blogs.toggle-status', 'module' => 'cms', 'action' => 'blogs_toggle_status'],
      ['name' => 'CMS Toggle Blog Featured', 'slug' => 'cms.blogs.toggle-featured', 'module' => 'cms', 'action' => 'blogs_toggle_featured'],

      // ==================== CACHE ====================
      ['name' => 'Manage Cache', 'slug' => 'cache.manage', 'module' => 'cache', 'action' => 'manage'],
      ['name' => 'Clear Cache', 'slug' => 'cache.clear', 'module' => 'cache', 'action' => 'clear'],
      ['name' => 'View Cache Status', 'slug' => 'cache.status', 'module' => 'cache', 'action' => 'status'],

      // ==================== CATEGORIES ====================
      ['name' => 'View Categories', 'slug' => 'categories.view', 'module' => 'categories', 'action' => 'view'],
      ['name' => 'Create Category', 'slug' => 'categories.create', 'module' => 'categories', 'action' => 'create'],
      ['name' => 'Edit Category', 'slug' => 'categories.edit', 'module' => 'categories', 'action' => 'edit'],
      ['name' => 'Update Category', 'slug' => 'categories.update', 'module' => 'categories', 'action' => 'update'],
      ['name' => 'Delete Category', 'slug' => 'categories.destroy', 'module' => 'categories', 'action' => 'destroy'],
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

      // ==================== CMS DASHBOARD ====================
      ['name' => 'CMS Dashboard', 'slug' => 'cms.dashboard', 'module' => 'cms', 'action' => 'dashboard'],

      // ==================== CMS PAGES ====================
      ['name' => 'View Pages', 'slug' => 'pages.view', 'module' => 'pages', 'action' => 'view'],
      ['name' => 'Create Page', 'slug' => 'pages.create', 'module' => 'pages', 'action' => 'create'],
      ['name' => 'Update Page', 'slug' => 'pages.update', 'module' => 'pages', 'action' => 'update'],
      ['name' => 'Delete Page', 'slug' => 'pages.destroy', 'module' => 'pages', 'action' => 'destroy'],
      ['name' => 'Restore Page', 'slug' => 'pages.restore', 'module' => 'pages', 'action' => 'restore'],
      ['name' => 'Manage Pages', 'slug' => 'pages.manage', 'module' => 'pages', 'action' => 'manage'],
      // CMS Pages aliases
      ['name' => 'CMS View Pages', 'slug' => 'cms.pages.view', 'module' => 'cms', 'action' => 'pages_view'],
      ['name' => 'CMS Create Page', 'slug' => 'cms.pages.create', 'module' => 'cms', 'action' => 'pages_create'],
      ['name' => 'CMS Edit Page', 'slug' => 'cms.pages.edit', 'module' => 'cms', 'action' => 'pages_edit'],
      ['name' => 'CMS Delete Page', 'slug' => 'cms.pages.delete', 'module' => 'cms', 'action' => 'pages_delete'],
      ['name' => 'CMS Restore Page', 'slug' => 'cms.pages.restore', 'module' => 'cms', 'action' => 'pages_restore'],
      ['name' => 'CMS Force Delete Page', 'slug' => 'cms.pages.force-delete', 'module' => 'cms', 'action' => 'pages_force_delete'],
      ['name' => 'CMS Toggle Page Status', 'slug' => 'cms.pages.toggle-status', 'module' => 'cms', 'action' => 'pages_toggle_status'],

      // ==================== CMS PROGRAMS ====================
      ['name' => 'View Programs', 'slug' => 'programs.view', 'module' => 'programs', 'action' => 'view'],
      ['name' => 'Create Program', 'slug' => 'programs.create', 'module' => 'programs', 'action' => 'create'],
      ['name' => 'Update Program', 'slug' => 'programs.update', 'module' => 'programs', 'action' => 'update'],
      ['name' => 'Delete Program', 'slug' => 'programs.destroy', 'module' => 'programs', 'action' => 'destroy'],
      ['name' => 'Restore Program', 'slug' => 'programs.restore', 'module' => 'programs', 'action' => 'restore'],
      // CMS Program aliases
      ['name' => 'CMS View Programs', 'slug' => 'cms.programs.view', 'module' => 'cms', 'action' => 'programs_view'],
      ['name' => 'CMS Create Program', 'slug' => 'cms.programs.create', 'module' => 'cms', 'action' => 'programs_create'],
      ['name' => 'CMS Edit Program', 'slug' => 'cms.programs.edit', 'module' => 'cms', 'action' => 'programs_edit'],
      ['name' => 'CMS Delete Program', 'slug' => 'cms.programs.delete', 'module' => 'cms', 'action' => 'programs_delete'],
      ['name' => 'CMS Restore Program', 'slug' => 'cms.programs.restore', 'module' => 'cms', 'action' => 'programs_restore'],
      ['name' => 'CMS Force Delete Program', 'slug' => 'cms.programs.force-delete', 'module' => 'cms', 'action' => 'programs_force_delete'],
      ['name' => 'CMS Toggle Program Status', 'slug' => 'cms.programs.toggle-status', 'module' => 'cms', 'action' => 'programs_toggle_status'],
      ['name' => 'CMS Toggle Program Featured', 'slug' => 'cms.programs.toggle-featured', 'module' => 'cms', 'action' => 'programs_toggle_featured'],

      // ==================== CMS PUBLICATIONS ====================
      ['name' => 'View Publications', 'slug' => 'publications.view', 'module' => 'publications', 'action' => 'view'],
      ['name' => 'Create Publication', 'slug' => 'publications.create', 'module' => 'publications', 'action' => 'create'],
      ['name' => 'Update Publication', 'slug' => 'publications.update', 'module' => 'publications', 'action' => 'update'],
      ['name' => 'Delete Publication', 'slug' => 'publications.destroy', 'module' => 'publications', 'action' => 'destroy'],
      ['name' => 'Restore Publication', 'slug' => 'publications.restore', 'module' => 'publications', 'action' => 'restore'],
      // CMS Publication aliases
      ['name' => 'CMS View Publications', 'slug' => 'cms.publications.view', 'module' => 'cms', 'action' => 'publications_view'],
      ['name' => 'CMS Create Publication', 'slug' => 'cms.publications.create', 'module' => 'cms', 'action' => 'publications_create'],
      ['name' => 'CMS Edit Publication', 'slug' => 'cms.publications.edit', 'module' => 'cms', 'action' => 'publications_edit'],
      ['name' => 'CMS Delete Publication', 'slug' => 'cms.publications.delete', 'module' => 'cms', 'action' => 'publications_delete'],
      ['name' => 'CMS Restore Publication', 'slug' => 'cms.publications.restore', 'module' => 'cms', 'action' => 'publications_restore'],
      ['name' => 'CMS Force Delete Publication', 'slug' => 'cms.publications.force-delete', 'module' => 'cms', 'action' => 'publications_force_delete'],
      ['name' => 'CMS Toggle Publication Status', 'slug' => 'cms.publications.toggle-status', 'module' => 'cms', 'action' => 'publications_toggle_status'],
      ['name' => 'CMS Toggle Publication Featured', 'slug' => 'cms.publications.toggle-featured', 'module' => 'cms', 'action' => 'publications_toggle_featured'],

      // ==================== CMS SECTIONS ====================
      ['name' => 'View Sections', 'slug' => 'sections.view', 'module' => 'sections', 'action' => 'view'],
      ['name' => 'Create Section', 'slug' => 'sections.create', 'module' => 'sections', 'action' => 'create'],
      ['name' => 'Update Section', 'slug' => 'sections.update', 'module' => 'sections', 'action' => 'update'],
      ['name' => 'Delete Section', 'slug' => 'sections.destroy', 'module' => 'sections', 'action' => 'destroy'],
      ['name' => 'Restore Section', 'slug' => 'sections.restore', 'module' => 'sections', 'action' => 'restore'],
      // CMS Section aliases
      ['name' => 'CMS View Sections', 'slug' => 'cms.sections.view', 'module' => 'cms', 'action' => 'sections_view'],
      ['name' => 'CMS Create Section', 'slug' => 'cms.sections.create', 'module' => 'cms', 'action' => 'sections_create'],
      ['name' => 'CMS Edit Section', 'slug' => 'cms.sections.edit', 'module' => 'cms', 'action' => 'sections_edit'],
      ['name' => 'CMS Delete Section', 'slug' => 'cms.sections.delete', 'module' => 'cms', 'action' => 'sections_delete'],
      ['name' => 'CMS Restore Section', 'slug' => 'cms.sections.restore', 'module' => 'cms', 'action' => 'sections_restore'],
      ['name' => 'CMS Force Delete Section', 'slug' => 'cms.sections.force-delete', 'module' => 'cms', 'action' => 'sections_force_delete'],
      ['name' => 'CMS Reorder Sections', 'slug' => 'cms.sections.reorder', 'module' => 'cms', 'action' => 'sections_reorder'],
      ['name' => 'CMS Toggle Section Status', 'slug' => 'cms.sections.toggle-status', 'module' => 'cms', 'action' => 'sections_toggle_status'],
      ['name' => 'CMS Manage Sections', 'slug' => 'cms.sections.manage', 'module' => 'cms', 'action' => 'sections_manage'],

      // ==================== CMS SHARED DATA ====================
      ['name' => 'View Shared Data', 'slug' => 'shared_data.view', 'module' => 'shared_data', 'action' => 'view'],
      ['name' => 'Update Shared Data', 'slug' => 'shared_data.update', 'module' => 'shared_data', 'action' => 'update'],
      ['name' => 'CMS View Shared Data', 'slug' => 'cms.shared.view', 'module' => 'cms', 'action' => 'shared_view'],
      ['name' => 'CMS Edit Shared Data', 'slug' => 'cms.shared.edit', 'module' => 'cms', 'action' => 'shared_edit'],
      ['name' => 'CMS Update Shared Data', 'slug' => 'cms.shared.update', 'module' => 'cms', 'action' => 'shared_update'],

      // ==================== EMPLOYER PROFILE ====================
      ['name' => 'View Employer', 'slug' => 'employer.view', 'module' => 'employer', 'action' => 'view'],
      ['name' => 'Manage Employer', 'slug' => 'employer.manage', 'module' => 'employer', 'action' => 'manage'],
      ['name' => 'Update Employer', 'slug' => 'employer.update', 'module' => 'employer', 'action' => 'update'],
      ['name' => 'Delete Employer', 'slug' => 'employer.destroy', 'module' => 'employer', 'action' => 'destroy'],
      ['name' => 'View Employer Profile', 'slug' => 'employer_profile.view', 'module' => 'employer_profile', 'action' => 'view'],
      ['name' => 'Edit Employer Profile', 'slug' => 'employer_profile.edit', 'module' => 'employer_profile', 'action' => 'edit'],
      ['name' => 'Update Employer Profile', 'slug' => 'employer_profile.update', 'module' => 'employer_profile', 'action' => 'update'],
      ['name' => 'Update Employer Password', 'slug' => 'employer_profile.update_password', 'module' => 'employer_profile', 'action' => 'update_password'],

      // ==================== JOB LISTINGS ====================
      ['name' => 'View Job Listings', 'slug' => 'job_listings.view', 'module' => 'job_listings', 'action' => 'view'],
      ['name' => 'Create Job Listing', 'slug' => 'job_listings.create', 'module' => 'job_listings', 'action' => 'create'],
      ['name' => 'Store Job Listing', 'slug' => 'job_listings.store', 'module' => 'job_listings', 'action' => 'store'],
      ['name' => 'Show Job Listing', 'slug' => 'job_listings.show', 'module' => 'job_listings', 'action' => 'show'],
      ['name' => 'Edit Job Listing', 'slug' => 'job_listings.edit', 'module' => 'job_listings', 'action' => 'edit'],
      ['name' => 'Update Job Listing', 'slug' => 'job_listings.update', 'module' => 'job_listings', 'action' => 'update'],
      ['name' => 'Delete Job Listing', 'slug' => 'job_listings.destroy', 'module' => 'job_listings', 'action' => 'destroy'],
      ['name' => 'Toggle Job Active', 'slug' => 'job_listings.toggle_active', 'module' => 'job_listings', 'action' => 'toggle_active'],
      ['name' => 'View Job Applications', 'slug' => 'job_listings.applications', 'module' => 'job_listings', 'action' => 'applications'],
      ['name' => 'Update Job Statuses', 'slug' => 'job_listings.update_statuses', 'module' => 'job_listings', 'action' => 'update_statuses'],
      ['name' => 'Restore Job Listing', 'slug' => 'job_listings.restore', 'module' => 'job_listings', 'action' => 'restore'],
      ['name' => 'Force Delete Job Listing', 'slug' => 'job_listings.force_delete', 'module' => 'job_listings', 'action' => 'force_delete'],
      ['name' => 'Bulk Activate Jobs', 'slug' => 'job_listings.bulk_activate', 'module' => 'job_listings', 'action' => 'bulk_activate'],
      ['name' => 'Bulk Deactivate Jobs', 'slug' => 'job_listings.bulk_deactivate', 'module' => 'job_listings', 'action' => 'bulk_deactivate'],
      ['name' => 'Bulk Delete Jobs', 'slug' => 'job_listings.bulk_delete', 'module' => 'job_listings', 'action' => 'bulk_delete'],
      ['name' => 'Job Statistics', 'slug' => 'job_listings.statistics', 'module' => 'job_listings', 'action' => 'statistics'],
      ['name' => 'Manage Jobs', 'slug' => 'jobs.manage', 'module' => 'job_listings', 'action' => 'manage'],

      // Additional job view permissions (frontend)
      ['name' => 'View Any Job', 'slug' => 'job.view.any', 'module' => 'job_listings', 'action' => 'view_any'],
      ['name' => 'View Own Job', 'slug' => 'job.view.own', 'module' => 'job_listings', 'action' => 'view_own'],
      ['name' => 'Edit Own Job', 'slug' => 'job.edit.own', 'module' => 'job_listings', 'action' => 'edit_own'],

      // ==================== PUBLIC JOBS ====================
      ['name' => 'View Public Jobs', 'slug' => 'public_jobs.view', 'module' => 'public_jobs', 'action' => 'view'],
      ['name' => 'Show Public Job', 'slug' => 'public_jobs.show', 'module' => 'public_jobs', 'action' => 'show'],
      ['name' => 'View Popular Jobs', 'slug' => 'public_jobs.popular', 'module' => 'public_jobs', 'action' => 'popular'],
      ['name' => 'View Trending Jobs', 'slug' => 'public_jobs.trending', 'module' => 'public_jobs', 'action' => 'trending'],
      ['name' => 'Bookmark Job', 'slug' => 'public_jobs.bookmark', 'module' => 'public_jobs', 'action' => 'bookmark'],
      ['name' => 'Share Job', 'slug' => 'public_jobs.share', 'module' => 'public_jobs', 'action' => 'share'],
      ['name' => 'Print Job Details', 'slug' => 'public_jobs.print', 'module' => 'public_jobs', 'action' => 'print'],

      // ==================== LOCATIONS ====================
      ['name' => 'View Locations', 'slug' => 'locations.view', 'module' => 'locations', 'action' => 'view'],
      ['name' => 'Create Location', 'slug' => 'locations.create', 'module' => 'locations', 'action' => 'create'],
      ['name' => 'Edit Location', 'slug' => 'locations.edit', 'module' => 'locations', 'action' => 'edit'],
      ['name' => 'Update Location', 'slug' => 'locations.update', 'module' => 'locations', 'action' => 'update'],
      ['name' => 'Delete Location', 'slug' => 'locations.destroy', 'module' => 'locations', 'action' => 'destroy'],
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

      // ==================== LOGS ====================
      ['name' => 'View Logs', 'slug' => 'logs.view', 'module' => 'logs', 'action' => 'view'],
      ['name' => 'Export Logs', 'slug' => 'logs.export', 'module' => 'logs', 'action' => 'export'],
      ['name' => 'Clear Logs', 'slug' => 'logs.clear', 'module' => 'logs', 'action' => 'clear'],
      ['name' => 'Manage Logs', 'slug' => 'logs.manage', 'module' => 'logs', 'action' => 'manage'],

      // ==================== NEWSLETTER ====================
      ['name' => 'View Newsletter Subscribers', 'slug' => 'newsletter.view', 'module' => 'newsletter', 'action' => 'view'],
      ['name' => 'Export Newsletter Subscribers', 'slug' => 'newsletter.export', 'module' => 'newsletter', 'action' => 'export'],
      ['name' => 'Delete Newsletter Subscriber', 'slug' => 'newsletter.delete', 'module' => 'newsletter', 'action' => 'delete'],
      ['name' => 'Send Newsletter Email', 'slug' => 'newsletter.send', 'module' => 'newsletter', 'action' => 'send'],
      ['name' => 'Update Newsletter Subscriber', 'slug' => 'newsletter.update', 'module' => 'newsletter', 'action' => 'update'],

      // ==================== NOTIFICATIONS ====================
      ['name' => 'View Notifications', 'slug' => 'notifications.view', 'module' => 'notifications', 'action' => 'view'],
      ['name' => 'Mark Notification Read', 'slug' => 'notifications.mark_read', 'module' => 'notifications', 'action' => 'mark_read'],
      ['name' => 'Mark All Notifications Read', 'slug' => 'notifications.mark_all_read', 'module' => 'notifications', 'action' => 'mark_all_read'],

      // ==================== PROFILES (Legacy) ====================
      ['name' => 'View Profile', 'slug' => 'profiles.view', 'module' => 'profiles', 'action' => 'view'],
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
      ['name' => 'Upload CV to Profile', 'slug' => 'profiles.upload_cv', 'module' => 'profiles', 'action' => 'upload_cv'],
      ['name' => 'Delete CV from Profile', 'slug' => 'profiles.destroy_cv', 'module' => 'profiles', 'action' => 'destroy_cv'],
      ['name' => 'Set Primary CV on Profile', 'slug' => 'profiles.set_primary_cv', 'module' => 'profiles', 'action' => 'set_primary_cv'],
      ['name' => 'Change Profile Password', 'slug' => 'profiles.change_password', 'module' => 'profiles', 'action' => 'change_password'],
      ['name' => 'Download CV from Profile', 'slug' => 'profiles.download_cv', 'module' => 'profiles', 'action' => 'download_cv'],
      ['name' => 'View Profile Photo', 'slug' => 'profiles.photo', 'module' => 'profiles', 'action' => 'photo'],
      ['name' => 'Get Profile Data', 'slug' => 'profiles.get_data', 'module' => 'profiles', 'action' => 'get_data'],
      ['name' => 'Manage Profiles', 'slug' => 'profiles.manage', 'module' => 'profiles', 'action' => 'manage'],

      // ==================== PROFILE COMPLETION ====================
      ['name' => 'Show Profile Completion', 'slug' => 'profile_completion.show', 'module' => 'profile_completion', 'action' => 'show'],
      ['name' => 'Store Profile Completion', 'slug' => 'profile_completion.store', 'module' => 'profile_completion', 'action' => 'store'],
      ['name' => 'Upload Profile Photo', 'slug' => 'profile_completion.upload_photo', 'module' => 'profile_completion', 'action' => 'upload_photo'],
      ['name' => 'Delete Profile Photo', 'slug' => 'profile_completion.delete_photo', 'module' => 'profile_completion', 'action' => 'delete_photo'],
      ['name' => 'Upload Pending CV', 'slug' => 'profile_completion.upload_cv', 'module' => 'profile_completion', 'action' => 'upload_cv'],
      ['name' => 'Delete Pending CV', 'slug' => 'profile_completion.destroy_cv', 'module' => 'profile_completion', 'action' => 'destroy_cv'],
      ['name' => 'Set Primary Pending CV', 'slug' => 'profile_completion.set_primary_cv', 'module' => 'profile_completion', 'action' => 'set_primary_cv'],

      // ==================== REPORTS ====================
      ['name' => 'View Job Reports', 'slug' => 'report.jobs', 'module' => 'reports', 'action' => 'jobs'],
      ['name' => 'View Application Reports', 'slug' => 'report.applications', 'module' => 'reports', 'action' => 'applications'],
      ['name' => 'Export Reports', 'slug' => 'report.export', 'module' => 'reports', 'action' => 'export'],

      // ==================== ROLES ====================
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
      ['name' => 'Bulk Force Delete Roles', 'slug' => 'roles.bulk_force_delete', 'module' => 'roles', 'action' => 'bulk_force_delete'],
      ['name' => 'Toggle Role Status', 'slug' => 'roles.toggle_status', 'module' => 'roles', 'action' => 'toggle_status'],
      ['name' => 'Clone Role', 'slug' => 'roles.clone', 'module' => 'roles', 'action' => 'clone'],
      ['name' => 'Export Roles', 'slug' => 'roles.export', 'module' => 'roles', 'action' => 'export'],
      ['name' => 'Assign All Permissions', 'slug' => 'roles.assign_all_permissions', 'module' => 'roles', 'action' => 'assign_all_permissions'],

      // ==================== STATISTICS ====================
      ['name' => 'View Statistics', 'slug' => 'statistics.view', 'module' => 'statistics', 'action' => 'view'],
      ['name' => 'Export Statistics', 'slug' => 'statistics.export', 'module' => 'statistics', 'action' => 'export'],
      ['name' => 'ATS Stats', 'slug' => 'statistics.ats', 'module' => 'statistics', 'action' => 'ats'],
      ['name' => 'Employer Stats', 'slug' => 'statistics.employers', 'module' => 'statistics', 'action' => 'employers'],
      ['name' => 'Job Stats', 'slug' => 'statistics.jobs', 'module' => 'statistics', 'action' => 'jobs'],
      ['name' => 'Application Stats', 'slug' => 'statistics.applications', 'module' => 'statistics', 'action' => 'applications'],
      ['name' => 'Manage Statistics', 'slug' => 'statistics.manage', 'module' => 'statistics', 'action' => 'manage'],
      ['name' => 'View Statistics Dashboard', 'slug' => 'statistics.dashboard', 'module' => 'statistics', 'action' => 'dashboard'],

      // ==================== USERS ====================
      ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'users', 'action' => 'view'],
      ['name' => 'Create User', 'slug' => 'users.create', 'module' => 'users', 'action' => 'create'],
      ['name' => 'Update User', 'slug' => 'users.update', 'module' => 'users', 'action' => 'update'],
      ['name' => 'Delete User', 'slug' => 'users.destroy', 'module' => 'users', 'action' => 'destroy'],
      ['name' => 'Restore User', 'slug' => 'users.restore', 'module' => 'users', 'action' => 'restore'],
      ['name' => 'Force Delete User', 'slug' => 'users.force_delete', 'module' => 'users', 'action' => 'force_delete'],
      ['name' => 'Bulk Delete Users', 'slug' => 'users.bulk_delete', 'module' => 'users', 'action' => 'bulk_delete'],
      ['name' => 'Bulk Restore Users', 'slug' => 'users.bulk_restore', 'module' => 'users', 'action' => 'bulk_restore'],
      ['name' => 'Verify User Email', 'slug' => 'users.verify', 'module' => 'users', 'action' => 'verify'],
      ['name' => 'Manage Users', 'slug' => 'users.manage', 'module' => 'users', 'action' => 'manage'],

      // ==================== PERMISSIONS (direct) ====================
      ['name' => 'View Permissions', 'slug' => 'permissions.view', 'module' => 'permissions', 'action' => 'view'],
      ['name' => 'Create Permission', 'slug' => 'permissions.create', 'module' => 'permissions', 'action' => 'create'],
      ['name' => 'Edit Permission', 'slug' => 'permissions.edit', 'module' => 'permissions', 'action' => 'edit'],
      ['name' => 'Delete Permission', 'slug' => 'permissions.delete', 'module' => 'permissions', 'action' => 'delete'],
      ['name' => 'Bulk Assign Permissions', 'slug' => 'permissions.bulk_assign', 'module' => 'permissions', 'action' => 'bulk_assign'],
    ];

    // Disable foreign key checks
    DB::statement('SET FOREIGN_KEY_CHECKS=0');
    DB::table('permissions')->truncate();
    DB::statement('SET FOREIGN_KEY_CHECKS=1');

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
  }
}
