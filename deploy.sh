#!/bin/bash

# ============================================================
# Laravel Deployment Script
# ============================================================

set -e

# ------------------------------------------------------------
# Configuration
# ------------------------------------------------------------

PROJECT_DIR="$(pwd)"
NODE_PATH="/opt/alt/alt-nodejs22/root/usr/bin"

# Limit native build-tool concurrency for shared hosting.
# The server may fail to create the worker threads used by Go and Rayon.
export GOMAXPROCS=1
export RAYON_NUM_THREADS=1

# ------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------

success() {
    echo ""
    echo "============================================================"
    echo "SUCCESS: $1"
    echo "============================================================"
    echo ""
}

error() {
    echo ""
    echo "============================================================"
    echo "ERROR: $1"
    echo "============================================================"
    echo ""
}

# ------------------------------------------------------------
# Error Handler
# ------------------------------------------------------------

cleanup_on_error() {
    EXIT_CODE=$?

    echo ""
    echo "============================================================"
    echo "DEPLOYMENT FAILED"
    echo "============================================================"
    echo ""
    echo "The deployment encountered an error."
    echo "Bringing Laravel back online..."
    echo ""

    php artisan up || true

    echo ""
    echo "Laravel has been brought back online."
    echo "Exit code: $EXIT_CODE"
    echo ""

    exit "$EXIT_CODE"
}

trap cleanup_on_error ERR

# ------------------------------------------------------------
# Move to project directory
# ------------------------------------------------------------

echo "Project directory:"
echo "$PROJECT_DIR"
echo ""

# ------------------------------------------------------------
# STEP 1 - Put Laravel into maintenance mode
# ------------------------------------------------------------

echo "STEP 1: Enabling maintenance mode..."

php artisan down

success "Laravel is now in maintenance mode."

# ------------------------------------------------------------
# STEP 2 - Git Pull
# ------------------------------------------------------------

echo "STEP 2: Checking Git repository..."

BEFORE_COMMIT=$(git rev-parse HEAD)

echo "Current commit:"
echo "$BEFORE_COMMIT"
echo ""

echo "Running git pull..."

git pull

AFTER_COMMIT=$(git rev-parse HEAD)

echo ""
echo "Previous commit: $BEFORE_COMMIT"
echo "Current commit:  $AFTER_COMMIT"
echo ""

if [ "$BEFORE_COMMIT" = "$AFTER_COMMIT" ]; then
    echo "Repository is already up to date."
else
    echo "New changes have been pulled."
fi

success "Git update completed."

# ------------------------------------------------------------
# STEP 3 - Check Node.js
# ------------------------------------------------------------

echo "STEP 3: Checking Node.js..."

if command -v node >/dev/null 2>&1; then

    echo "Node.js found."

else

    echo "Node.js was not found in the current PATH."
    echo "Adding Node.js 22 path..."

    export PATH="$NODE_PATH:$PATH"

fi

# ------------------------------------------------------------
# Verify Node.js after PATH update
# ------------------------------------------------------------

if ! command -v node >/dev/null 2>&1; then
    error "Node.js could not be found."
    exit 1
fi

echo ""
echo "Node.js version:"
node -v

echo ""
echo "NPM version:"
npm -v

echo ""
echo "GOMAXPROCS:"
echo "$GOMAXPROCS"
echo ""
echo "RAYON_NUM_THREADS:"
echo "$RAYON_NUM_THREADS"

success "Node.js environment is ready."

# ------------------------------------------------------------
# STEP 4 - Install dependencies and fix node_modules permissions
# ------------------------------------------------------------

echo "STEP 4: Installing npm dependencies and fixing permissions..."

if [ -d "node_modules" ]; then

    chmod -R u+rwX node_modules

else

    echo "node_modules does not exist."

fi

npm install --no-audit --no-fund

chmod -R u+rwX node_modules

if [ -f "node_modules/.bin/vite" ]; then
    chmod +x node_modules/.bin/vite
else
    error "Vite executable was not installed."
    exit 1
fi

success "Node modules permissions checked."

# ------------------------------------------------------------
# STEP 5 - Build frontend
# ------------------------------------------------------------

echo "STEP 5: Building frontend..."

echo "Limiting Go concurrency with GOMAXPROCS=$GOMAXPROCS and Rayon concurrency with RAYON_NUM_THREADS=$RAYON_NUM_THREADS."

npm run build

success "Frontend build completed."

# ------------------------------------------------------------
# STEP 6 - Clear Laravel caches
# ------------------------------------------------------------

echo "STEP 6: Clearing Laravel caches..."

php artisan optimize:clear

success "Laravel caches cleared."

# ------------------------------------------------------------
# Clear the dedicated frontend content cache
# ------------------------------------------------------------

echo "Clearing cached frontend content..."

php artisan frontend:clear-cache --all

success "Frontend content cache cleared."

# ------------------------------------------------------------
# STEP 6.5 - Warm up config cache for production
# ------------------------------------------------------------

echo "STEP 6.5: Warming up config cache..."

php artisan config:cache

success "Config cache warmed."

# ------------------------------------------------------------
# STEP 6.6 - Ensure the public storage symlink exists
# ------------------------------------------------------------

echo "STEP 6.6: Ensuring public/storage symlink..."

if [ -L public/storage ] || [ -e public/storage ]; then
    echo "public/storage already exists."
else
    php artisan storage:link
    success "Storage symlink created."
fi

success "Storage symlink checked."

# ------------------------------------------------------------
# STEP 7 - Warm up route cache for production
# ------------------------------------------------------------

echo "STEP 7: Warming up route cache..."

php artisan route:cache

success "Route cache warmed."

# ------------------------------------------------------------
# STEP 8 - Bring Laravel back online
# ------------------------------------------------------------

echo "STEP 8: Bringing Laravel back online..."

php artisan up

success "Deployment completed successfully."

echo ""
echo "============================================================"
echo " DEPLOYMENT FINISHED SUCCESSFULLY"
echo "============================================================"
echo ""