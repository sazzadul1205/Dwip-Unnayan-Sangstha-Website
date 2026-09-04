# ATS Demo - Standalone Applicant Tracking System

A standalone demonstration of the ATS (Applicant Tracking System) functionality, separated from the main project for independent showcasing.

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- SQLite or MySQL

### Installation

```bash
# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Create database (SQLite example)
touch database/database.sqlite

# Run migrations
php artisan migrate

# Seed demo data
php artisan db:seed

# Install Node dependencies
npm install

# Build assets
npm run build

# Start development server
php artisan serve
```

## 📁 Project Structure

```
ats-demo/
├── app/
│   ├── Models/           # ATS-related models
│   │   ├── Application.php
│   │   ├── JobListing.php
│   │   ├── ApplicantProfile.php
│   │   ├── ApplicantCv.php
│   │   ├── StatusTimeline.php
│   │   ├── JobCategory.php
│   │   └── Location.php
│   ├── Services/         # Business logic
│   │   └── ATSService.php
│   └── Http/Controllers/ # API controllers
│       └── ATSController.php
├── resources/
│   └── js/
│       ├── pages/        # React pages
│       ├── components/   # Reusable components
│       └── hooks/        # Custom hooks
├── routes/
│   └── web.php          # Route definitions
└── database/
    └── migrations/       # Database migrations
```

## 🎯 Features Demonstrated

### 1. ATS Score Calculation
- Resume parsing (PDF, DOCX, DOC)
- Keyword matching against job requirements
- Percentage-based scoring
- Matched/missing keywords analysis

### 2. Application Management
- View all applications with filtering
- Application status workflow (Pending → Shortlisted → Hired/Rejected)
- Bulk operations
- Status timeline tracking

### 3. Job Listings Integration
- Active job postings
- Category and location filtering
- Application tracking per job

### 4. Dashboard Analytics
- Status distribution charts
- ATS score statistics
- Application trends

## 🔧 Configuration

### Environment Variables

```env
APP_NAME="ATS Demo"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
DB_DATABASE=/path/to/database.sqlite
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ats/applications` | List all applications |
| GET | `/ats/applications/{id}` | Show application details |
| POST | `/ats/applications/{id}/status` | Update status |
| POST | `/ats/applications/bulk-status` | Bulk status update |
| GET | `/ats/jobs` | List job listings |
| GET | `/ats/jobs/{id}/applications` | Job-specific applications |
| POST | `/ats/applications/{id}/recalculate-ats` | Recalculate ATS score |

## 🎨 UI Components

The demo includes ready-to-use React components:

- `ApplicationsTable` - Filterable applications list
- `ATSScoreCard` - Visual ATS score display
- `StatusBadge` - Status indicators
- `ApplicationFilters` - Advanced filtering panel
- `JobSelector` - Job listing dropdown
- `BulkActions` - Multi-select operations

## 📝 Demo Data

Run the seeder to populate demo data:

```bash
php artisan db:seed --class=ATSDemoSeeder
```

This creates:
- 5 sample job listings
- 20 sample applications with various statuses
- Sample resumes for ATS testing
- Pre-calculated ATS scores

## 🚫 Isolation from Main Project

This demo is completely standalone:
- Separate database
- Independent configuration
- No shared state with main project
- Can be deployed independently
- Safe for demonstrations and testing

## 📄 License

MIT License
