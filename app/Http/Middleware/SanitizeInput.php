<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Patterns to detect potential SQL injection attempts
     * Refined to reduce false positives - focus on SQL comment sequences and UNION patterns
     */
    private array $sqlPatterns = [
        '/(\bUNION\s+(ALL\s+)?SELECT\b)/i',
        '/(--|\#|\/\*|\*\/)/',
        '/(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR|ONCLICK)\b)/i',
        '/(\b(OR|AND)\s+\d+\s*=\s*\d+)/i',
    ];

    /**
     * Fields to skip sanitization (e.g., rich text editors)
     */
    private array $skipFields = [
        'content',
        'html',
        'description',
        'body',
        'editor_content',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Check input data for malicious patterns
        if ($this->checkForMaliciousInput($request->query)) {
            return $this->blockRequest($request, 'query parameters');
        }
        if ($this->checkForMaliciousInput($request->request)) {
            return $this->blockRequest($request, 'request body');
        }
        if ($this->checkForMaliciousInput($request->json()->all())) {
            return $this->blockRequest($request, 'JSON payload');
        }

        return $next($request);
    }

    private function checkForMaliciousInput($input): bool
    {
        if (!is_array($input)) {
            return false;
        }

        foreach ($input as $key => $value) {
            // Skip certain fields that may contain HTML/SQL-like content
            if (in_array($key, $this->skipFields, true)) {
                continue;
            }

            if (is_array($value)) {
                if ($this->checkForMaliciousInput($value)) {
                    return true;
                }
            } elseif (is_string($value) && $this->containsMaliciousPattern($value)) {
                logger()->warning('Malicious input blocked', [
                    'ip' => request()->ip(),
                    'url' => request()->fullUrl(),
                    'field' => $key,
                    'value' => substr($value, 0, 200),
                    'user_agent' => request()->userAgent(),
                ]);
                return true;
            }
        }
        return false;
    }

    private function containsMaliciousPattern(string $value): bool
    {
        foreach ($this->sqlPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        return false;
    }

    private function blockRequest(Request $request, string $location): Response
    {
        return response()->json([
            'message' => 'Request blocked due to suspicious input in ' . $location,
            'error' => 'Invalid input detected',
        ], 400);
    }
}