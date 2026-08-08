# 🏝️ Dwip Unnayan Songstha (DUS) — Job Portal & NGO Management System

> **Enterprise-grade Laravel + Inertia.js + React platform for NGO operations, job listings, applicant tracking, and content management.**

[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?logo=laravel&logoColor=white)](https://laravel.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Inertia.js](https://img.shields.io/badge/Inertia.js-1.x-9553E9?logo=inertia&logoColor=white)](https://inertiajs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-22C55E.svg)](LICENSE)

### 🔎 Quick Navigation

- **Public Website:** `http://localhost:8000`
- **Admin Login:** `http://localhost:8000/login/staff`
- **Job Seeker Login:** `http://localhost:8000/login/seeker`
- **License:** MIT


---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Caching Strategy](#-caching-strategy)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Dwip Unnayan Songstha (DUS)** is a comprehensive web platform built to empower island communities in Bangladesh through sustainable development, education, healthcare, and livelihood support. The system combines:

- **Job Portal** – Full-featured job listing and application tracking
- **Applicant Tracking System (ATS)** – AI-powered resume scoring
- **Content Management System (CMS)** – Dynamic page and section builder
- **Role-Based Access Control (RBAC)** – Granular permissions system
- **Newsletter Management** – Subscriber management and email campaigns
- **Backup & Logging** – Automated system backups and audit trails

---

## ✨ Features

### 🏢 Job Portal
- **Public Job Listings** – Browse jobs with advanced filtering
- **Infinite Scroll** – Seamless job listing experience
- **Job Details** – Comprehensive job descriptions with ATS scoring
- **Popular & Trending** – View most viewed and most applied jobs
- **Job Categories & Locations** – Organized by category and location
- **Employer Profiles** – Company profiles with job history

### 📄 Applicant Tracking System (ATS)
- **AI-Powered Resume Scoring** – Match resumes against job requirements
- **Keyword Extraction** – Automatically extract skills and keywords
- **Score Analysis** – Visual feedback on resume completeness
- **CV Management** – Upload, set primary, and manage multiple CVs
- **Application Status Tracking** – Pending → Shortlisted → Rejected → Hired
- **Bulk Operations** – Batch update status, delete, and export applications

### 📝 Content Management System (CMS)
- **Dynamic Page Builder** – Drag-and-drop section management
- **Blog Management** – Full CRUD with featured posts
- **Programs** – Project and program showcase
- **Publications** – Digital publications with PDF support
- **About Content** – Dynamic about pages with details
- **Shared Data** – Centralized topbar, navbar, footer management
- **Editor Image Upload** – Base64 image handling for rich text

### 👥 Role-Based Access Control (RBAC)
- **Granular Permissions** – Fine-grained access control
- **Role Hierarchy** – Level-based permission inheritance
- **Module Access** – Manage access per module (read, write, manage)
- **User Management** – Create, update, delete, and verify users
- **Role Cloning** – Duplicate roles for quick setup

### 🔐 Authentication & Security
- **Multi-Role Login** – Admin and Job Seeker separate login flows
- **Google OAuth** – Social login integration
- **Email Verification** – Verify email before access
- **Rate Limiting** – Throttle sensitive endpoints
- **Security Logging** – Comprehensive audit trails
- **Password Reset** – Secure password recovery

### 📊 Analytics & Monitoring
- **Dashboard** – Role-based dashboards with metrics
- **Job Statistics** – Charts and trends for jobs and applications
- **ATS Score Analytics** – Score distribution by job type
- **Employer Rankings** – Top employers by job count and applications
- **Activity Logs** – System, security, and application logs

### 🔄 Cache Management
- **Smart Caching** – 5-minute TTL for public content
- **Admin Cache Control** – Clear specific or all caches
- **Frontend Cache** – Shared data and page section caching
- **Cache Invalidation** – Automatic cache clear on content updates

### 📧 Newsletter System
- **Subscriber Management** – Subscribe, unsubscribe, resubscribe
- **Bulk Emails** – Send newsletters to subscribers
- **Test Emails** – Test email templates before sending
- **CSV Export** – Export subscriber list
- **Unsubscribe Links** – Automatic unsubscribe tokens

### 💾 Backup System
- **Manual & Automated Backups** – Full or partial backups
- **Database Backup** – SQL dump with structure and data
- **File Backup** – Config, routes, views, and environment
- **Restore** – Restore from backup files
- **Retention Policy** – Automatic cleanup of old backups

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **PHP** | 8.2+ | Core language |
| **Laravel** | 11.x | Framework |
| **Laravel Sanctum** | Latest | API authentication |
| **Laravel Socialite** | Latest | Google OAuth |
| **Laravel Inertia** | Latest | Server-side routing |
| **Laravel Cache** | Redis/Database | Caching layer |
| **Laravel Queue** | Redis/Database | Job processing |
| **Laravel Notifications** | Latest | Notifications system |
| **Laravel Mail** | Latest | Email sending |
| **Smalot PDF Parser** | Latest | PDF text extraction |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI library |
| **Inertia.js** | 1.x | Full-stack SPA |
| **Tailwind CSS** | 3.x | Styling |
| **React Icons** | Latest | Icon library |
| **Axios** | Latest | HTTP client |
| **Vite** | 5.x | Build tool |

### Database & Storage
| Technology | Purpose |
|------------|---------|
| **MySQL** | Primary database |
| **Redis** | Cache & session storage |
| **Laravel Storage** | File storage (local/S3) |
| **Elasticsearch** | (Future) Job search |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Laravel Pint** | Code formatting |
| **Laravel IDE Helper** | IDE autocomplete |
| **Laravel Telescope** | Debugging |
| **Laravel Horizon** | Queue monitoring |
| **Sentry** | Error tracking |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                       │
├─────────────────────────────────────────────────────────────────┤
│  Public Layout  │  Admin Layout  │  Components  │  Pages      │
├─────────────────────────────────────────────────────────────────┤
│                      Inertia.js Bridge                         │
├─────────────────────────────────────────────────────────────────┤
│                         Laravel Backend                        │
├─────────────────────────────────────────────────────────────────┤
│  Controllers  │  Models  │  Services  │  Middleware  │  Traits │
├─────────────────────────────────────────────────────────────────┤
│                    Database (MySQL)                            │
├─────────────────────────────────────────────────────────────────┤
│  Pages  │  Blogs  │  Programs  │  Publications  │  Shared Data │
│  Jobs   │  Applications  │  Users  │  Roles  │  Permissions   │
├─────────────────────────────────────────────────────────────────┤
│                     Cache (Redis)                              │
│                     Queue (Redis)                              │
│                     Storage (Local/S3)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

1. **Inertia.js Integration** – Single-page application feel without complex API management
2. **Repository Pattern** – Separates business logic from controllers
3. **Service Layer** – Encapsulates complex business operations
4. **Trait-Based Reusability** – Shared functionality across controllers
5. **Smart Caching** – Reduces database load for public content
6. **Comprehensive Logging** – Audit trails for all critical actions

---

## 📦 Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- NPM/Yarn
- MySQL 8.0+
- Redis (optional, for caching)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/dwip-unnayan-songstha.git
# Replace the repository URL above with your actual GitHub repository.
cd dwip-unnayan-songstha
```

### Step 2: Install PHP Dependencies

```bash
composer install
```

### Step 3: Install Node Dependencies

```bash
npm install
```

### Step 4: Environment Setup

```bash
cp .env.example .env
```

### Step 5: Generate Application Key

```bash
php artisan key:generate
```

### Step 6: Storage Link

```bash
php artisan storage:link
```

### Step 7: Build Frontend Assets

```bash
npm run build
```

---

## 🔧 Environment Setup

### ⚠️ Security Note

Never commit `.env`, real credentials, OAuth secrets, SMTP passwords, API keys, production database credentials, or generated backup files to Git. Use `.env.example` as the template for local configuration.


### Required Environment Variables

```env
# Application
APP_NAME="Dwip Unnayan Songstha"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dus_db
DB_USERNAME=root
DB_PASSWORD=

# Redis (Cache & Sessions)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail (SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@dus.org
MAIL_FROM_NAME="Dwip Unnayan Songstha"

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# File Storage
FILESYSTEM_DISK=public
STORAGE_URL=http://localhost:8000/storage

# Cache
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

---

## 🗄️ Database Setup

### Step 1: Create Database

```sql
CREATE DATABASE dus_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Run Migrations

```bash
php artisan migrate
```

### Step 3: Seed Database (Optional)

```bash
php artisan db:seed
```

### Step 4: Create Default Admin

```bash
php artisan tinker
```

```php
use App\Models\User;

$user = User::create([
    'name' => 'Super Admin',
    'email' => 'admin@dus.org',
    'password' => bcrypt('CHANGE_THIS_PASSWORD'),
    'email_verified_at' => now(),
]);

$user->assignRole('super-admin');
```

---

## 🚀 Running the Application

### Development Mode

```bash
# Run both backend and frontend development servers
php artisan serve &
npm run dev
```

**Access:**
- Website: http://localhost:8000
- Admin Login: http://localhost:8000/login/staff
- Job Seeker Login: http://localhost:8000/login/seeker

### Production Mode

```bash
npm run build
php artisan optimize
php artisan serve --env=production
```

### Queue Worker (For Email & Background Jobs)

```bash
php artisan queue:work --queue=default,emails
```

### Scheduled Jobs (Cron)

```bash
* * * * * cd /var/www/dus && php artisan schedule:run >> /dev/null 2>&1
```

---

## 📁 Project Structure

```
dwip-unnayan-songstha/
├── app/
│   ├── Console/
│   │   ├── Commands/
│   │   │   ├── ClearFrontendCache.php
│   │   │   ├── UpdateJobStatuses.php
│   │   │   └── GenerateSitemap.php
│   │   └── Kernel.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   │   ├── CacheController.php
│   │   │   │   └── DashboardController.php
│   │   │   ├── Api/
│   │   │   │   ├── ContentApiController.php
│   │   │   │   └── JobListingApiController.php
│   │   │   ├── Auth/
│   │   │   │   ├── AdminStaff/
│   │   │   │   │   └── AdminLoginController.php
│   │   │   │   ├── JobSeeker/
│   │   │   │   │   ├── JobSeekerLoginController.php
│   │   │   │   │   ├── JobSeekerRegisterController.php
│   │   │   │   │   └── ProfileCompletionController.php
│   │   │   │   └── Shared/
│   │   │   │       ├── GoogleAuthController.php
│   │   │   │       ├── NewPasswordController.php
│   │   │   │       ├── VerifyEmailController.php
│   │   │   │       └── ...
│   │   │   ├── Backend/
│   │   │   │   ├── JobCategoryController.php
│   │   │   │   ├── LocationController.php
│   │   │   │   ├── LogController.php
│   │   │   │   ├── NotificationController.php
│   │   │   │   ├── RoleController.php
│   │   │   │   └── UserController.php
│   │   │   ├── Backup/
│   │   │   │   └── BackupController.php
│   │   │   ├── Cms/
│   │   │   │   ├── AboutContentController.php
│   │   │   │   ├── BlogController.php
│   │   │   │   ├── EditorImageUploadController.php
│   │   │   │   ├── PageController.php
│   │   │   │   ├── ProgramController.php
│   │   │   │   ├── PublicationController.php
│   │   │   │   ├── SectionController.php
│   │   │   │   └── SharedDataController.php
│   │   │   ├── Frontend/
│   │   │   │   ├── PageController.php
│   │   │   │   └── SharedDataTrait.php
│   │   │   ├── JobListing/
│   │   │   │   ├── JobListingController.php
│   │   │   │   └── PublicJobListingController.php
│   │   │   ├── Profile/
│   │   │   │   ├── AdminProfileController.php
│   │   │   │   ├── ApplicantProfileController.php
│   │   │   │   └── EmployerProfileController.php
│   │   │   ├── Settings/
│   │   │   │   ├── PasswordController.php
│   │   │   │   └── ProfileController.php
│   │   │   ├── ApplyController.php
│   │   │   ├── ApplicationsController.php
│   │   │   ├── NewsletterController.php
│   │   │   └── PageMapController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureApplicantProfileComplete.php
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── ...
│   │   └── Requests/
│   │       ├── Auth/
│   │       │   └── LoginRequest.php
│   │       └── Settings/
│   │           └── ProfileUpdateRequest.php
│   ├── Models/
│   │   ├── pages/
│   │   │   ├── AboutContent.php
│   │   │   ├── Blog.php
│   │   │   ├── CustomSectionData.php
│   │   │   ├── Page.php
│   │   │   ├── Program.php
│   │   │   ├── Publication.php
│   │   │   ├── SectionConfig.php
│   │   │   └── SharedData.php
│   │   ├── ApplicantCv.php
│   │   ├── ApplicantProfile.php
│   │   ├── Application.php
│   │   ├── EducationHistory.php
│   │   ├── JobCategory.php
│   │   ├── JobHistory.php
│   │   ├── JobListing.php
│   │   ├── JobView.php
│   │   ├── Location.php
│   │   ├── NewsletterSubscription.php
│   │   ├── Permission.php
│   │   ├── Role.php
│   │   ├── RoleModuleAccess.php
│   │   ├── StatusTimeline.php
│   │   ├── User.php
│   │   └── UserRole.php
│   ├── Services/
│   │   ├── ATSService.php
│   │   ├── ContentService.php
│   │   ├── PageMapService.php
│   │   └── SimpleLogger.php
│   └── Traits/
│       └── HasRoles.php
├── bootstrap/
│   └── app.php
├── config/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── Backend/
│   │   │   │   ├── Applications/
│   │   │   │   ├── CMS/
│   │   │   │   ├── Dashboard/
│   │   │   │   ├── JobListings/
│   │   │   │   ├── PageMap/
│   │   │   │   ├── Roles/
│   │   │   │   └── Users/
│   │   │   └── Frontend/
│   │   │       ├── AboutDetails/
│   │   │       ├── BlogDetails/
│   │   │       ├── JobsDetails/
│   │   │       ├── ProjectsAndProgramsDetails/
│   │   │       ├── PublicationDetails/
│   │   │       ├── DynamicPage.jsx
│   │   │       ├── GenericPage.jsx
│   │   │       └── NotFound.jsx
│   │   ├── Shared/
│   │   │   ├── DynamicSectionRenderer.jsx
│   │   │   └── NotFoundContent.jsx
│   │   └── layouts/
│   │       ├── PublicLayout.jsx
│   │       └── BackendLayout.jsx
│   └── views/
│       ├── emails/
│       │   ├── application.blade.php
│       │   ├── newsletter-bulk.blade.php
│       │   ├── newsletter-test.blade.php
│       │   ├── newsletter-welcome.blade.php
│       │   ├── password-reset.blade.php
│       │   ├── shortlisted.blade.php
│       │   └── verification.blade.php
│       └── app.blade.php
├── routes/
│   ├── admin/
│   │   ├── dashboard.php
│   │   └── page-map.php
│   ├── api.php
│   ├── auth.php
│   ├── categories.php
│   ├── console.php
│   ├── fallback.php
│   ├── job-seeker.php
│   ├── locations.php
│   ├── newsletter.php
│   ├── notifications.php
│   ├── public.php
│   └── web.php
├── storage/
├── public/
├── tests/
├── .env.example
├── composer.json
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 📡 API Documentation

### Public Endpoints

#### Content API (Data Fetching)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/data/pages.json` | Get all pages |
| GET | `/data/blogs.json` | Get all blogs |
| GET | `/data/programs.json` | Get all programs |
| GET | `/data/jobs.json` | Get job listings |
| GET | `/data/shared_data.json` | Get shared data |
| GET | `/data/about_content.json` | Get about content |
| GET | `/data/section_configs.json` | Get section configs |
| GET | `/data/custom_section_data.json` | Get custom section data |
| GET | `/data/navigation.json` | Get navigation tree |

#### Job API (Infinite Scroll)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | Get paginated jobs |
| GET | `/api/jobs/filter-options` | Get filter options |
| GET | `/api/jobs/popular` | Get popular jobs |
| GET | `/api/jobs/trending` | Get trending jobs |
| GET | `/api/jobs/{identifier}` | Get single job |
| GET | `/api/jobs/{slug}/related` | Get related jobs |

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login/staff` | Admin login |
| POST | `/login/seeker` | Job seeker login |
| POST | `/register` | Job seeker registration |
| GET | `/auth/google/redirect` | Google OAuth redirect |
| GET | `/auth/google/callback` | Google OAuth callback |
| POST | `/logout` | Logout |
| POST | `/forgot-password` | Password reset request |
| POST | `/reset-password` | Reset password |

### Newsletter Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/newsletter/subscribe` | Subscribe to newsletter |
| GET | `/newsletter/unsubscribe/{token}` | Unsubscribe |
| GET | `/newsletter/resubscribe/{token}` | Resubscribe |
| POST | `/newsletter/status` | Check subscription status |
| POST | `/newsletter/unsubscribe-email` | Unsubscribe by email |

---

## 💾 Caching Strategy

### Cache Keys & TTLs

| Cache Key | TTL | Description |
|-----------|-----|-------------|
| `frontend_shared_data` | 5 mins | Topbar, navbar, footer, stories |
| `sections.*` | 60 mins | Page section configurations |
| `blogs.all.*` | 60 mins | Blog listings |
| `programs.all.*` | 60 mins | Program listings |
| `publications.all.*` | 60 mins | Publication listings |
| `job_statistics_*` | 5 mins | Job statistics dashboard |
| `page_map_data` | 5 mins | Page map data |
| `navigation_tree` | 5 mins | Frontend navigation tree |
| `sitemap_urls` | 60 mins | Sitemap URLs |
| `public_job_filters` | 5 mins | Public job filter options |
| `public_job_stats` | 5 mins | Public job statistics |

### Cache Invalidation

Cache is automatically invalidated when:
- CMS content is created/updated/deleted
- Jobs are created/updated/deleted
- Applications are created/updated/deleted
- Shared data is updated
- Roles/permissions are changed
- Manually via `/backend/cache/clear` endpoint

---

## 🔒 Security

### Implemented Security Measures

1. **Authentication & Authorization**
   - Multi-role authentication (Admin/Job Seeker)
   - Google OAuth 2.0 integration
   - Email verification required
   - Role-based permissions (RBAC)

2. **Rate Limiting**
   - API endpoints: 60 requests/minute
   - Login attempts: 5 attempts/minute
   - Password reset: 5 attempts/hour
   - File uploads: 3 attempts/minute
   - Cache operations: 10 attempts/hour

3. **Data Protection**
   - CSRF protection on all forms
   - XSS prevention via Inertia
   - SQL injection prevention via Eloquent
   - File validation (type, size, MIME)
   - Sanitized user input

4. **Audit & Logging**
   - Security logs for authentication events
   - Application logs for CRUD operations
   - ATS calculation logs
   - User activity tracking

5. **Backup & Recovery**
   - Automated database backups
   - File system backups
   - Backup restoration capability

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Feature
php artisan test --testsuite=Unit

# Run with coverage
php artisan test --coverage
```

### Test Structure

```
tests/
├── Feature/
│   ├── Auth/
│   ├── CMS/
│   ├── Jobs/
│   ├── Applications/
│   └── API/
├── Unit/
│   ├── Services/
│   ├── Models/
│   └── Helpers/
└── TestCase.php
```

---

## 🚢 Deployment

### Production Deployment Steps

1. **Set Environment Variables**
   ```bash
   APP_ENV=production
   APP_DEBUG=false
   ```

2. **Install Dependencies**
   ```bash
   composer install --optimize-autoloader --no-dev
   npm install --production
   npm run build
   ```

3. **Migrate Database**
   ```bash
   php artisan migrate --force
   ```

4. **Optimize Application**
   ```bash
   php artisan optimize
   php artisan view:cache
   php artisan route:cache
   php artisan config:cache
   php artisan event:cache
   ```

5. **Set Permissions**
   ```bash
   chmod -R 775 storage bootstrap/cache
   chown -R www-data:www-data .
   ```

6. **Setup Queue Worker**
   ```bash
   sudo supervisorctl reread
   sudo supervisorctl update
   sudo supervisorctl start all
   ```

7. **Setup Cron**
   ```bash
   * * * * * cd /var/www/dus && php artisan schedule:run >> /dev/null 2>&1
   ```

### Recommended Server Configuration

- **Web Server**: Nginx or Apache
- **PHP**: PHP-FPM 8.2+
- **Database**: MySQL 8.0+ with InnoDB
- **Cache**: Redis 6.0+
- **Queue**: Redis with Horizon
- **Storage**: S3 or local with CDN
- **CDN**: Cloudflare or AWS CloudFront

---

## 🤝 Contributing

### Development Workflow

1. **Fork the Repository**
2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit Changes**
   ```bash
   git commit -m "feat: add your feature"
   ```
4. **Push to Branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create Pull Request**

### Coding Standards

- **PHP**: Follow PSR-12 with Laravel Pint
  ```bash
  ./vendor/bin/pint
  ```
- **JavaScript**: Follow ESLint configuration
  ```bash
  npm run lint
  ```
- **CSS**: Follow Tailwind CSS conventions
- **Commit Messages**: Conventional Commits format

### Code Review Checklist

- [ ] PHP unit tests pass
- [ ] JavaScript tests pass
- [ ] No console errors in browser
- [ ] No new warnings/errors in logs
- [ ] All permissions are validated
- [ ] Rate limiting is applied where needed
- [ ] Cache invalidation is implemented
- [ ] Logging is added for critical operations

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Contributors

- **Lead Developer**: [Your Name]
- **Project Manager**: [Project Manager Name]
- **Design**: [Designer Name]

---

## 📌 Documentation Notes

> **Repository-specific values:** Some URLs, contributor names, deployment paths, and credentials in this README are examples/placeholders and should be replaced with the values used by your deployment.

> **Infrastructure:** Redis, Horizon, Sentry, Elasticsearch, and other optional services listed below depend on the deployment environment and are not necessarily required for every local development setup.

## 🙏 Acknowledgments

- **Dwip Unnayan Songstha** – For the opportunity to build this platform
- **Laravel Community** – For the amazing framework
- **React & Inertia Teams** – For the incredible frontend experience
- **All Contributors** – For their time and effort

---

## 📞 Support & Contact

- **Website**: https://dus.org
- **Email**: support@dus.org
- **GitHub Issues**: https://github.com/your-org/dwip-unnayan-songstha/issues

---

<div align="center">
  <p>
    <strong>Built with ❤️ for the communities of Bangladesh</strong>
  </p>
  <p>
    <sub>© 2024 Dwip Unnayan Songstha. All rights reserved.</sub>
  </p>
</div>

---

## 🏷️ Keywords

`NGO` `Job Portal` `ATS` `Laravel` `React` `Inertia` `Bangladesh` `Community Development` `Education` `Healthcare` `Livelihood Support` `Island Development` `Sustainable Development` `RBAC` `CMS` `Applicant Tracking` `Resume Scoring` `Job Listing` `Recruitment` `Employee Management` `Open Source` `PHP 8.2` `Tailwind CSS`
