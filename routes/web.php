<?php

// ============================================
// MAIN ROUTES: WEB.PHP
// ============================================
// This file imports all route groups
// ============================================

// ============================================
// SECTION 1: PUBLIC DATA API ROUTES
// URL: /data/*, /api/*
// ============================================
require __DIR__ . '/api.php';

// ============================================
// SECTION 1.5: NEWSLETTER ROUTES (ADD THIS)
// URL: /newsletter/*
// ============================================
require __DIR__ . '/newsletter.php';

// ============================================
// SECTION 2: PUBLIC FRONTEND ROUTES
// URL: /* (catch-all for public pages)
// ============================================
require __DIR__ . '/public.php';

// ============================================
// SECTION 3: AUTHENTICATION ROUTES
// URL: /login, /register, /auth/*
// ============================================
require __DIR__ . '/auth.php';

// ============================================
// SECTION 4: AUTHENTICATED JOB SEEKER ROUTES
// URL: /seeker/*, /profile/*, /complete-profile
// ============================================
require __DIR__ . '/job-seeker.php';

// ============================================
// SECTION 5: ADMIN/BACKEND ROUTES
// URL: /dashboard, /backend/*
// ============================================
require __DIR__ . '/admin/dashboard.php';

// ============================================
// SECTION 6: FALLBACK ROUTE (MUST BE AT THE END)
// ============================================
require __DIR__ . '/fallback.php';

// ============================================
// SECTION 7: ADMIN/BACKEND PAGE MAP ROUTES
// URL: /backend/page-map/*
// ============================================
require __DIR__ . '/admin/page-map.php';
