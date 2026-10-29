# Independent Processes & Services Documentation

This document describes all independent processes, services, and modules in the Dwip Unnayan Sangstha website project. The application is built on Laravel 12 + React 19 + Inertia.js 2, with a monolithic architecture containing several distinct functional domains.

---

## Table of Contents

1. [Content Management System (CMS)](#1-content-management-system-cms)
2. [Job Portal](#2-job-portal)
3. [Application Tracking System (ATS)](#3-application-tracking-system-ats)
4. [Newsletter System](#4-newsletter-system)
5. [User & Role Management](#5-user--role-management)
6. [Dashboard & Analytics](#6-dashboard--analytics)
7. [Audit & Logging](#7-audit--logging)
8. [Asset Management](#8-asset-management)
9. [Page Mapping & Navigation](#9-page-mapping--navigation)
10. [Background Processes & Scheduled Tasks](#10-background-processes--scheduled-tasks)
11. [Caching Layer](#11-caching-layer)
12. [Performance Monitoring](#12-performance-monitoring)

---

## 1. Content Management System (CMS)

**Purpose:** Manages all dynamic, page-specific content rendered on the public-facing website.

**Controllers:**
- `app/Http/Controllers/Cms/PageController.php` — Page CRUD (slug, name, title, meta)
- `app/Http/Controllers/Cms/SectionController.php` — Section configuration per page (component, data_table, data_key, custom_props, display_order, is_enabled)
- `app/Http/Controllers/Cms/BlogController.php` — Blog posts (title, excerpt, content, image, tags, featured)
- `app/Http/Controllers/Cms/ProgramController.php` — Programs/projects (title, breadcrumb, image, display_order, featured)
- `app/Http/Controllers/Cms/PublicationController.php` — Publications (title, excerpt, pdf_url, date, author, read_time, category, tags)
- `app/Http/Controllers/Cms/AboutContentController.php` — About page content sections (type, content, icon, bg_color, btn_text, btn_link)
- `app/Http/Controllers/Cms/SharedDataController.php` — Shared data (topbar, navbar, footer, banner, faq, stories)
- `app/Http/Controllers/Cms/EditorImageUploadController.php` — Rich text editor image uploads

**Models:**
- `Page` — Page definitions (slug, name, title, meta_description, is_active)
- `SectionConfig` — Section-to-page mapping (page_slug, section_key, component, data_table, data_key, prop_name, display_order, is_enabled, is_fixed_section, is_special_component, custom_props)
- `CustomSectionData` — Page/section-specific custom data (page_slug, section_key, data, is_active)
- `SharedData` — Global shared data (type, data, is_active)
- `Blog` — Blog posts
- `Program` — Programs/projects
- `Publication` — Publications/research papers
- `AboutContent` — About page content blocks

**Frontend Components:**
- `resources/js/Sections/_runtime/DynamicSectionRenderer.jsx` — Lazy-loads section components
- `resources/js/Sections/_runtime/sectionRegistry.js` — Maps component names to lazy imports
- 26 section components in `resources/js/Sections/` (AboutUsSection, BannerSection, BlogSection, CardsSection, FAQSection, etc.)

**Key Business Logic:**
- Pages are defined by slug and contain ordered section configs
- Each section config references a `data_table` (blogs, programs, publications, about_content, shared_data, custom_section_data, jobs)
- `ContentService` resolves section data with 60-minute cache TTL
- Sections can be enabled/disabled per page
- Fixed sections cannot be removed, only reordered
- Special components (HeroFigure, UpcomingEvents) have unique rendering logic

**Cache Keys:**
- `page.{slug}` — Page record
- `sections.{pageSlug}` — Section configs
- `section_data.{pageSlug}.{sectionKey}` — Section data
- `shared.{type}` — Shared data (topbar, navbar, footer, etc.)
- `content.blogs`, `content.programs`, `content.publications` — Content lists

**Permissions:**
- `pages.view`, `pages.create`, `pages.update`, `pages.delete`
- `sections.view`, `sections.create`, `sections.update`, `sections.delete`
- `blogs.view`, `blogs.create`, `blogs.update`, `blogs.delete`, `blogs.toggle_status`, `blogs.toggle_featured`
- `programs.view`, `programs.create`, `programs.update`, `programs.delete`, `programs.toggle_status`, `programs.toggle_featured`
- `publications.view`, `publications.create`, `publications.update`, `publications.delete`, `publications.toggle_status`, `publications.toggle_featured`
- `about.view`, `about.create`, `about.update`, `about.delete`

---

## 2. Job Portal

**Purpose:** Manages job listings, employer accounts, and the public job browsing experience.

**Controllers:**
- `app/Http/Controllers/JobListing/JobListingController.php` — Employer job CRUD (create, edit, update, delete, toggle status)
- `app/Http/Controllers/JobListing/PublicJobListingController.php` — Public job browsing (list, search, filter, show)
- `app/Http/Controllers/Backend/JobCategoryController.php` — Job category management
- `app/Http/Controllers/Backend/LocationController.php` — Location management
- `app/Http/Controllers/Backend/ApplicationsController.php` — Application management for employers/admins

**Models:**
- `JobListing` — Job posts (title, slug, description, requirements, job_type, salary range, category, experience level, education, skills, benefits, responsibilities, keywords, application_deadline, publish_at, views_count, is_active, user_id, required_facebook_link, required_linkedin_link)
- `JobCategory` — Job categories (name, slug, is_active)
- `Location` — Locations (name, address, is_active)
- `JobView` — View tracking (job_listing_id, ip_address, user_id)
- `JobHistory` — Job history records

**Frontend Components:**
- `resources/js/Sections/JobsSection/JobsSection.jsx` — Public job listing section
- `resources/js/pages/Frontend/JobsDetails/` — Job detail pages
- `resources/js/pages/Backend/JobListings/` — Employer job management

**Key Business Logic:**
- Jobs have status lifecycle: draft → published → expired (auto-updated hourly via `jobs:update-status` command)
- Jobs require approval workflow for some roles
- Salary can be negotiable or "as per company policy"
- Jobs support multiple locations (many-to-many via `job_listing_location`)
- View tracking records IP and user for analytics
- Application deadline enforcement

**Permissions:**
- `jobs.view`, `jobs.create`, `jobs.update`, `jobs.delete`
- `job-categories.view`, `job-categories.create`, `job-categories.update`, `job-categories.delete`
- `locations.view`, `locations.create`, `locations.update`, `locations.delete`

---

## 3. Application Tracking System (ATS)

**Purpose:** Manages job applications, ATS scoring, and applicant screening.

**Controllers:**
- `app/Http/Controllers/ApplyController.php` — Public application submission
- `app/Http/Controllers/Backend/ApplicationsController.php` — Admin/employer application management (status updates, bulk actions, export, email)
- `app/Http/Controllers/Backend/ApplicantProfileController.php` — Applicant profile management (CV upload, education, experience, achievements)

**Models:**
- `Application` — Job applications (user_id, job_listing_id, applicant_profile_id, name, email, phone, education_level, years_of_experience, resume_path, expected_salary, ats_score, matched_keywords, missing_keywords, ats_last_attempted_at, ats_attempt_count, ats_calculation_status, status, employer_notes, facebook_link, linkedin_link)
- `ApplicantProfile` — Applicant profiles (first_name, last_name, birth_date, gender, blood_type, phone, address, photo_path, social_links, experience_years, current_job_title)
- `ApplicantCv` — CV files (applicant_profile_id, file_path, file_name, is_primary)
- `EducationHistory` — Education records (applicant_profile_id, institution, degree, field, start_year, end_year)
- `JobHistory` — Work experience (applicant_profile_id, company, position, start_year, end_year, is_current)
- `StatusTimeline` — Application status change history

**Services:**
- `ATSService.php` — ATS scoring algorithm (keyword matching, score calculation, retry logic)

**Key Business Logic:**
- Applications flow through statuses: pending → reviewed → shortlisted → rejected
- ATS scoring calculates match percentage based on keywords, skills, experience
- ATS can be recalculated on demand
- Bulk operations: status update, delete, download, email
- Export to CSV/Excel
- Email notifications on status changes
- Resume/CV upload and management
- Profile completion tracking (EnsureApplicantProfileComplete middleware)

**Permissions:**
- `applications.view`, `applications.update`, `applications.delete`
- `applicant-profiles.view`, `applicant-profiles.update`, `applicant-profiles.delete`

---

## 4. Newsletter System

**Purpose:** Manages email newsletter subscriptions and campaign sending.

**Controllers:**
- `app/Http/Controllers/Backend/NewsletterController.php` — Subscriber management (list, bulk delete, bulk unsubscribe, export)
- `app/Http/Controllers/Backend/NewsletterCampaignController.php` — Campaign management (create, edit, preview, send, duplicate, retry, export)

**Models:**
- `NewsletterSubscription` — Subscribers (email, name, token, status, subscribed_at, unsubscribed_at, ip_address, user_agent, source)
- `NewsletterCampaign` — Campaigns (subject, preview_text, from_name, from_email, reply_to, content, html_content, audience_type, audience_meta, status, total_subscribers, sent_count, failed_count, open_count, click_count, bounced_count, created_by, batch_id, scheduled_at, started_at, completed_at)
- `NewsletterCampaignRecipient` — Per-recipient tracking (campaign_id, subscriber_id, email, status, error_message, attempts, sent_at)

**Services:**
- `NewsletterContentRenderer.php` — Renders newsletter HTML content

**Key Business Logic:**
- Subscribers can subscribe/unsubscribe via token links
- Campaigns support audience targeting (all active, filtered, selected)
- Campaign lifecycle: draft → pending → processing → completed/failed
- Campaigns can be scheduled, duplicated, retried
- Recipient tracking with open/click/bounce metrics
- Bulk email sending with test email support
- Export subscribers and campaign recipients

**Permissions:**
- `newsletter.view`, `newsletter.create`, `newsletter.update`, `newsletter.delete`
- `newsletter-campaigns.view`, `newsletter-campaigns.create`, `newsletter-campaigns.update`, `newsletter-campaigns.delete`

---

## 5. User & Role Management

**Purpose:** RBAC system with granular permissions for all backend features.

**Controllers:**
- `app/Http/Controllers/Backend/UserController.php` — User CRUD (list, create, edit, delete, restore, force-delete)
- `app/Http/Controllers/Backend/RoleController.php` — Role management (create, edit, permissions assignment)
- `app/Http/Controllers/Auth/AdminStaff/AdminLoginController.php` — Admin/staff login
- `app/Http/Controllers/Auth/JobSeeker/JobSeekerLoginController.php` — Job seeker login
- `app/Http/Controllers/Auth/JobSeeker/JobSeekerRegisterController.php` — Job seeker registration
- `app/Http/Controllers/Auth/Shared/GoogleAuthController.php` — Google OAuth

**Models:**
- `User` — Users (name, email, password, google_id, google_avatar, email_verified_at, deleted_at)
- `Role` — Roles (name, slug, description, level, is_default, is_active, created_by, updated_by)
- `Permission` — Permissions (name, slug, module, action, description, is_active)
- `UserRole` — User-role assignments (user_id, role_id, assigned_by, assigned_at, expires_at, is_active)
- `RoleModuleAccess` — Module-level access control

**Traits:**
- `HasRoles` — Role/permission checking methods on User model

**Key Business Logic:**
- Roles have hierarchical levels (higher level = more permissions)
- Permissions are grouped by module (cms, jobs, applications, users, etc.) and action (view, create, update, delete, etc.)
- Role-module access controls which modules a role can access
- User-role assignments can expire
- Google OAuth integration for job seekers
- Email verification required for new accounts

**Permissions:**
- `users.view`, `users.create`, `users.update`, `users.delete`
- `roles.view`, `roles.create`, `roles.update`, `roles.delete`
- `permissions.view`, `permissions.create`, `permissions.update`, `permissions.delete`

---

## 6. Dashboard & Analytics

**Purpose:** Aggregated metrics and analytics for admin/staff users.

**Controllers:**
- `app/Http/Controllers/Admin/DashboardController.php` — Dashboard data provider (role-based)

**Services:**
- `app/Services/DashboardMetrics.php` — Comprehensive metrics calculation
  - `platformKpis()` — Users, jobs, applications, engagement
  - `timeSeries()` — Daily series for applications, views, jobs, signups
  - `funnel()` — Application funnel (overall + by job_type, category, experience)
  - `distributions()` — Jobs by type, experience, category, location
  - `pipelineHealth()` — Pending apps, avg response time, stale rate
  - `atsHealth()` — ATS scoring stats (completed, stuck, success rate)
  - `applicantPool()` — Profile completion, CV rates, repeat applicants
  - `topEmployers()` — Employer rankings by jobs/applications
  - `periodComparison()` — Period-over-period percentage changes
  - `cmsHealth()` — CMS content metrics (pages, sections, blogs, programs, publications)
  - `newsletterHealth()` — Newsletter metrics (subscribers, campaigns)

**Frontend:**
- `resources/js/pages/dashboard.jsx` — Role-based dashboard with permission-gated sections
- Stats cards, quick actions, top jobs, activity feed, progress card
- CMS Overview, Newsletter, Platform Health, Top Employers, Period Comparison sections

**Permissions:**
- `dashboard.view`, `dashboard.admin`, `dashboard.employer`

---

## 7. Audit & Logging

**Purpose:** Tracks all system mutations and errors for compliance and debugging.

**Middleware:**
- `AuditMutations` — Records all POST/PUT/PATCH/DELETE requests with subject resolution
- `SanitizeInput` — Detects SQL injection/XSS attempts
- `SecurityHeaders` — Adds security headers to responses

**Services:**
- `AuditLogger.php` — Records audit trail entries (user, action, subject, changes, IP, user agent)
- `SimpleLogger.php` — File-based logging with rotation

**Console Commands:**
- `PruneAuditLogs` — Prunes audit log entries older than retention period
- `PruneSystemLogs` — Prunes system log files older than retention period

**Permissions:**
- `audit-logs.view`, `audit-logs.export`, `audit-logs.prune`
- `logs.view`, `logs.prune`

---

## 8. Asset Management

**Purpose:** Manages uploaded files, images, and documents.

**Controllers:**
- `app/Http/Controllers/Backend/AssetManagerController.php` — Asset library management
- `app/Http/Controllers/Cms/EditorImageUploadController.php` — Rich text editor image uploads

**Services:**
- `AssetLibrary.php` — File storage, retrieval, and management

**Frontend:**
- `resources/js/pages/Backend/Assets/` — Asset management UI
- `resources/js/pages/Backend/CMS/Shared/components/` — File upload components

**Key Business Logic:**
- Filesystem-only mode (no database records for assets)
- Image upload with validation (size, type)
- Editor image upload for rich text content
- Delete editor images on content deletion

---

## 9. Page Mapping & Navigation

**Purpose:** Manages the sitemap and public URL structure.

**Controllers:**
- `app/Http/Controllers/Backend/PageMapController.php` — Page map management
- `app/Http/Controllers/Frontend/PageController.php` — Dynamic page rendering

**Services:**
- `PageMapService.php` — Generates public URL mappings

**Frontend:**
- `resources/js/pages/Frontend/Sitemap.jsx` — Public sitemap page
- `resources/js/pages/Frontend/DynamicPage.jsx` — Dynamic page renderer
- `resources/js/pages/Frontend/GenericPage.jsx` — Generic page wrapper
- `resources/js/pages/Frontend/NotFound.jsx` — 404 page

**Key Business Logic:**
- Pages are defined by slug and rendered dynamically
- Section configs determine page layout
- Sitemap generated from page map
- Cache invalidation on content changes

---

## 10. Background Processes & Scheduled Tasks

**Purpose:** Automated maintenance and data processing tasks.

**Console Commands:**
| Command | Schedule | Description |
|---------|----------|-------------|
| `jobs:update-status` | Hourly | Updates job statuses (draft → published → expired) |
| `audit:prune` | Daily at 03:30 | Prunes old audit log entries |
| `logs:prune` | Daily at 04:00 | Prunes old log files |
| `frontend:clear-cache` | Manual | Clears frontend cache |
| `dus:cache-benchmark` | Manual | Runs cache performance benchmarks |
| `db:seed` | Manual | Seeds database with initial data |

**Middleware:**
- `HandleInertiaRequests` — Shares Inertia props (auth, flash messages, storage URL)
- `EnsureApplicantProfileComplete` — Redirects incomplete profiles to completion page

---

## 11. Caching Layer

**Purpose:** Reduces database load for public content and improves response times.

**Cache Strategy:**
- **Driver:** File-based cache (default), configurable via `CACHE_DRIVER`
- **TTL:** 60 minutes for content, 5 minutes for section configs, 1 hour for sitemap
- **Invalidation:** Automatic on content updates (via cache key deletion)
- **Cache keys:** `page.{slug}`, `sections.{pageSlug}`, `section_data.{pageSlug}.{sectionKey}`, `shared.{type}`, `content.blogs`, etc.

**Cache Tests:**
- `ContentServiceCacheTest.php` — Cache hit/miss verification
- `CacheInvalidationTest.php` — Cache invalidation on updates
- `DatabaseCacheStoreTest.php` — Cache store integrity
- `HttpPipelineCacheTest.php` — HTTP-level cache verification
- `CacheValidationTest.php` — Comprehensive cache validation (new)

**Performance Monitoring:**
- `PerformanceMonitor` middleware tracks all controller execution times
- Logs to `performance` channel with daily rotation
- Flags controllers exceeding 500ms threshold
- Configurable via `PERFORMANCE_THRESHOLD_MS` env variable

---

## 12. Performance Monitoring

**Purpose:** Tracks system performance and identifies bottlenecks.

**Implementation:**
- `PerformanceMonitor` middleware (registered in web group)
- Measures wall-clock time using `hrtime(true)`
- Records route name, controller, method, elapsed time, status code, URL
- Logs to dedicated `performance` channel
- Warning level for slow requests (≥ threshold)
- Debug level for normal requests

**Log Format:**
```
[2026-10-29 03:35:00] performance.DEBUG: Controller execution {"route":"home","controller":"Frontend\\PageController@show","method":"GET","elapsed_ms":12.345,"threshold_ms":500,"status":200,"url":"http://localhost/"}
[2026-10-29 03:35:00] performance.WARNING: Slow controller detected {"route":"backend.dashboard","controller":"Admin\\DashboardController@index","method":"GET","elapsed_ms":850.123,"threshold_ms":500,"status":200,"url":"http://localhost/backend/dashboard"}
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 19)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Public Pages │  │ Admin Panel  │  │ Job Seeker Portal   │   │
│  │ (Inertia)   │  │ (Inertia)    │  │ (Inertia)           │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘   │
│         │                │                      │              │
│  ┌──────┴────────────────┴──────────────────────┴──────────┐   │
│  │              DynamicSectionRenderer (Lazy)              │   │
│  │  26 Section Components + Section Registry              │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Inertia.js
┌──────────────────────────┴──────────────────────────────────────┐
│                     BACKEND (Laravel 12)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ PageController│  │ DashboardCtrl│  │ ContentService     │   │
│  │ (Frontend)  │  │ (Admin)      │  │ (CMS Data)          │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘   │
│         │                │                      │              │
│  ┌──────┴────────────────┴──────────────────────┴──────────┐   │
│  │              Content Management System                   │   │
│  │  Pages → Sections → Data (Blogs, Programs, etc.)        │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Job Portal  │  │ ATS Service  │  │ Newsletter Service  │   │
│  │ (Listings)  │  │ (Scoring)    │  │ (Campaigns)        │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬──────────┘   │
│         │                │                      │              │
│  ┌──────┴────────────────┴──────────────────────┴──────────┐   │
│  │              User & Role Management (RBAC)              │   │
│  │  Users → Roles → Permissions → Module Access            │   │
│  └────────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ Audit Logger│  │ Performance  │  │ Cache Layer         │   │
│  │ (Mutations) │  │ Monitor      │  │ (File-based)        │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                      DATABASE (MySQL/SQLite)                    │
│  30+ tables: users, pages, section_configs, blogs, programs,     │
│  publications, about_content, shared_data, custom_section_data,  │
│  job_listings, applications, applicant_profiles, newsletter_*,  │
│  roles, permissions, role_permissions, user_roles, audit_logs,   │
│  and more...                                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Dependencies

| Service | Depends On | Used By |
|---------|-----------|---------|
| ContentService | Page, SectionConfig, Blog, Program, Publication, AboutContent, SharedData, CustomSectionData, JobListing | PageController, DashboardController |
| ATSService | Application, JobListing, ApplicantProfile | ApplicationsController |
| DashboardMetrics | All models | DashboardController |
| PageMapService | Page, SectionConfig | PageController, Sitemap |
| AuditLogger | User, Request | AuditMutations middleware |
| AssetLibrary | Filesystem | AssetManagerController, EditorImageUploadController |
| NewsletterContentRenderer | NewsletterCampaign, NewsletterSubscription | NewsletterCampaignController |
| SectionPayloadNormalizer | SectionConfig, CustomSectionData | PageController |

---

## Permission Matrix

| Module | Actions | Roles with Access |
|--------|---------|-------------------|
| CMS (pages) | view, create, update, delete | admin, editor |
| CMS (sections) | view, create, update, delete | admin, editor |
| CMS (blogs) | view, create, update, delete, toggle_status, toggle_featured | admin, editor |
| CMS (programs) | view, create, update, delete, toggle_status, toggle_featured | admin, editor |
| CMS (publications) | view, create, update, delete, toggle_status, toggle_featured | admin, editor |
| CMS (about) | view, create, update, delete | admin, editor |
| Jobs | view, create, update, delete | admin, employer |
| Applications | view, update, delete | admin, employer |
| Users | view, create, update, delete | admin |
| Roles | view, create, update, delete | admin |
| Dashboard | view, admin, employer | admin, employer, staff |
| Newsletter | view, create, update, delete | admin, editor |
| Audit Logs | view, export, prune | admin |
| Logs | view, prune | admin |
| Backup | view, create, restore | admin |
| Settings | view, update | admin |
| Profile | view, update | all authenticated users |
