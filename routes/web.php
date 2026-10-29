<?php

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
// SECTION 2: AUTHENTICATION ROUTES
// URL: /login, /register, /auth/*
// ============================================
require __DIR__ . '/auth.php';

// ============================================
// SECTION 3: AUTHENTICATED JOB SEEKER ROUTES
// URL: /seeker/*, /profile/*, /complete-profile
// ============================================
require __DIR__ . '/job-seeker.php';

// ============================================
// SECTION 4: ADMIN/BACKEND ROUTES
// URL: /dashboard, /backend/*
// ============================================
require __DIR__ . '/admin/dashboard.php';

// ============================================
// SECTION 5: EMAIL TEMPLATE EDITOR ROUTES
// URL: /backend/email-templates/*
// ============================================
require __DIR__ . '/admin/email-templates.php';

// ============================================
// SECTION 6: AUDIT TRAIL ROUTES
// URL: /backend/audit-logs/*
// ============================================
require __DIR__ . '/admin/audit-logs.php';

// ============================================
// SECTION 7: ASSET / IMAGE MANAGEMENT
// URL: /backend/assets/*
// ============================================
require __DIR__ . '/admin/assets.php';

// ============================================
// SECTION 8: ADMIN/BACKEND PAGE MAP ROUTES
// URL: /backend/page-map/*
// ============================================
require __DIR__ . '/admin/page-map.php';

// ============================================
// SECTION 9: PUBLIC FRONTEND ROUTES (catch-all must be near end)
// URL: /* (catch-all for public pages)
// ============================================
require __DIR__ . '/public.php';

// ============================================
// SECTION 10: FALLBACK ROUTE (MUST BE AT THE VERY END)
// ============================================
require __DIR__ . '/fallback.php';
