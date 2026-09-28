<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class StaticAssetCache
{
    /**
     * Cache durations in seconds
     */
    private const CACHE_DURATIONS = [
        // Images - 1 year (immutable, versioned via filename)
        'jpg'  => 31536000,
        'jpeg' => 31536000,
        'png'  => 31536000,
        'gif'  => 31536000,
        'webp' => 31536000,
        'svg'  => 31536000,
        'ico'  => 31536000,
        'avif' => 31536000,
        
        // CSS/JS - 1 year (versioned via Vite manifest)
        'css'  => 31536000,
        'js'   => 31536000,
        'mjs'  => 31536000,
        'map'  => 31536000,
        
        // Fonts - 1 year
        'woff'  => 31536000,
        'woff2' => 31536000,
        'ttf'   => 31536000,
        'eot'   => 31536000,
        'otf'   => 31536000,
        
        // Other static assets
        'pdf'  => 31536000,
        'txt'  => 31536000,
        'xml'  => 31536000,
        'json' => 31536000,
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only add cache headers for successful GET/HEAD requests
        if (!in_array($request->method(), ['GET', 'HEAD'])) {
            return $response;
        }

        // Only process successful responses that are not Inertia responses (which are HTML)
        $contentType = $response->headers->get('Content-Type', '');
        if (str_starts_with($contentType, 'text/html')) {
            // Don't cache HTML responses (Inertia pages)
            return $response;
        }

        // Don't process redirects
        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        $path = $request->path();
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $extension = strtolower($extension);

        // Check if this is a static asset we should cache
        $cacheDuration = self::CACHE_DURATIONS[$extension] ?? null;

        if ($cacheDuration !== null) {
            // Set cache headers for immutable assets
            $response->headers->set('Cache-Control', "public, max-age={$cacheDuration}, immutable");
            
            // Add ETag for conditional requests (if not already set)
            if (!$response->headers->has('ETag')) {
                $content = $response->getContent();
                if ($content) {
                    $etag = '"' . md5($content) . '"';
                    $response->headers->set('ETag', $etag);
                    
                    // Handle If-None-Match for 304 responses
                    if ($request->hasHeader('If-None-Match') && $request->header('If-None-Match') === $etag) {
                        $newResponse = response('', 304);
                        $newResponse->headers->set('Cache-Control', "public, max-age={$cacheDuration}, immutable");
                        $newResponse->headers->set('ETag', $etag);
                        return $newResponse;
                    }
                }
            }
        }

        // Security headers for all responses
        $this->addSecurityHeaders($response);

        return $response;
    }

    /**
     * Add security headers to response
     */
    private function addSecurityHeaders(Response $response): void
    {
        // Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // XSS protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        
        // Referrer policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
}