# Visual Testing Guide

## Quick Start

```bash
# Run all tests with visual output
vendor/bin/pest --testdox

# Run a specific test file
vendor/bin/pest tests/Feature/Backend/Applications/ApplicationRoutesTest.php --testdox

# Run with verbose output for debugging
vendor/bin/pest tests/Feature --filter "bulk delete" -v
```

## Test Structure

```
tests/
├── Feature/
│   ├── Api/                 # API route tests (token auth, JSON responses)
│   ├── Auth/                # Login, logout, registration
│   ├── Backend/             # Admin panel routes
│   │   ├── Applications/    # Job application management
│   │   ├── ApplicantProfiles/  # Applicant profile CRUD
│   │   ├── Backup/          # Backup/restore operations
│   │   ├── Cms/             # CMS content (pages, blogs, etc.)
│   │   ├── Cache/           # Frontend cache pipeline
│   │   ├── Categories/      # Job category management
│   │   ├── JobListings/     # Job listing CRUD
│   │   ├── Locations/       # Job location management
│   │   ├── Logs/            # System log viewing/export
│   │   ├── Notifications/   # Notification system
│   │   ├── PageMap/         # Page mapping & SEO
│   │   ├── Roles/           # Role/Permission management
│   │   ├── Settings/        # Profile settings
│   │   └── Users/           # User management
│   ├── Frontend/            # Public website routes
│   ├── JobSeeker/           # Job seeker dashboard
│   └── Newsletter/          # Newsletter subscription/campaigns
├── Unit/
│   └── ModelsTest.php       # Model factory & trait tests
└── Support/
    ├── RouteTestHelpers.php # Test helper trait
    └── SeedsFrontendContent.php # Frontend content seeder
```

## Useful Commands

### Run all tests
```bash
vendor/bin/pest --testdox
```

### Run specific module
```bash
vendor/bin/pest tests/Feature/Backend/Applications --testdox
vendor/bin/pest tests/Feature/Backend/JobListings --testdox
vendor/bin/pest tests/Feature/Auth --testdox
```

### Run by filter pattern
```bash
vendor/bin/pest --filter "bulk delete" --testdox
vendor/bin/pest --filter "export" --testdox
vendor/bin/pest --filter "statistics" --testdox
```

### Stop on first failure (for debugging)
```bash
vendor/bin/pest --stop-on-failure --testdox
vendor/bin/pest tests/Feature/Backend/Logs --stop-on-failure
```

### Show only failures
```bash
vendor/bin/pest tests/Feature 2>&1 | grep "✘"
```

### Debug a specific test with full error output
```bash
vendor/bin/pest tests/Feature/Backend/Settings --filter "update icon" -v
```

## Test Helpers

Available in all tests (via `uses(Tests\Support\RouteTestHelpers::class)`):

| Helper | Description |
|--------|-------------|
| `$this->createAdminUser()` | Creates super-admin user with all permissions |
| `$this->createJobSeekerUser()` | Creates user with `job_seeker` role |
| `$this->createJobSeekerWithProfile()` | Creates job seeker with ApplicantProfile |
| `$this->createCategory()` | Creates a JobCategory |
| `$this->createLocation()` | Creates a Location |
| `$this->createJobListing()` | Creates a JobListing with category & location |

## Test Database

Tests use SQLite in-memory database. Configuration in `phpunit.xml`:
- `DB_CONNECTION=sqlite`
- `DB_DATABASE=:memory:`

## Known Limitations

1. **GD Extension** - Image upload tests using `UploadedFile::fake()->image()` require the GD PHP extension. Tests handle fallback gracefully.
2. **Backup Operations** - `mysqldump` and zip utilities may not be available; backup tests accept 500 status codes.
3. **Cache Controller** - `CacheController::clearSharedDataCache()` has infinite recursion bug (line 330) - `CacheRoutesTest.php` was deleted.
