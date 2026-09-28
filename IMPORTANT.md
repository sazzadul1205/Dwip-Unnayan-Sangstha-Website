# ⚠️ IMPORTANT: Production Setup Requirements

## Required PHP Extensions

### **GD Extension (Required for Image Optimization)**

The CMS uses `intervention/image` for automatic image optimization (resize, WebP conversion). This **requires the GD PHP extension**.

#### Enable GD:

```bash
# Ubuntu/Debian
apt-get update && apt-get install -y php8.3-gd  # or php8.2-gd, php8.1-gd
systemctl restart php8.3-fpm

# Alpine (Docker)
apk add --no-cache php83-gd
# or for generic PHP
docker-php-ext-install gd
```

#### Verify:
```bash
php -m | grep -i gd
# Should output: gd
```

#### Without GD:
- ✅ Images still upload and display
- ❌ No auto-resize (>1920px)
- ❌ No JPEG/PNG → WebP conversion
- ⚠️ Logs: "GD extension not available, skipping image optimization"

---

## Static Asset Caching

Apply the `static.cache` middleware to serve static assets with long-term caching:

```php
// routes/web.php
Route::middleware('static.cache')->group(function () {
    Route::get('/storage/{path}', function ($path) {
        return Storage::disk('public')->response($path);
    })->where('path', '.*');
});
```

This adds:
- `Cache-Control: public, max-age=31536000, immutable` (1 year)
- `ETag` for 304 responses
- Security headers

---

## Storage Symlink (Required)

```bash
php artisan storage:link
```

Without this, `/storage/*` URLs will 404.

---

## Queue Worker (Required for Emails/Background Jobs)

```bash
# Supervisor config example
[program:dus-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/dus/artisan queue:work --queue=default,emails --sleep=3 --tries=3
autostart=true
autorestart=true
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/dus/storage/logs/worker.log
```

---

## Cron Scheduler (Required)

```bash
* * * * * cd /var/www/dus && php artisan schedule:run >> /dev/null 2>&1
```

---

## File Permissions (Required)

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data /var/www/dus
```

---

## Environment Variables Checklist

```env
# Required for production
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dus_db
DB_USERNAME=dus_user
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="Dwip Unnayan Songstha"

# Storage
FILESYSTEM_DISK=public
STORAGE_URL=https://your-domain.com/storage

# Google OAuth (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

---

## Quick Verification Checklist

After deployment, verify:

- [ ] `php -m | grep -i gd` shows `gd`
- [ ] `php artisan storage:link` works
- [ ] `/storage/editor-images/test.png` loads with `Cache-Control: max-age=31536000`
- [ ] `php artisan queue:work` processes jobs
- [ ] `php artisan schedule:run` executes without errors
- [ ] Admin can upload images in CMS editor
- [ ] Images display on frontend with WebP format (check Network tab)
- [ ] 352+ tests pass: `php artisan test`