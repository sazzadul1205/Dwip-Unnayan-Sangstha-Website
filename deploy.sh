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
    echo "Node version:"
    node -v

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

success "Node.js environment is ready."

# ------------------------------------------------------------
# STEP 4 - Fix node_modules permissions
# ------------------------------------------------------------

echo "STEP 4: Fixing node_modules permissions..."

if [ -d "node_modules" ]; then

    chmod -R u+rwX node_modules

    if [ -f "node_modules/.bin/vite" ]; then
        chmod +x node_modules/.bin/vite
        echo "Vite executable permission fixed."
    else
        echo "WARNING: node_modules/.bin/vite does not exist."
    fi

else

    echo "node_modules does not exist."

    echo "Installing npm dependencies..."

    npm install

    chmod -R u+rwX node_modules

    if [ -f "node_modules/.bin/vite" ]; then
        chmod +x node_modules/.bin/vite
    fi

fi

success "Node modules permissions checked."

# ------------------------------------------------------------
# STEP 5 - Build frontend
# ------------------------------------------------------------

echo "STEP 5: Building frontend..."

npm run build

success "Frontend build completed."

# ------------------------------------------------------------
# STEP 6 - Clear Laravel caches
# ------------------------------------------------------------

echo "STEP 6: Clearing Laravel caches..."

php artisan optimize:clear

success "Laravel caches cleared."

# ------------------------------------------------------------
# STEP 7 - Bring Laravel back online
# ------------------------------------------------------------

echo "STEP 7: Bringing Laravel back online..."

php artisan up

success "Deployment completed successfully."

echo ""
echo "============================================================"
echo " DEPLOYMENT FINISHED SUCCESSFULLY"
echo "============================================================"
echo ""

