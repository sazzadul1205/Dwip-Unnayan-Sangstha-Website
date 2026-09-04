# ATS Demo - Complete Setup Instructions

## Overview

This is a **standalone Laravel application** that demonstrates the ATS (Applicant Tracking System) functionality from your main project. It's completely isolated and won't affect your main project.

## Prerequisites

Make sure you have:
- PHP 8.2+ with required extensions (mbstring, xml, curl, json, sqlite/pdo)
- Composer
- Node.js 18+ and npm (optional, for frontend assets)

## Step-by-Step Setup

### 1. Navigate to the demo directory

```bash
cd /workspace/ats-demo
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Create SQLite database

```bash
touch database/database.sqlite
```

### 5. Run migrations

```bash
php artisan migrate
```

### 6. Seed demo data (optional but recommended)

Create a seeder file at `database/seeders/ATSDemoSeeder.php` or run:

```bash
php artisan db:seed
```

### 7. Start the development server

```bash
php artisan serve --port=8001
```

### 8. Access the application

Open your browser and navigate to:
```
http://localhost:8001
```

## What's Included

### Backend (Laravel)

**Models:**
- `Application` - Job applications with ATS scoring
- `JobListing` - Job postings
- `ApplicantProfile` - Applicant information
- `ApplicantCv` - CV/resume storage
- `StatusTimeline` - Application status history
- `JobCategory` - Job categories
- `Location` - Job locations

**Service:**
- `ATSService` - Resume parsing and keyword matching

**Controller:**
- `ATSController` - All ATS-related endpoints

**Routes:**
- `/` - Dashboard
- `/applications` - Applications list
- `/applications/{id}` - Application details
- `/jobs` - Job listings
- `/jobs/{id}/applications` - Job-specific applications

### Frontend (To be created)

You'll need to create React components in:
- `resources/js/pages/ATS/`
- `resources/js/components/ATS/`

Or use the existing components from your main project:
```bash
# Copy frontend files from main project
cp -r /workspace/resources/js/pages/Backend/Applications /workspace/ats-demo/resources/js/pages/ATS/
```

## Key Features Demonstrated

1. **ATS Score Calculation**
   - Parse PDF/DOCX resumes
   - Extract keywords from job descriptions
   - Calculate match percentage
   - Show matched/missing keywords

2. **Application Management**
   - View/filter applications
   - Update status (pending → shortlisted → hired/rejected)
   - Bulk operations
   - Status timeline tracking

3. **Dashboard Analytics**
   - Status distribution
   - ATS score statistics
   - Recent applications
   - Top jobs by applications

## Troubleshooting

### "Class not found" errors
Run: `composer dump-autoload`

### Database errors
Ensure SQLite extension is enabled: `php -m | grep pdo_sqlite`

### Permission issues
```bash
chmod -R 755 /workspace/ats-demo/storage
chmod -R 755 /workspace/ats-demo/bootstrap/cache
```

## Isolation Guarantee

✅ This demo uses:
- Separate database (`database/database.sqlite`)
- Independent configuration (`.env`)
- Its own routes (`routes/web.php`)
- No shared state with main project

Your main project remains completely unaffected!

## Next Steps

1. Set up the frontend (React + Inertia)
2. Add sample data for demonstration
3. Customize the UI for your showcase
4. Deploy independently if needed

For questions or issues, refer to the main README.md.
