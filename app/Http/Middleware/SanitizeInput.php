<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Patterns to detect potential SQL injection attempts
     */
    private array $sqlPatterns = [
        '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i',
        '/(\b(OR|AND)\s+\d+\s*=\s*\d+)/i',
        '/(\bUNION\s+(ALL\s+)?SELECT)/i',
        '/(--|\#|\/\*|\*\/)/',
        '/(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR|ONCLICK)\b)/i',
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
        // Sanitize input data
        $this->sanitize($request->query);
        $this->sanitize($request->request);
        $this->sanitize($request->json()->all());

        return $next($request);
    }

    private function sanitize($input): void
    {
        if (!is_array($input)) {
            return;
        }

        foreach ($input as $key => $value) {
            // Skip certain fields that may contain HTML
            if (in_array($key, $this->skipFields, true)) {
                continue;
            }

            if (is_array($value)) {
                $this->sanitize($value);
            } elseif (is_string($value)) {
                // Check for potential injection patterns
                if ($this->containsMaliciousPattern($value)) {
                    // Log the attempt but don't block (to avoid false positives)
                    logger()->warning('Potential injection attempt detected', [
                        'ip' => request()->ip(),
                        'url' => request()->fullUrl(),
                        'field' => $key,
                        'value' => substr($value, 0, 200),
                        'user_agent' => request()->userAgent(),
                    ]);
                }
            }
        }
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
}