# Route Documentation

This document provides a comprehensive overview of all registered routes in the Dwipt Unnayan Sangstha Website application.

## Route File Structure

```
routes/
├── web.php                    # Main entry point - imports all route files
├── api.php                    # Public data API routes (/data/*, /api/*)
├── newsletter.php             # Newsletter subscription & admin routes
├── public.php                 # Public frontend routes (catch-all)
├── auth.php                   # Authentication routes (login, register, etc.)
├── job-seeker.php             # Authenticated job seeker routes
├── fallback.php               # Catch-all 404 fallback route
├── categories.php             # Job category management routes
├── locations.php              # Location management routes
├── notifications.php          # Notification management routes
├── apply.php                  # Job application routes
├── page-map.php               # Page map / sitemap routes
└── admin/
    ├── dashboard.php          # Admin dashboard & includes all admin routes
    ├── cms.php                # CMS management (pages, blogs, programs, etc.)
    ├── job-listings.php       # Job listing CRUD & statistics
    ├── applications.php       # Application management
    ├── users.php              # User management
    ├── roles.php              # Role & permission management
    ├── settings.php           # Profile & settings routes
    ├── backup.php             # Backup management
    ├── logs.php               # Log management
    ├── applicant-profiles.php # Admin: Applicant profile management
    └── applicant.php          # User: Applicant own profile management
```

## Route Summary by Section

### 1. Public Data API Routes (`/data/*`, `/api/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/data/jobs.json` | `ContentApiController@jobs` | - | Get jobs JSON |
| GET | `/data/blogs.json` | `ContentApiController@blogs` | - | Get blogs JSON |
| GET | `/data/pages.json` | `ContentApiController@pages` | - | Get pages JSON |
| GET | `/data/programs.json` | `ContentApiController@programs` | - | Get programs JSON |
| GET | `/data/shared_data.json` | `ContentApiController@sharedData` | - | Get shared data JSON |
| GET | `/data/about_content.json` | `ContentApiController@aboutContent` | - | Get about content JSON |
| GET | `/data/section_configs.json` | `ContentApiController@sectionConfigs` | - | Get section configs JSON |
| GET | `/data/custom_section_data.json` | `ContentApiController@customSectionData` | - | Get custom section data JSON |
| GET | `/api/blogs` | `ContentApiController@blogs` | `api.blogs` | Get blogs |
| GET | `/api/pages` | `ContentApiController@pages` | `api.pages` | Get pages |
| GET | `/api/programs` | `ContentApiController@programs` | `api.programs` | Get programs |
| GET | `/api/jobs` | `ContentApiController@jobs` | `api.jobs` | Get jobs |
| GET | `/api/shared-data` | `ContentApiController@sharedData` | `api.shared-data` | Get shared data |
| GET | `/api/about-content` | `ContentApiController@aboutContent` | `api.about-content` | Get about content |
| GET | `/api/section-configs` | `ContentApiController@sectionConfigs` | `api.section-configs` | Get section configs |
| GET | `/api/custom-section-data` | `ContentApiController@customSectionData` | `api.custom-section-data` | Get custom section data |
| GET | `/data/navigation.json` | *(closure)* | `data.navigation` | Get navigation JSON |
| GET | `/api/pages` | *(closure)* | `api.pages` | Legacy: Get pages |
| GET | `/api/programs` | *(closure)* | `api.programs` | Legacy: Get programs |

### 2. Job Listing API Routes (`/api/jobs/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/api/jobs` | `JobListingApiController@index` | `api.jobs.index` | List job listings (paginated) |
| GET | `/api/jobs/filter-options` | `JobListingApiController@filterOptions` | `api.jobs.filters` | Get filter options |
| GET | `/api/jobs/popular` | `PublicJobListingController@popular` | `api.jobs.popular` | Get popular jobs |
| GET | `/api/jobs/trending` | `PublicJobListingController@trending` | `api.jobs.trending` | Get trending jobs |
| GET | `/api/jobs/{identifier}` | `JobListingApiController@show` | `api.jobs.show` | Show single job |
| GET | `/api/jobs/{slug}/related` | `JobListingApiController@related` | `api.jobs.related` | Get related jobs |

### 3. Newsletter Routes (`/newsletter/*`, `/backend/newsletter/*`)

#### Public Newsletter Routes (no auth)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| POST | `/newsletter/subscribe` | `NewsletterController@subscribe` | `newsletter.subscribe` | Subscribe to newsletter |
| GET | `/newsletter/unsubscribe/{token}` | `NewsletterController@unsubscribe` | `newsletter.unsubscribe` | Unsubscribe |
| GET | `/newsletter/resubscribe/{token}` | `NewsletterController@resubscribe` | `newsletter.resubscribe` | Resubscribe |
| POST | `/newsletter/status` | `NewsletterController@status` | `newsletter.status` | Check subscription status |
| POST | `/newsletter/unsubscribe-email` | `NewsletterController@unsubscribeByEmail` | `newsletter.unsubscribe.email` | Unsubscribe by email |

#### Backend Newsletter Routes (auth required)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/newsletter` | `NewsletterController@adminIndex` | `backend.newsletter.index` | List subscribers |
| POST | `/backend/newsletter/export` | `NewsletterController@adminExport` | `backend.newsletter.export` | Export subscribers |
| POST | `/backend/newsletter/bulk-delete` | `NewsletterController@adminBulkDelete` | `backend.newsletter.bulk-delete` | Bulk delete subscribers |
| POST | `/backend/newsletter/bulk-unsubscribe` | `NewsletterController@adminBulkUnsubscribe` | `backend.newsletter.bulk-unsubscribe` | Bulk unsubscribe |
| POST | `/backend/newsletter/send-bulk` | `NewsletterController@sendBulkEmail` | `backend.newsletter.send-bulk` | Send bulk email |
| DELETE | `/backend/newsletter/{id}` | `NewsletterController@adminDestroy` | `backend.newsletter.destroy` | Delete subscriber |
| POST | `/backend/newsletter/{id}/unsubscribe` | `NewsletterController@adminUnsubscribe` | `backend.newsletter.unsubscribe` | Unsubscribe subscriber |
| POST | `/backend/newsletter/{id}/resubscribe` | `NewsletterController@adminResubscribe` | `backend.newsletter.resubscribe` | Resubscribe subscriber |
| POST | `/backend/newsletter/send-test` | `NewsletterController@adminSendTest` | `backend.newsletter.send-test` | Send test email |
| GET | `/backend/newsletter/campaign/{id}` | `NewsletterController@adminCampaignStatus` | `backend.newsletter.campaign.status` | Campaign status |
| GET | `/backend/newsletter/campaigns-legacy` | `NewsletterController@adminCampaigns` | `backend.newsletter.campaigns.legacy` | Legacy campaigns list |

#### Campaign Manager Routes

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/newsletter/campaigns` | `NewsletterCampaignController@index` | `backend.newsletter.campaigns.index` | List campaigns |
| GET | `/backend/newsletter/campaigns/create` | `NewsletterCampaignController@create` | `backend.newsletter.campaigns.create` | Create campaign form |
| POST | `/backend/newsletter/campaigns` | `NewsletterCampaignController@store` | `backend.newsletter.campaigns.store` | Store campaign |
| POST | `/backend/newsletter/campaigns/preview` | `NewsletterCampaignController@preview` | `backend.newsletter.campaigns.preview` | Preview campaign |
| POST | `/backend/newsletter/campaigns/test-send` | `NewsletterCampaignController@sendTest` | `backend.newsletter.campaigns.test-send` | Send test campaign |
| GET | `/backend/newsletter/campaigns/{id}` | `NewsletterCampaignController@show` | `backend.newsletter.campaigns.show` | Show campaign |
| GET | `/backend/newsletter/campaigns/{id}/edit` | `NewsletterCampaignController@edit` | `backend.newsletter.campaigns.edit` | Edit campaign form |
| PUT | `/backend/newsletter/campaigns/{id}` | `NewsletterCampaignController@update` | `backend.newsletter.campaigns.update` | Update campaign |
| DELETE | `/backend/newsletter/campaigns/{id}` | `NewsletterCampaignController@destroy` | `backend.newsletter.campaigns.destroy` | Delete campaign |
| POST | `/backend/newsletter/campaigns/{id}/duplicate` | `NewsletterCampaignController@duplicate` | `backend.newsletter.campaigns.duplicate` | Duplicate campaign |
| POST | `/backend/newsletter/campaigns/{id}/retry-failed` | `NewsletterCampaignController@retryFailed` | `backend.newsletter.campaigns.retry-failed` | Retry failed sends |
| GET | `/backend/newsletter/campaigns/{id}/export/html` | `NewsletterCampaignController@exportHtml` | `backend.newsletter.campaigns.export-html` | Export HTML |
| GET | `/backend/newsletter/campaigns/{id}/export/recipients` | `NewsletterCampaignController@exportRecipients` | `backend.newsletter.campaigns.export-recipients` | Export recipients |

### 4. Public Frontend Routes (`/`, `/{pageSlug}/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/storage/{path}` | *(closure)* | `storage.file` | Serve storage files |
| GET | `/unauthorized` | *(closure)* | `unauthorized.access` | 403 page |
| GET | `/` | `PageController@show` | `home` | Home page |
| GET | `/sitemap` | `PageController@sitemap` | `sitemap` | Sitemap page |
| GET | `/playground` | *(closure)* | `playground` | Playground page |
| GET | `/{pageSlug}/{detailSlug}` | `PageController@show` | - | Dynamic detail pages |
| GET | `/{pageSlug}` | `PageController@show` | - | Dynamic listing pages (catch-all) |

### 5. Authentication Routes (`/login/*`, `/register`, `/auth/*`, `/forgot-password`, `/reset-password`)

#### Guest Routes

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/login/staff` | `AdminLoginController@create` | `staff.login` | Admin login form |
| POST | `/login/staff` | `AdminLoginController@store` | - | Admin login submit |
| GET | `/login/seeker` | `JobSeekerLoginController@create` | `seeker.login` | Job seeker login form |
| POST | `/login/seeker` | `JobSeekerLoginController@store` | - | Job seeker login submit |
| GET | `/login` | *(closure)* | `login` | Redirect to seeker login |
| GET | `/register` | `JobSeekerRegisterController@create` | `register` | Registration form |
| POST | `/register` | `JobSeekerRegisterController@store` | - | Registration submit |
| GET | `/auth/google/redirect` | `GoogleAuthController@redirect` | `auth.google.redirect` | Google OAuth redirect |
| GET | `/auth/google/callback` | `GoogleAuthController@callback` | `auth.google.callback` | Google OAuth callback |
| GET | `/forgot-password` | `PasswordResetLinkController@create` | `password.request` | Password reset form |
| POST | `/forgot-password` | `PasswordResetLinkController@store` | `password.email` | Send reset link |
| GET | `/reset-password/{token}` | `NewPasswordController@create` | `password.reset` | New password form |
| POST | `/reset-password` | `NewPasswordController@store` | `password.store` | Store new password |

#### Authenticated Routes

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/verify-email` | `EmailVerificationPromptController` | `verification.notice` | Email verification prompt |
| GET | `/verify-email/{id}/{hash}` | `VerifyEmailController` | `verification.verify` | Verify email (signed, throttled) |
| POST | `/email/verification-notification` | `EmailVerificationNotificationController@store` | `verification.send` | Resend verification email |
| GET | `/email/verified` | `EmailVerifiedController@index` | `verification.verified` | Verification success page |
| GET | `/confirm-password` | `ConfirmablePasswordController@show` | `password.confirm` | Confirm password form |
| POST | `/confirm-password` | `ConfirmablePasswordController@store` | - | Confirm password submit |
| POST | `/logout` | `AuthenticatedSessionController@destroy` | `logout` | Logout |

### 6. Job Seeker Routes (`/complete-profile`, `/profile/*`, `/seeker/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/complete-profile` | `ProfileCompletionController@show` | `profile.complete` | Profile completion page |
| GET | `/profile/photo/{path}` | `ApplicantProfileController@photo` | `profile.photo` | Serve profile photo |
| POST | `/profile/photo` | `ProfileCompletionController@uploadPhoto` | `profile.photo.upload` | Upload profile photo |
| POST | `/profile/complete` | `ProfileCompletionController@store` | `profile.complete.store` | Store profile completion |
| POST | `/profile/cv` | `ProfileCompletionController@uploadCv` | `profile.cv.upload` | Upload CV (throttled) |
| DELETE | `/profile/cv/{cv}` | `ProfileCompletionController@destroyCv` | `profile.cv.destroy` | Delete CV |
| PATCH | `/profile/cv/{cv}/primary` | `ProfileCompletionController@setPrimaryCv` | `profile.cv.primary` | Set primary CV |
| GET | `/api/user/verification-status` | *(closure)* | `api.verification.status` | Check email verification status |
| GET | `/backend/seeker/jobs` | `PublicJobListingController@index` | `public.jobs.index` | Job seeker job list |
| GET | `/backend/seeker/jobs/{slug}` | `PublicJobListingController@show` | `public.jobs.show` | Job seeker job detail |

### 7. Admin Dashboard Route

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/dashboard` | `DashboardController@index` | `backend.dashboard` | Admin dashboard |

### 8. Backend CMS Routes (`/backend/cms/*`)

#### Pages Management

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/cms/pages` | `CmsPageController@index` | `backend.cms.pages.index` | List pages |
| POST | `/backend/cms/pages/store` | `CmsPageController@store` | `backend.cms.pages.store` | Store page |
| PUT | `/backend/cms/pages/update/{id}` | `CmsPageController@update` | `backend.cms.pages.update` | Update page |
| POST | `/backend/cms/pages/toggle-status/{id}` | `CmsPageController@toggleStatus` | `backend.cms.pages.toggle-status` | Toggle page status |
| DELETE | `/backend/cms/pages/destroy/{id}` | `CmsPageController@destroy` | `backend.cms.pages.destroy` | Delete page |
| POST | `/backend/cms/pages/restore/{id}` | `CmsPageController@restore` | `backend.cms.pages.restore` | Restore page |
| DELETE | `/backend/cms/pages/force-delete/{id}` | `CmsPageController@forceDelete` | `backend.cms.pages.force-delete` | Force delete page |

#### Sections Management

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/cms/sections/page/{pageId}` | `CmsSectionController@index` | `backend.cms.sections.page.sections` | List sections for page |
| POST | `/backend/cms/sections` | `CmsSectionController@store` | `backend.cms.sections.store` | Store section |
| POST | `/backend/cms/sections/{pageId}/update-order` | `CmsSectionController@updateOrder` | `backend.cms.sections.update-order` | Update section order |
| PUT | `/backend/cms/sections/update/{section}` | `CmsSectionController@update` | `backend.cms.sections.update` | Update section |
| DELETE | `/backend/cms/sections/{section}` | `CmsSectionController@destroy` | `backend.cms.sections.destroy` | Delete section |
| POST | `/backend/cms/sections/{section}/restore` | `CmsSectionController@restore` | `backend.cms.sections.restore` | Restore section |
| DELETE | `/backend/cms/sections/{section}/force-delete` | `CmsSectionController@forceDelete` | `backend.cms.sections.force-delete` | Force delete section |
| GET | `/backend/cms/sections/about-content-options` | `CmsSectionController@getAboutContentOptions` | `backend.cms.sections.about-content-options` | Get about content options |

#### Shared Data Management

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/cms/shared` | `SharedDataController@index` | `backend.cms.shared.index` | List shared data |
| PUT | `/backend/cms/shared/update/{id}` | `SharedDataController@update` | `backend.cms.shared.update` | Update shared data |

#### Blogs Management

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/cms/blogs` | `CmsBlogController@index` | `backend.cms.blogs.index` | List blogs |
| POST | `/backend/cms/blogs/store` | `CmsBlogController@store` | `backend.cms.blogs.store` | Store blog |
| PUT | `/backend/cms/blogs/update/{id}` | `CmsBlogController@update` | `backend.cms.blogs.update` | Update blog |
| POST | `/backend/cms/blogs/toggle-status/{id}` | `CmsBlogController@toggleStatus` | `backend.cms.blogs.toggle-status` | Toggle blog status |
| POST | `/backend/cms/blogs/toggle-featured/{id}` | `CmsBlogController@toggleFeatured` | `backend.cms.blogs.toggle-featured` | Toggle featured |
| DELETE | `/backend/cms/blogs/destroy/{id}` | `CmsBlogController@destroy` | `backend.cms.blogs.destroy` | Delete blog |
| POST | `/backend/cms/blogs/restore/{id}` | `CmsBlogController@restore` | `backend.cms.blogs.restore` | Restore blog |
| DELETE | `/backend/cms/blogs/force-delete/{id}` | `CmsBlogController@forceDelete` | `backend.cms.blogs.force-delete` | Force delete blog |

#### Programs Management

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/cms/programs` | `CmsProgramController@index` | `backend.cms.programs.index` | List programs |
| POST | `/backend/cms/programs/store` | `CmsProgramController@store` | `backend.cms.programs.store` | Store program |
| PUT | `/backend/cms/programs/update/{id}` | `CmsProgramController@update` | `backend.cms.programs.update` | Update program |
| POST | `/backend/cms/programs/toggle-status/{id}` | `CmsProgramController@toggleStatus` | `backend.cms.programs.toggle-status` | Toggle program status |
| POST | `/backend/cms/programs/toggle-featured/{id}` | `CmsProgramController@toggleFeatured` | `backend.cms.programs.toggle-featured` | Toggle featured |
| POST | `/backend/cms/programs/update-order` | `CmsProgramController@updateOrder` | `backend.cms.programs.update-order` | Update order |
| DELETE | `/backend/cms/programs/destroy/{id}` | `CmsProgramController@destroy` | `backend.cms.programs.destroy` | Delete program |
| POST | `/backend/cms/programs/restore/{id}` | `CmsProgramController@restore` | `backend.cms.programs.restore` | Restore program |
| DELETE | `/backend/cms/programs/force-delete/{id}` | `CmsProgramController@forceDelete` | `backend.cms.programs.force-delete` | Force delete program |

#### About Content Management

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/cms/about` | `CmsAboutContentController@index` | `backend.cms.about.index` | List about content |
| POST | `/backend/cms/about/store` | `CmsAboutContentController@store` | `backend.cms.about.store` | Store about content |
| PUT | `/backend/cms/about/update/{id}` | `CmsAboutContentController@update` | `backend.cms.about.update` | Update about content |
| POST | `/backend/cms/about/toggle-status/{id}` | `CmsAboutContentController@toggleStatus` | `backend.cms.about.toggle-status` | Toggle status |
| POST | `/backend/cms/about/toggle-featured/{id}` | `CmsAboutContentController@toggleFeatured` | `backend.cms.about.toggle-featured` | Toggle featured |
| POST | `/backend/cms/about/update-order` | `CmsAboutContentController@updateOrder` | `backend.cms.about.update-order` | Update order |
| DELETE | `/backend/cms/about/destroy/{id}` | `CmsAboutContentController@destroy` | `backend.cms.about.destroy` | Delete about content |
| POST | `/backend/cms/about/restore/{id}` | `CmsAboutContentController@restore` | `backend.cms.about.restore` | Restore about content |
| DELETE | `/backend/cms/about/force-delete/{id}` | `CmsAboutContentController@forceDelete` | `backend.cms.about.force-delete` | Force delete |

#### Publications Management

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/cms/publications` | `CmsPublicationController@index` | `backend.cms.publications.index` | List publications |
| POST | `/backend/cms/publications/store` | `CmsPublicationController@store` | `backend.cms.publications.store` | Store publication |
| PUT | `/backend/cms/publications/update/{id}` | `CmsPublicationController@update` | `backend.cms.publications.update` | Update publication |
| POST | `/backend/cms/publications/toggle-status/{id}` | `CmsPublicationController@toggleStatus` | `backend.cms.publications.toggle-status` | Toggle status |
| POST | `/backend/cms/publications/toggle-featured/{id}` | `CmsPublicationController@toggleFeatured` | `backend.cms.publications.toggle-featured` | Toggle featured |
| DELETE | `/backend/cms/publications/destroy/{id}` | `CmsPublicationController@destroy` | `backend.cms.publications.destroy` | Delete publication |
| POST | `/backend/cms/publications/restore/{id}` | `CmsPublicationController@restore` | `backend.cms.publications.restore` | Restore publication |
| DELETE | `/backend/cms/publications/force-delete/{id}` | `CmsPublicationController@forceDelete` | `backend.cms.publications.force-delete` | Force delete |

#### Editor Image Upload

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| POST | `/backend/cms/upload-editor-image` | `EditorImageUploadController@upload` | `backend.cms.upload-editor-image` | Upload editor image |
| DELETE | `/backend/cms/editor-image` | `EditorImageUploadController@deleteImages` | `backend.cms.editor-image.delete` | Delete editor image |

### 9. Job Listing Management Routes (`/backend/listing/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/listing` | `JobListingController@adminIndex` | `backend.listing.index` | List job listings |
| GET | `/backend/listing/create` | `JobListingController@adminCreate` | `backend.listing.create` | Create form |
| POST | `/backend/listing` | `JobListingController@adminStore` | `backend.listing.store` | Store job listing |
| GET | `/backend/listing/{jobListing}` | `JobListingController@adminShow` | `backend.listing.show` | Show job listing |
| GET | `/backend/listing/{jobListing}/edit` | `JobListingController@adminEdit` | `backend.listing.edit` | Edit form |
| PUT | `/backend/listing/{jobListing}` | `JobListingController@adminUpdate` | `backend.listing.update` | Update job listing |
| DELETE | `/backend/listing/{jobListing}` | `JobListingController@adminDestroy` | `backend.listing.destroy` | Delete job listing |
| PATCH | `/backend/listing/{jobListing}/toggle-active` | `JobListingController@toggleActive` | `backend.listing.toggle-active` | Toggle active status |
| PATCH | `/backend/listing/{jobListing}/restore` | `JobListingController@restore` | `backend.listing.restore` | Restore job listing |
| DELETE | `/backend/listing/{jobListing}/force-delete` | `JobListingController@forceDelete` | `backend.listing.force-delete` | Force delete |
| GET | `/backend/listing/{jobListing}/applications` | `JobListingController@applications` | `backend.listing.applications` | List applications |
| POST | `/backend/listing/bulk-activate` | `JobListingController@bulkActivate` | `backend.listing.bulk-activate` | Bulk activate |
| POST | `/backend/listing/bulk-deactivate` | `JobListingController@bulkDeactivate` | `backend.listing.bulk-deactivate` | Bulk deactivate |
| DELETE | `/backend/listing/bulk-delete` | `JobListingController@bulkDelete` | `backend.listing.bulk-delete` | Bulk delete |

### 10. Statistics Routes (`/backend/statistics`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/statistics` | `JobListingController@statistics` | `backend.statistics.index` | Show statistics |

### 11. Application Management Routes (`/backend/applications/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/applications` | `ApplicationsController@index` | `backend.applications.index` | List applications |
| GET | `/backend/applications/job/{jobId}` | `ApplicationsController@jobApplications` | `backend.applications.job` | Applications by job |
| GET | `/backend/applications/{id}` | `ApplicationsController@show` | `backend.applications.show` | Show application |
| PUT | `/backend/applications/{id}/status` | `ApplicationsController@updateStatus` | `backend.applications.update-status` | Update status |
| POST | `/backend/applications/bulk-status` | `ApplicationsController@bulkUpdateStatus` | `backend.applications.bulk-status` | Bulk status update |
| DELETE | `/backend/applications/{id}` | `ApplicationsController@destroy` | `backend.applications.destroy` | Delete application |
| POST | `/backend/applications/bulk-delete` | `ApplicationsController@bulkDelete` | `backend.applications.bulk-delete` | Bulk delete |
| GET | `/backend/applications/{id}/download-resume` | `ApplicationsController@downloadResume` | `backend.applications.download_resume` | Download resume (fixed name) |
| GET | `/backend/applications/{id}/download` | `ApplicationsController@downloadResume` | `backend.applications.download` | Download resume (legacy) |
| POST | `/backend/applications/bulk-download` | `ApplicationsController@bulkDownloadResumes` | `backend.applications.bulk-download` | Bulk download resumes |
| POST | `/backend/applications/{id}/send-email` | `ApplicationsController@sendEmail` | `backend.applications.send-email` | Send email |
| POST | `/backend/applications/bulk-send-email` | `ApplicationsController@sendBulkEmail` | `backend.applications.bulk-send-email` | Bulk send email |
| POST | `/backend/applications/{id}/recalculate-ats` | `ApplicationsController@recalculateAts` | `backend.applications.recalculate-ats` | Recalculate ATS score |
| POST | `/backend/applications/export/{jobId}` | `ApplicationsController@exportApplications` | `backend.applications.export` | Export applications |
| POST | `/backend/applications/export-single/{id}` | `ApplicationsController@exportSingleApplication` | `backend.applications.export-single` | Export single application |

### 12. User Management Routes (`/backend/users/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/users` | `UserController@index` | `backend.users.index` | List users |
| POST | `/backend/users` | `UserController@store` | `backend.users.store` | Store user |
| PUT | `/backend/users/{id}` | `UserController@update` | `backend.users.update` | Update user |
| DELETE | `/backend/users/{id}` | `UserController@destroy` | `backend.users.destroy` | Delete user |
| PATCH | `/backend/users/{id}/restore` | `UserController@restore` | `backend.users.restore` | Restore user |
| POST | `/backend/users/{id}/verify` | `UserController@verify` | `backend.users.verify` | Verify user |
| DELETE | `/backend/users/{id}/force-delete` | `UserController@forceDelete` | `backend.users.force-delete` | Force delete |
| POST | `/backend/users/bulk/delete` | `UserController@bulkDelete` | `backend.users.bulk-delete` | Bulk delete |
| POST | `/backend/users/bulk/restore` | `UserController@bulkRestore` | `backend.users.bulk-restore` | Bulk restore |

### 13. Role Management Routes (`/backend/roles/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/roles` | `RoleController@index` | `backend.roles.index` | List roles |
| GET | `/backend/roles/create` | `RoleController@create` | `backend.roles.create` | Create role form |
| POST | `/backend/roles` | `RoleController@store` | `backend.roles.store` | Store role |
| GET | `/backend/roles/trashed` | `RoleController@trashed` | `backend.roles.trashed` | Trashed roles |
| GET | `/backend/roles/export` | `RoleController@export` | `backend.roles.export` | Export roles |
| GET | `/backend/roles/{id}` | `RoleController@show` | `backend.roles.show` | Show role |
| GET | `/backend/roles/{id}/edit` | `RoleController@edit` | `backend.roles.edit` | Edit role form |
| PUT | `/backend/roles/{id}` | `RoleController@update` | `backend.roles.update` | Update role |
| DELETE | `/backend/roles/{id}` | `RoleController@destroy` | `backend.roles.destroy` | Delete role |
| POST | `/backend/roles/{id}/restore` | `RoleController@restore` | `backend.roles.restore` | Restore role |
| DELETE | `/backend/roles/{id}/force` | `RoleController@forceDelete` | `backend.roles.force-delete` | Force delete |
| POST | `/backend/roles/bulk/delete` | `RoleController@bulkDelete` | `backend.roles.bulk-delete` | Bulk delete |
| POST | `/backend/roles/bulk/restore` | `RoleController@bulkRestore` | `backend.roles.bulk-restore` | Bulk restore |
| POST | `/backend/roles/{id}/toggle-status` | `RoleController@toggleStatus` | `backend.roles.toggle-status` | Toggle status |
| POST | `/backend/roles/{id}/clone` | `RoleController@clone` | `backend.roles.clone` | Clone role |

### 14. Profile & Settings Routes (`/backend/admin-profile/*`, `/backend/employer/*`)

#### Admin Profile Routes

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/admin-profile/edit` | `AdminProfileController@edit` | `backend.admin-profile.edit` | Edit admin profile form |
| PATCH | `/backend/admin-profile` | `AdminProfileController@update` | `backend.admin-profile.update` | Update admin profile |
| PUT | `/backend/admin-profile/password` | `AdminProfileController@updatePassword` | `backend.admin-profile.password.update` | Update password |
| POST | `/backend/admin-profile/icon/update` | `AdminProfileController@updateIcon` | `backend.admin-profile.icon.update` | Update profile icon |
| DELETE | `/backend/admin-profile/icon/reset` | `AdminProfileController@resetIcon` | `backend.admin-profile.icon.reset` | Reset profile icon |

#### Employer Profile Routes

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/employer/profile/edit` | `EmployerProfileController@edit` | `backend.employer.profile.edit` | Edit employer profile form |
| PATCH | `/backend/employer/profile` | `EmployerProfileController@update` | `backend.employer.profile.update` | Update employer profile |
| PUT | `/backend/employer/profile/password` | `EmployerProfileController@updatePassword` | `backend.employer.profile.password.update` | Update password |

### 15. Backup Routes (`/backend/backup/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/backup` | `BackupController@index` | `backend.backup.index` | List backups |
| POST | `/backend/backup/create-manual` | `BackupController@createManual` | `backend.backup.create-manual` | Create manual backup |
| POST | `/backend/backup/create-auto` | `BackupController@createAuto` | `backend.backup.create-auto` | Create automatic backup |
| POST | `/backend/backup/restore` | `BackupController@restore` | `backend.backup.restore` | Restore backup |
| DELETE | `/backend/backup/delete` | `BackupController@delete` | `backend.backup.delete` | Delete backup |
| GET | `/backend/backup/download` | `BackupController@download` | `backend.backup.download` | Download backup |
| GET | `/backend/backup/status` | `BackupController@status` | `backend.backup.status` | Backup status |

### 16. Log Management Routes (`/backend/logs/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/logs` | `LogController@index` | `backend.logs.index` | List logs |
| GET | `/backend/logs/export` | `LogController@export` | `backend.logs.export` | Export logs |
| POST | `/backend/logs/clear` | `LogController@clear` | `backend.logs.clear` | Clear logs |
| GET | `/backend/logs/stats` | `LogController@stats` | `backend.logs.stats` | Log statistics |

### 17. Applicant Profile Routes

#### Admin Management (`/backend/applicant-profiles/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/applicant-profiles` | `ApplicantProfileController@index` | `backend.applicant-profile.index` | List applicant profiles |
| GET | `/backend/applicant-profiles/{id}` | `ApplicantProfileController@show` | `backend.applicant-profile.show` | Show profile |
| POST | `/backend/applicant-profiles/bulk/delete` | `ApplicantProfileController@bulkDelete` | `backend.applicant-profile.bulk-delete` | Bulk delete |
| POST | `/backend/applicant-profiles/bulk/restore` | `ApplicantProfileController@bulkRestore` | `backend.applicant-profile.bulk-restore` | Bulk restore |
| DELETE | `/backend/applicant-profiles/{id}` | `ApplicantProfileController@destroy` | `backend.applicant-profile.destroy` | Delete profile |
| POST | `/backend/applicant-profiles/{id}/restore` | `ApplicantProfileController@restore` | `backend.applicant-profile.restore` | Restore profile |
| DELETE | `/backend/applicant-profiles/{id}/force` | `ApplicantProfileController@forceDelete` | `backend.applicant-profile.force-delete` | Force delete |
| POST | `/backend/applicant-profiles/export` | `ApplicantProfileController@export` | `backend.applicant-profile.export` | Export profiles |
| POST | `/backend/applicant-profiles/cv/upload` | `ApplicantProfileController@uploadCv` | `backend.applicant-profile.cv.upload` | Upload CV |
| DELETE | `/backend/applicant-profiles/cv/{cv}` | `ApplicantProfileController@destroyCv` | `backend.applicant-profile.cv.destroy` | Delete CV |
| PATCH | `/backend/applicant-profiles/cv/{cv}/primary` | `ApplicantProfileController@setPrimaryCv` | `backend.applicant-profile.cv.primary` | Set primary CV |

#### User Own Profile (`/backend/applicant/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/applicant/profile/{id?}` | `ApplicantProfileController@show` | `backend.applicant.profile.show` | Show own profile |
| DELETE | `/backend/applicant/profile/{applicantProfile}` | `ApplicantProfileController@destroy` | `backend.applicant.profile.destroy` | Delete own profile |
| GET | `/backend/applicant/profile/{applicantProfile}/download-cv` | `ApplicantProfileController@downloadCV` | `backend.applicant.profile.download-cv` | Download CV |
| POST | `/backend/applicant/profile/{id}/restore` | `ApplicantProfileController@restore` | `backend.applicant.profile.restore` | Restore profile |
| PATCH | `/backend/applicant/profile/{applicantProfile}/basic-info` | `ApplicantProfileController@updateBasicInfo` | `backend.applicant.profile.update-basic-info` | Update basic info |
| PATCH | `/backend/applicant/profile/{applicantProfile}/professional-info` | `ApplicantProfileController@updateProfessionalInfo` | `backend.applicant.profile.update-professional-info` | Update professional info |
| PUT | `/backend/applicant/profile/{applicantProfile}/work-experiences` | `ApplicantProfileController@updateWorkExperiences` | `backend.applicant.profile.update-work-experiences` | Update work experiences |
| PUT | `/backend/applicant/profile/{applicantProfile}/educations` | `ApplicantProfileController@updateEducations` | `backend.applicant.profile.update-educations` | Update educations |
| PUT | `/backend/applicant/profile/{applicantProfile}/achievements` | `ApplicantProfileController@updateAchievements` | `backend.applicant.profile.update-achievements` | Update achievements |
| POST | `/backend/applicant/profile/change-password` | `ApplicantProfileController@changePassword` | `backend.applicant.profile.change-password` | Change password |
| GET | `/backend/applicant/profile/{applicantProfile}/data` | `ApplicantProfileController@getProfileData` | `backend.applicant.profile.get-data` | Get profile data (AJAX) |

### 18. Job Application Routes (`/apply/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/apply` | `ApplyController@index` | `apply.index` | List applications |
| GET | `/apply/create/{slug}` | `ApplyController@create` | `apply.create` | Create application form |
| POST | `/apply/store/{slug}` | `ApplyController@store` | `apply.store` | Store application |
| GET | `/apply/{id}` | `ApplyController@show` | `apply.show` | Show application |
| GET | `/apply/{id}/edit` | `ApplyController@edit` | `apply.edit` | Edit application form |
| PUT | `/apply/{id}` | `ApplyController@update` | `apply.update` | Update application |
| DELETE | `/apply/{id}` | `ApplyController@destroy` | `apply.destroy` | Delete application |
| POST | `/apply/{id}/restore` | `ApplyController@restore` | `apply.restore` | Restore application |
| DELETE | `/apply/{id}/force-delete` | `ApplyController@forceDelete` | `apply.force-delete` | Force delete |
| GET | `/apply/trashed` | `ApplyController@trashed` | `apply.trashed` | Trashed applications |
| POST | `/apply/{id}/recalculate-ats` | `ApplyController@recalculateAts` | `apply.recalculate-ats` | Recalculate ATS |
| GET | `/apply/{id}/ats-status` | `ApplyController@getAtsStatus` | `apply.ats-status` | Get ATS status |

### 19. Location Routes (`/locations/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/locations` | `LocationController@index` | `locations.index` | List locations |
| POST | `/locations` | `LocationController@store` | `locations.store` | Store location |
| PUT | `/locations/{location}` | `LocationController@update` | `locations.update` | Update location |
| PATCH | `/locations/{location}/toggle-active` | `LocationController@toggleActive` | `locations.toggle-active` | Toggle active |
| DELETE | `/locations/{location}` | `LocationController@destroy` | `locations.destroy` | Delete location |
| POST | `/locations/{id}/restore` | `LocationController@restore` | `locations.restore` | Restore location |
| DELETE | `/locations/{id}/force-delete` | `LocationController@forceDelete` | `locations.force-delete` | Force delete |
| POST | `/locations/bulk-delete` | `LocationController@bulkDelete` | `locations.bulk-delete` | Bulk delete |
| POST | `/locations/bulk-restore` | `LocationController@bulkRestore` | `locations.bulk-restore` | Bulk restore |
| POST | `/locations/bulk-activate` | `LocationController@bulkActivate` | `locations.bulk-activate` | Bulk activate |
| POST | `/locations/bulk-deactivate` | `LocationController@bulkDeactivate` | `locations.bulk-deactivate` | Bulk deactivate |
| GET | `/locations/active` | `LocationController@getActiveLocations` | `locations.active` | Active locations |

### 20. Category Routes (`/categories/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/categories` | `JobCategoryController@index` | `categories.index` | List categories |
| POST | `/categories` | `JobCategoryController@store` | `categories.store` | Store category |
| PUT | `/categories/{category}` | `JobCategoryController@update` | `categories.update` | Update category |
| PATCH | `/categories/{category}/toggle-active` | `JobCategoryController@toggleActive` | `categories.toggle-active` | Toggle active |
| DELETE | `/categories/{category}` | `JobCategoryController@destroy` | `categories.destroy` | Delete category |
| POST | `/categories/{id}/restore` | `JobCategoryController@restore` | `categories.restore` | Restore category |
| DELETE | `/categories/{id}/force-delete` | `JobCategoryController@forceDelete` | `categories.force-delete` | Force delete |
| POST | `/categories/bulk-delete` | `JobCategoryController@bulkDelete` | `categories.bulk-delete` | Bulk delete |
| POST | `/categories/bulk-restore` | `JobCategoryController@bulkRestore` | `categories.bulk-restore` | Bulk restore |
| POST | `/categories/bulk-activate` | `JobCategoryController@bulkActivate` | `categories.bulk-activate` | Bulk activate |
| POST | `/categories/bulk-deactivate` | `JobCategoryController@bulkDeactivate` | `categories.bulk-deactivate` | Bulk deactivate |
| POST | `/categories/bulk-force-delete` | `JobCategoryController@bulkForceDelete` | `categories.bulk-force-delete` | Bulk force delete |
| GET | `/categories/active` | `JobCategoryController@getActiveCategories` | `categories.active` | Active categories |

### 21. Notification Routes (`/notifications/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/notifications` | `NotificationController@index` | `notifications.index` | List notifications |
| POST | `/notifications/{id}/mark-as-read` | `NotificationController@markAsRead` | `notifications.mark-read` | Mark as read |
| POST | `/notifications/mark-all-read` | `NotificationController@markAllAsRead` | `notifications.mark-all-read` | Mark all as read |

### 22. Page Map Routes (`/backend/page-map/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| GET | `/backend/page-map` | `PageMapController@index` | `backend.page-map.index` | Page map index |
| GET | `/backend/page-map/export` | `PageMapController@exportJson` | `backend.page-map.export` | Export JSON |
| GET | `/backend/page-map/admin-menu` | `PageMapController@adminMenu` | `backend.page-map.admin-menu` | Admin menu |
| GET | `/backend/page-map/navigation-tree` | `PageMapController@navigationTree` | `backend.page-map.navigation-tree` | Navigation tree |
| GET | `/backend/page-map/sitemap-urls` | `PageMapController@sitemapUrls` | `backend.page-map.sitemap-urls` | Sitemap URLs |
| POST | `/backend/page-map/clear-cache` | `PageMapController@clearCache` | `backend.page-map.clear-cache` | Clear cache |

### 23. Cache Routes (`/backend/cache/*`)

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| POST | `/backend/cache/clear` | `CacheController@clearAll` | `backend.cache.clear` | Clear all cache |
| POST | `/backend/cache/clear/{pageSlug}` | `CacheController@clearPage` | `backend.cache.clear-page` | Clear page cache |
| GET | `/backend/cache/status` | `CacheController@status` | `backend.cache.status` | Cache status |

### 24. Fallback Route

| Method | URI | Controller | Name | Description |
|--------|-----|-----------|------|-------------|
| ALL | `*` | *(closure)* | - | Catch-all 404 fallback page |

---

## Middleware Groups

### Guest Routes
- Applied to all authentication routes to prevent logged-in users from accessing login/register pages

### `auth` Middleware
- Applied to authenticated routes requiring a logged-in user
- Includes email verification check in some routes

### `verified` Middleware
- Applied alongside `auth` to require email verification
- Used in: dashboard, backend routes, profile completion, authentication routes

### `profile.complete` Middleware
- Applied to admin/backend routes to ensure user profile is completed
- Used in: `/dashboard`, all backend routes, page-map routes

## Route Naming Conventions

| Prefix | Description |
|--------|-------------|
| `backend.` | Admin/backend routes (`/dashboard`, `/backend/*`) |
| `backend.cms.` | CMS management routes |
| `backend.cms.pages.` | Page management |
| `backend.cms.sections.` | Section management |
| `backend.cms.blogs.` | Blog management |
| `backend.cms.programs.` | Program management |
| `backend.cms.about.` | About content management |
| `backend.cms.publications.` | Publication management |
| `backend.listing.` | Job listing management |
| `backend.statistics.` | Statistics routes |
| `backend.applications.` | Application management |
| `backend.users.` | User management |
| `backend.roles.` | Role management |
| `backend.admin-profile.` | Admin profile settings |
| `backend.employer.profile.` | Employer profile settings |
| `backend.backup.` | Backup management |
| `backend.logs.` | Log management |
| `backend.applicant-profile.` | Admin: Applicant profiles |
| `backend.applicant.profile.` | User: Own applicant profile |
| `backend.page-map.` | Page map / sitemap |
| `backend.cache.` | Cache management |
| `newsletter.` | Newsletter public routes |
| `backend.newsletter.` | Newsletter admin routes |
| `backend.newsletter.campaigns.` | Campaign management |
| `api.` | API routes |
| `data.` | Data routes |
| `categories.` | Category management |
| `locations.` | Location management |
| `notifications.` | Notification management |
| `apply.` | Job application routes |
| `storage.file` | Storage file serving |
| `unauthorized.access` | Unauthorized access page |
| `home` | Home page |
| `sitemap` | Sitemap page |
| `playground` | Playground page |
| `login` | Login (redirects to seeker) |
| `staff.login` | Staff/admin login |
| `seeker.login` | Job seeker login |
| `register` | Registration |
| `profile.` | Profile-related routes |

## Controller Mapping

| Route File | Controllers |
|-----------|-------------|
| `api.php` | `ContentApiController`, `JobListingApiController`, `PublicJobListingController` |
| `newsletter.php` | `NewsletterController`, `NewsletterCampaignController` |
| `public.php` | `PageController` (Frontend), closures for storage/unauthorized/playground |
| `auth.php` | `AdminLoginController`, `JobSeekerLoginController`, `JobSeekerRegisterController`, `GoogleAuthController`, `PasswordResetLinkController`, `NewPasswordController`, `VerifyEmailController`, `EmailVerifiedController`, `ConfirmablePasswordController`, `AuthenticatedSessionController`, `EmailVerificationPromptController`, `EmailVerificationNotificationController` |
| `job-seeker.php` | `ApplicantProfileController`, `PublicJobListingController`, `ProfileCompletionController`, closures |
| `fallback.php` | Uses `SharedDataTrait` (not a controller) |
| `categories.php` | `JobCategoryController` |
| `locations.php` | `LocationController` |
| `notifications.php` | `NotificationController` |
| `apply.php` | `ApplyController` |
| `admin/dashboard.php` | `DashboardController`, `CacheController`, plus all admin route files |
| `admin/cms.php` | `CmsPageController`, `CmsBlogController`, `CmsProgramController`, `CmsSectionController`, `CmsPublicationController`, `CmsAboutContentController`, `SharedDataController`, `EditorImageUploadController` |
| `admin/job-listings.php` | `JobListingController` (JobListing namespace) |
| `admin/applications.php` | `ApplicationsController` |
| `admin/users.php` | `UserController` |
| `admin/roles.php` | `RoleController` |
| `admin/settings.php` | `AdminProfileController`, `EmployerProfileController` |
| `admin/backup.php` | `BackupController` |
| `admin/logs.php` | `LogController` |
| `admin/applicant-profiles.php` | `ApplicantProfileController` |
| `admin/applicant.php` | `ApplicantProfileController` |
| `page-map.php` | `PageMapController` |

## Excluded Files

The following files in `app/Http/Controllers/` are **not routable controllers** and are excluded from route registration:

- `Controller.php` - Base controller class (abstract, extended by other controllers)
- `SharedDataTrait.php` - Trait providing shared data for Inertia views (not a controller)

## Notes

- All backend/admin routes require `auth`, `verified`, and `profile.complete` middleware
- The `/dashboard` route also uses the same middleware group
- The `page-map.php` route file is loaded after the fallback route and requires auth middleware
- Route ordering is important in the newsletter.php file - campaign routes are registered before subscriber `{id}` routes to prevent route parameter conflicts
- The `apply.php` routes are loaded under `/backend/apply/*` prefix via the dashboard.php include
