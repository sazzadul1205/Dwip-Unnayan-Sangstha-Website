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
