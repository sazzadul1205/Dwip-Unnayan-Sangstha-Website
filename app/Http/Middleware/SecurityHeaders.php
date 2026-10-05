<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Prevent clickjacking
        $response->headers->set('X-Frame-Options', 'DENY');

        // XSS Protection (legacy but still useful for older browsers)
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Permissions Policy (restrict browser features)
        $response->headers->set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');

        // HSTS - only in production with HTTPS
        if (app()->environment('production') && $request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Content Security Policy
        $csp = $this->buildCspPolicy();
        $response->headers->set('Content-Security-Policy', $csp);

        // Remove server header
        $response->headers->remove('Server');

        // Remove X-Powered-By header
        $response->headers->remove('X-Powered-By');

        return $response;
    }

    /**
     * Extra CSP sources for local development, where Vite serves the bundle from
     * its own origin. Override with VITE_DEV_CSP_SOURCES when the dev server runs
     * on a different host or port — Vite auto-increments when 5173 is taken.
     *
     * IPv4 literals are accepted by the CSP host-source grammar, but bracketed
     * IPv6 literals ("http://[::1]:5173") are not and are silently ignored by the
     * browser. The Vite server is therefore pinned to IPv4 (see vite.config.js)
     * instead of trying to allow "[::1]" here.
     */
    private function buildDevSources(): string
    {
        $configured = env('VITE_DEV_CSP_SOURCES');

        if (is_string($configured) && trim($configured) !== '') {
            return trim($configured);
        }

        return 'http://localhost:5173 http://127.0.0.1:5173 ws://localhost:5173 ws://127.0.0.1:5173';
    }

    private function buildCspPolicy(): string
    {
        $isProduction = app()->environment('production');

        // In local development Vite serves the app bundle from its own origin
        // (default http://localhost:5173) and hot-reloads over a WebSocket, so
        // that origin has to be allowed explicitly — 'self' only covers the
        // Laravel host. These are never added in production.
        $devSources = $isProduction ? '' : ' ' . $this->buildDevSources();

        $directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://cdn.tailwindcss.com".$devSources,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net https://cdn.jsdelivr.net https://unpkg.com".$devSources,
            "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.bunny.net https://cdn.jsdelivr.net https://unpkg.com".$devSources,
            "font-src 'self' data: https://fonts.gstatic.com https://fonts.bunny.net https://cdn.jsdelivr.net".$devSources,
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.mapbox.com https://*.mapbox.com".$devSources,
            // Third-party embeds: the video gallery (VideoGallerySection) and
            // the office map (AddressSection). Each iframe is governed by its
            // own origin's policy once loaded, so only the frame itself needs
            // to be permitted here.
            "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://maps.google.com https://www.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ];

        if ($isProduction) {
            $directives[] = "upgrade-insecure-requests";
            $directives[] = "block-all-mixed-content";
        }

        return implode('; ', $directives);
    }
}