# UI/UX Visual Testing Guide

Manual testing guide for exploring the DUS (Dwip Unnayan Sangstha) website. No coding required — just open pages in a browser and verify what you see.

---

## Setup

1. **Start the dev server** (run in terminal):
   ```bash
   php artisan serve
   ```
2. **Open** `http://localhost:8000` in your browser
3. **Login as admin**: Navigate to `/login`, use credentials from your `.env` file (or `admin@dus.org` / `password` if seeded)

---

## Public Pages (No Login Required)

### Home Page — `/`
**What to test:**
- [ ] Hero banner displays (title + call-to-action button)
- [ ] Latest job listings section shows 4+ jobs with thumbnail, title, company, location
- [ ] "View All Jobs" button links to `/jobs`
- [ ] Programs section shows program cards with image, title, excerpt
- [ ] Publications section shows publication cards with PDF download link
- [ ] Blog section shows blog cards with featured image, title, author, date
- [ ] Footer contains contact info, quick links, social media icons
- [ ] Navbar is sticky and collapses on mobile
- [ ] All links navigate to correct pages
- [ ] Mobile: menu toggles open/close

### Jobs Listing — `/jobs`
**What to test:**
- [ ] Search bar filters jobs by keyword
- [ ] Category filter sidebar works (clicking categories updates results)
- [ ] Location filter works
- [ ] Job type filter (full-time, part-time, etc.)
- [ ] "Apply Now" button visible on each job card
- [ ] Pagination works (next/prev page links)
- [ ] Sorting dropdown (newest, oldest, popular)
- [ ] Empty state message when no jobs match filters

### Single Job — `/jobs/{jobSlug}`
**What to test:**
- [ ] Job title and company name displayed prominently
- [ ] Job details: location, job type, experience level, salary range
- [ ] "Apply Now" button visible (or login prompt if not logged in)
- [ ] Job description section renders properly (images, lists, formatting)
- [ ] Requirements section lists all requirements
- [ ] "Share" buttons for social media (Facebook, LinkedIn, Twitter)
- [ ] Back button returns to jobs listing

### Blog Listing — `/blog`
**What to test:**
- [ ] Blog cards display featured image, title, excerpt, author, date
- [ ] Category filter sidebar
- [ ] Search bar
- [ ] Pagination
- [ ] Featured blog posts highlighted

### Single Blog — `/blog/{slug}`
**What to test:**
- [ ] Blog title and hero image
- [ ] Author, date, read time
- [ ] Content renders with proper formatting (headings, paragraphs, images)
- [ ] "Share" buttons
- [ ] Related blog posts section (if implemented)
- [ ] "Back to Blog" link

### Programs — `/programs`
**What to test:**
- [ ] Program cards show image, title, excerpt
- [ ] Category filter
- [ ] "Learn More" links go to program detail pages

### Single Program — `/programs/{slug}`
**What to test:**
- [ ] Program title and featured image
- [ ] Program description with images/formatted content
- [ ] Objectives/Goals section
- [ ] "Back" button

### Publications — `/publications`
**What to test:**
- [ ] Publication cards show title, date, category, excerpt
- [ ] Category filter
- [ ] PDF download link/icon visible on each card

### Single Publication — `/publications/{slug}`
**What to test:**
- [ ] Title, author, date
- [ ] Full content with images
- [ ] PDF download button
- [ ] "Back to Publications" link

### About Page — `/about` (or `/about/{type}`)
**What to test:**
- [ ] Mission/vision statement
- [ ] Organization history/timeline
- [ ] Team member cards with photos
- [ ] Contact information in footer format

### Contact — `/contact`
**What to test:**
- [ ] Contact form (name, email, subject, message)
- [ ] Form validation errors display clearly
- [ ] Google Map embed
- [ ] Office address, phone, email displayed

### Careers — `/careers` or `/jobs`
**What to test:**
- [ ] Job listings in card format
- [ ] "Apply Now" links

### Sitemap — `/sitemap`
**What to test:**
- [ ] All pages listed in organized structure
- [ ] Links are clickable and go to correct pages
- [ ] Categories grouped logically

---

## Authentication Pages

### Login — `/login`
**Prerequisites:** None
**What to test:**
- [ ] Email and password fields present
- [ ] "Remember Me" checkbox
- [ ] "Forgot Password" link works
- [ ] Form validation shows errors for empty fields
- [ ] Invalid credentials shows error message
- [ ] "Sign Up" / "Register" link navigates to registration page

### Registration — `/register`
**What to test:**
- [ ] Name, email, password, password confirmation fields
- [ ] Terms and conditions checkbox required
- [ ] Form validation (password mismatch, email format)
- [ ] Success redirect to login or dashboard

### Forgot Password — `/password/forgot` or `/forgot-password`
**What to test:**
- [ ] Email field
- [ ] "Send Reset Link" button
- [ ] Valid email shows success message
- [ ] Invalid email shows error

---

## Job Seeker Dashboard (Login Required)

### Login First
Navigate to `/login` and log in with a job seeker account.

### My Profile — `/backend/applicant/profile`
**What to test:**
- [ ] Profile completion percentage bar visible
- [ ] Personal info section (name, phone, address, DOB)
- [ ] Professional info section (experience, current job title)
- [ ] "Edit" buttons for each section
- [ ] CV section with uploaded CVs
- [ ] "Add New CV" button
- [ ] Profile photo displays (or placeholder)

### Complete Profile — `/complete-profile`
**What to test:**
- [ ] Step-by-step progress indicator
- [ ] Form fields for personal info (name, phone, address, DOB, gender)
- [ ] Professional info section (experience, job title, social links)
- [ ] Save button (shows success message)
- [ ] Back/Next navigation between steps

### Upload Profile Photo — `POST /profile/photo`
**What to test:**
- [ ] File upload form shows
- [ ] Accepts JPG/PNG files under size limit
- [ ] Rejects invalid file types (error message)
- [ ] Preview shows after upload
- [ ] Success confirmation

### Upload CV — `POST /profile/cv`
**What to test:**
- [ ] File upload for PDF/DOC
- [ ] File size limit enforced (error if too large)
- [ ] CV appears in list after upload
- [ ] Mark as primary option (if multiple CVs)

### Job Listings — `/backend/seeker/jobs`
**What to test:**
- [ ] List of available jobs
- [ ] "Apply Now" on each job card
- [ ] Filter by job type/category
- [ ] Search functionality

### Single Job Detail — `/backend/seeker/jobs/{slug}`
**What to test:**
- [ ] Full job description
- [ ] Requirements list
- [ ] Application form (if not applied yet)
- [ ] "Already Applied" indicator (if applied)

---

## Employer Dashboard (Login Required as Employer)

### Login First
Navigate to `/login` and log in with an employer/admin account.

### My Jobs — `/backend/listing`
**What to test:**
- [ ] Table of job listings with columns: Title, Category, Status, Applications, Actions
- [ ] "Create New Job" button
- [ ] Status badges (Active/Inactive)
- [ ] "Edit" and "Delete" buttons on each row
- [ ] "View Applications" link for each job

### Create Job — `/backend/listing/create`
**What to test:**
- [ ] Form sections: Basic Info, Description (Rich text editor), Requirements, Settings
- [ ] Fields: Title, Slug, Category, Location, Job Type, Experience Level, Salary, Application Deadline
- [ ] Rich text editor toolbar (bold, italic, lists, link, image)
- [ ] "Save as Draft" vs "Publish" option
- [ ] Form validation on required fields
- [ ] Image upload for job thumbnail
- [ ] "Cancel" button returns to listings

### Applications — `/backend/applications`
**What to test:**
- [ ] Table showing: Applicant Name, Job Title, Applied Date, Status, Actions
- [ ] Filter by job, status, date range
- [ ] Status dropdown (Pending → Shortlisted → Rejected → Hired)
- [ ] "View Details" shows full application
- [ ] Bulk action checkboxes (change status, delete)
- [ ] Export CSV/XLSX button

### Single Application — `/backend/applications/{id}`
**What to test:**
- [ ] Applicant info (name, email, phone)
- [ ] Resume/CV download link (or "No CV uploaded")
- [ ] ATS score and matched keywords
- [ ] "Recalculate ATS" button
- [ ] Status history timeline
- [ ] Notes section (employer can add notes)
- [ ] Send email to applicant

### Applicant Profiles — `/backend/applicant-profiles`
**What to test:**
- [ ] Table of applicant profiles
- [ ] Search by name, email, phone
- [ ] Filter by experience level, location
- [ ] Profile detail view (personal info, professional info, CVs)
- [ ] "Delete" soft-deletes profile (appears in trash)
- [ ] "Restore" from trash
- [ ] "Force Delete" permanently removes

### Categories — `/backend/categories`
**What to test:**
- [ ] List of job categories
- [ ] "Add New Category" button
- [ ] Edit inline (click to edit name)
- [ ] Delete category (with confirmation dialog)
- [ ] Sort order drag-and-drop (if implemented)

### Locations — `/backend/locations`
**What to test:**
- [ ] List of locations
- [ ] "Add New Location" button
- [ ] Map view toggle (if implemented)
- [ ] Edit/delete actions

### Roles & Permissions — `/backend/roles`
**What to test:**
- [ ] List of roles with user counts
- [ ] "Add New Role" button
- [ ] Edit permissions by role (checkbox grid)
- [ ] Role level hierarchy enforcement

### Users — `/backend/users`
**What to test:**
- [ ] List of all users with roles
- [ ] Search and filter
- [ ] "Impersonate" button (for admin)
- [ ] Change role dropdown
- [ ] "Reset Password" action

### Settings — `/backend/admin-profile/edit`
**What to test:**
- [ ] Current admin info display
- [ ] Edit form (name, email)
- [ ] Change password form
- [ ] Site icon upload (PNG, under size limit)
- [ ] "Reset Icon" button
- [ ] "Save Changes" button
- [ ] Success/error messages

### Page Map — `/backend/page-map`
**What to test:**
- [ ] Tree view of all site pages
- [ ] Click to expand/collapse sections
- [ ] "Export JSON" button
- [ ] "Clear Cache" button
- [ ] "Sitemap URLs" generation
- [ ] "Admin Menu" structure preview

### Logs — `/backend/logs`
**What to test:**
- [ ] List of system log entries
- [ ] Filter by log level (info, warning, error)
- [ ] Date range filter
- [ ] Search by keyword
- [ ] "Export" downloads logs as file
- [ ] "Clear Logs" button (with confirmation)
- [ ] Pagination

### Notifications — `/backend/notifications`
**What to test:**
- [ ] List of notifications with read/unread status
- [ ] "Mark All as Read" button
- [ ] Click notification to navigate to related item
- [ ] Unread count badge in navbar

### Cache Management — `/backend/cache`
**What to test:**
- [ ] Cache status display (size, last cleared)
- [ ] "Clear Cache" button
- [ ] Individual cache clear buttons (views, routes, config, compiled)
- [ ] Success message after clearing

### Backups — `/backend/backup`
**What to test:**
- [ ] List of existing backups with date/size
- [ ] "Create Manual Backup" button
- [ ] "Create Automatic Backup" button
- [ ] Restore selected backup (with confirmation)
- [ ] Delete backup (with confirmation)
- [ ] Download backup file link
- [ ] Backup status (in progress / completed)

---

## Newsletter

### Subscription Form (Public) — Appears in footer
**What to test:**
- [ ] Email input field
- [ ] "Subscribe" button
- [ ] Valid email subscribed successfully (check confirmation)
- [ ] Invalid email shows error
- [ ] Already subscribed shows message
- [ ] Unsubscribed user can resubscribe

### Newsletter Dashboard — `/backend/newsletter`
**What to test:**
- [ ] List of subscribers with email, status, subscribed date
- [ ] "Add Subscriber" button
- [ ] Bulk unsubscribe checkbox
- [ ] Search by email
- [ ] Status filter (subscribed/unsubscribed)
- [ ] "Send Bulk Email" button (opens campaign form)
- [ ] "Export" subscriber list

### Newsletter Campaigns — `/backend/newsletter/campaigns`
**What to test:**
- [ ] List of past campaigns with subject, sent date, recipients
- [ ] "Create Campaign" button
- [ ] Send test email to self
- [ ] Schedule for later
- [ ] Preview in browser

---

## Mobile Responsiveness Checklist

### All Pages
- [ ] Content fits screen width (no horizontal scroll)
- [ ] Navbar collapses into hamburger menu
- [ ] Hamburger menu opens full-screen overlay
- [ ] Buttons are large enough for touch (min 44px)
- [ ] Form fields are not too small
- [ ] Tables stack on mobile (or horizontal scroll)
- [ ] No text overlaps or cutoffs

### Key Mobile-Specific Items
- [ ] Footer links are tappable
- [ ] "Apply Now" buttons are prominent
- [ ] Search bar in header is easy to tap
- [ ] Dropdowns close when tapping outside

---

## Error Handling

### 404 Page
- Navigate to a non-existent page (e.g., `/nonexistent`)
- Verify:
  - [ ] "404" or "Page Not Found" message
  - [ ] Friendly illustration or icon
  - [ ] "Go Home" button that links to `/`
  - [ ] Search bar (if implemented)

### 403 Page
- Try to access `/backend` without logging in
- Verify:
  - [ ] "Unauthorized" or "Access Denied" message
  - [ ] Redirect to login (or 403 page)
  - [ ] Clear explanation of why access was denied

### Form Validation Errors
- [ ] Submit empty required fields
- [ ] Verify error messages appear near the field
- [ ] Error messages are descriptive (not just "Invalid")
- [ ] Fields with errors are highlighted (red border)
- [ ] Multiple errors all display

---

## Browser Compatibility Test

Test the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android (mobile)

For each browser, check:
- [ ] Layout renders consistently
- [ ] Fonts display correctly
- [ ] Colors match design
- [ ] Interactive elements work (dropdown, modal, form)
- [ ] No layout breaks

---

## Performance / Loading

- [ ] Home page loads within 3 seconds
- [ ] Images load progressively (blur-up or placeholder)
- [ ] "Loading..." indicator shows on slow pages
- [ ] Pagination is fast
- [ ] Search results return quickly
- [ ] No console errors (F12 → Console)

---

## Section Builder (Admin) — `/backend/cms/sections/page/{pageId}`

**Prerequisites:** Login as admin, navigate to CMS → Sections

### Available Prebuilt Sections (23 components)

| Component | Data Table | Description |
|-----------|------------|-------------|
| `HomeBanner` | custom_section_data | Hero banner with slides, tagline, title, description, buttons |
| `AboutUsSection` | shared_data/custom | About us with title, description, button, mission items |
| `OurActionSection` | shared_data | Our action/activities section |
| `WhereWeWorkSection` | shared_data | Geographic coverage section |
| `HeroFigureSection` | custom_section_data | Stats/figures with numbers and labels |
| `CardsSection` | custom_section_data | Card grid for services/programs |
| `ContactOfficeSection` | shared_data | Office contact details |
| `AddressSection` | shared_data | Address and map location |
| `ContactReachSection` | shared_data | Contact form section |
| `FollowUSSection` | shared_data | Social media follow section |
| `LegalSection` | shared_data | Legal/copyright footer |
| `ProgramImpactSection` | shared_data | SDG/program impact highlights |
| `ImageGallerySection` | custom_section_data | Image gallery with lightbox |
| `VideoGallerySection` | custom_section_data | Video gallery embeds |
| `TextContentSection` | custom_section_data | Rich text content block |
| `JobsSection` | jobs | Latest/recent job listings display |
| `OurProgramsSection` | programs | Program cards grid |
| `BlogSection` | blogs | Blog posts listing |
| `PublicationsSection` | publications | Publications listing |
| `StoriesSection` | shared_data | Success stories/testimonials |
| `FAQSection` | shared_data | Frequently asked questions |
| `UpcomingEventsSection` | shared_data | Upcoming events calendar |
| `HtmlCssSection` | custom_section_data | Custom HTML/CSS editor section |

### Section Management Tests

#### Viewing Sections
1. Navigate to `/backend/cms/sections/page/{id}` (replace `{id}` with a page ID)
2. **Verify:**
   - [ ] Page name displayed in header
   - [ ] Section list shows all active sections with drag handle
   - [ ] Each section card shows: component name, data table, enabled toggle
   - [ ] "Add Section" button visible
   - [ ] "Update Order" button visible
   - [ ] Trashed sections accessible via "Trash" tab

#### Adding a Section
1. Click "Add Section"
2. **Verify:**
   - [ ] Component dropdown includes all 23 prebuilt components
   - [ ] Data table dropdown shows: custom_section_data, shared_data, blogs, programs, publications, about_content, jobs, job_details, pages (9 options)
   - [ ] Section key field (auto-generated from component name)
   - [ ] "Enabled" toggle (default: on)
   - [ ] Custom props JSON editor (optional)
   - [ ] "Save" and "Cancel" buttons
3. Select `HomeBanner` → `custom_section_data`
4. **Verify:**
   - [ ] Default data created automatically (banner slides with placeholder images)
   - [ ] Section appears in the section list

#### Adding a Data-Backed Section
1. Add a `BlogSection` with `blogs` data table
2. **Verify:**
   - [ ] No default custom data created (data_table is not `custom_section_data`)
   - [ ] Section appears in list
   - [ ] On frontend, section pulls live blog data

#### Adding a Shared Data Section
1. Add an `AboutUsSection` with `shared_data` data table
2. **Verify:**
   - [ ] Section connects to shared data system
   - [ ] Frontend renders shared data for this section

#### Reordering Sections
1. Drag sections to reorder
2. Click "Update Order"
3. **Verify:**
   - [ ] Order persists after page reload
   - [ ] Frontend displays sections in correct order

#### Updating a Section
1. Click "Edit" on any section
2. **Verify:**
   - [ ] Form pre-fills current values
   - [ ] Can toggle enabled/disabled
   - [ ] Custom props editor loads current JSON
   - [ ] "Save Changes" updates the section
   - [ ] "Cancel" discards changes

#### Deleting/Restoring Sections
1. Delete a section
2. **Verify:**
   - [ ] Section moves to trash
   - [ ] "Undo" option available
3. Navigate to trash tab
4. **Verify:**
   - [ ] Trashed sections listed
   - [ ] "Restore" button returns section to active
   - [ ] "Force Delete" permanently removes

#### Validation Tests
1. **Invalid data table:** Enter a data_table value not in the allowed list
   - [ ] Validation error: "The selected data_table is invalid."
2. **Duplicate section_key:** Try creating a section with duplicate key on same page
   - [ ] Validation error: "The section_key has already been taken."
3. **Missing page_id:** Submit without page_id
   - [ ] Validation error

---

## Frontend Section Rendering Tests

### Home Page Sections
Navigate to `/` (home page)

**Verify each section renders correctly:**
- [ ] **HomeBanner** — Carousel/slider of banner images with overlay text, CTA buttons
- [ ] **HeroFigureSection** — Stat cards with numbers (e.g., "50+ Projects")
- [ ] **AboutUsSection** — Title, description, learn more button
- [ ] **OurActionSection** — Action items grid
- [ ] **CardsSection** — Responsive card grid
- [ ] **JobsSection** — Latest job listings (title, company, location, apply button)
- [ ] **OurProgramsSection** — Program cards with image, title, link
- [ ] **BlogSection** — Blog cards (featured image, title, excerpt, date)
- [ ] **ImageGallerySection** — Image gallery with lightbox on click
- [ ] **ContactReachSection** — Contact form or contact details
- [ ] **StoriesSection** — Success story cards
- [ ] **FAQSection** — Expandable accordion items
- [ ] **Footer Sections** (FollowUSSection, LegalSection, AddressSection)

### Blog Page Sections
Navigate to `/blog`

**Verify:**
- [ ] Blog listing section with search/filter
- [ ] Pagination controls
- [ ] Featured blog posts highlighted

### Program Page Sections
Navigate to `/programs`

**Verify:**
- [ ] Program cards with images, titles, descriptions
- [ ] Category filter (if applicable)
- [ ] "Load More" button or pagination

### What Page Sections
Navigate to `/about`

**Verify:**
- [ ] About content sections display properly
- [ ] Mission/Vision sections
- [ ] Team member grid
- [ ] Section ordering matches CMS configuration

### Mobile Section Tests
**For each section on mobile:**
- [ ] Content stacks vertically (no horizontal scroll)
- [ ] Images scale appropriately
- [ ] Buttons are full-width or properly sized
- [ ] Text is readable without horizontal scrolling
- [ ] Section padding/margins look correct

### Cross-Browser Section Tests
Test sections on:
- [ ] Chrome — all sections render correctly
- [ ] Firefox — no layout issues
- [ ] Safari — no flexbox/grid gaps
- [ ] Mobile Safari — touch interactions work
- [ ] Chrome Android — section heights correct

---

## Adding Prebuilt Sections Safely (Developer Notes)

### What Happens When You Add a Prebuilt Section

When adding a section via the CMS UI:

1. **Custom Section Data (`custom_section_data` table):**
   - A `SectionConfig` record is created in the `section_configs` table
   - A `CustomSectionData` record is auto-created with the default data template
   - The default data comes from `getDefaultDataForComponent()` in `SectionController`

2. **Data-Backed Sections (e.g., `blogs`, `jobs`, `programs`):**
   - Only a `SectionConfig` record is created
   - Data is fetched live from the respective table at render time
   - No seed data required

3. **Shared Data Sections (`shared_data` table):**
   - Only a `SectionConfig` record is created
   - Data comes from `SharedData` model records keyed by section_key
   - The `SHARED_DATA_MAP` maps data keys to shared data types

### Potential Issues When Adding Sections

#### ✅ Safe — No Missing Dependencies
```php
// Adding a BlogSection with data_table=blogs
// Safe because:
// - No seed data needed (fetched live)
// - SectionConfig validates against SectionDataTable enum
// - Frontend PageController has fetchBlogs() in DATA_TABLE_MAP
```

#### ⚠️ Requires Seed Data — `custom_section_data`
When using `data_table=custom_section_data`:
- Default data is auto-created from the component template
- If the component has no template in `getDefaultDataForComponent()`, no data is created (section will be empty)
- Solution: Add the component to the match expression in SectionController

#### ⚠️ Requires SharedData Records — `shared_data`
When using `data_table=shared_data`:
- Data must exist in the `shared_data` table with matching `type`
- The `SHARED_DATA_MAP` in PageController must include the data_key
- Missing shared data = empty section (no error thrown)

#### ⚠️ Requires Model Records — `blogs`, `programs`, `publications`, `jobs`
These pull live data from their respective tables:
- No seed data required for the section to exist
- Section renders empty if no records exist in the data table

### Adding a New Prebuilt Component (Developer Guide)

1. **Add to `getDefaultDataForComponent()`** in `app/Http/Controllers/Cms/SectionController.php`:
   ```php
   'MyNewSection' => [
       'title' => 'My Section Title',
       'content' => 'Default content here',
   ],
   ```

2. **Add React component** in `resources/js/Components/Sections/MyNewSection.vue`

3. **Add to frontend mapping** in `app/Http/Controllers/Frontend/PageController.php`:
   - Add data table to `DATA_TABLE_MAP` if using a custom data table
   - Add shared data key to `SHARED_DATA_MAP` if using shared data

4. **Verify the 3-layer consistency:**
   - `SectionDataTable` enum defines valid `data_table` values
   - `PageController::DATA_TABLE_MAP` resolves them at frontend
   - `SectionController::loadSectionData()` resolves them at admin level
   - Ensure all three lists include your new data table value
