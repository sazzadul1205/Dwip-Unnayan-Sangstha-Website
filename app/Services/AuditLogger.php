<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * ============================================================
 *  AUDIT LOGGER
 * ============================================================
 *
 * The single writer for the `audit_logs` table. Two things happen here
 * that the file-based SimpleLogger cannot do:
 *
 *   1. Redaction — credentials never reach the trail.
 *   2. Diffing — an update stores only the fields that actually
 *      changed, with their before and after values.
 *
 * Recording is best-effort: a failure here must never take down the
 * request that is being audited, so every write is guarded.
 */
class AuditLogger
{
    /**
     * Input keys whose values are never stored. Compared lowercased
     * against each key, so `Password` and `password` both match.
     *
     * @var array<int, string>
     */
    private const REDACTED_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'new_password_confirmation',
        'old_password',
        'token',
        'remember_token',
        'api_token',
        'access_token',
        'refresh_token',
        'secret',
        'client_secret',
        'otp',
        'otp_code',
        'verification_code',
        'code',
        'cv_password',
        '_token',
        'authorization',
        'x-csrf-token',
    ];

    /**
     * Substrings that mark a key as sensitive regardless of exact match.
     *
     * @var array<int, string>
     */
    private const REDACTED_FRAGMENTS = ['password', 'secret', 'token'];

    /**
     * Model attributes excluded from an update diff. Timestamp churn and
     * cached payloads would drown the useful signal.
     *
     * @var array<int, string>
     */
    private const DIFF_IGNORED = [
        'updated_at',
        'created_at',
        'deleted_at',
        'remember_token',
        'password',
        'password_confirmation',
    ];

    /**
     * Guard so a single request never writes an unbounded number of rows
     * (a loop that saves 500 records makes one entry, not 500).
     */
    private int $writesThisRequest = 0;

    private const MAX_WRITES_PER_REQUEST = 25;

    /**
     * Resolved once per instance (a new instance is built per request) so
     * a big batch does not re-probe the schema on every write.
     */
    private ?bool $available = null;

    /**
     * Resolve whether the trail is usable at all. During the very first
     * migration run (or a test that has not migrated yet) this is false
     * and recording becomes a no-op instead of an error.
     */
    private function available(): bool
    {
        if ($this->available === null) {
            try {
                $this->available = Schema::hasTable('audit_logs');
            } catch (Throwable) {
                $this->available = false;
            }
        }

        return $this->available;
    }

    /**
     * Write one entry. Returns null when auditing is unavailable or the
     * write failed.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function record(string $event, string $description, array $attributes = []): ?AuditLog
    {
        if (!$this->available() || $this->writesThisRequest >= self::MAX_WRITES_PER_REQUEST) {
            return null;
        }

        $oldValues = $attributes['old_values'] ?? null;
        $newValues = $attributes['new_values'] ?? null;

        $this->writesThisRequest++;

        $actor = $attributes['user'] ?? $this->currentUser();
        unset($attributes['user']);

        // old_values / new_values are normalised below, so they must not be
        // able to overwrite the redacted versions via the spread.
        unset($attributes['old_values'], $attributes['new_values']);

        try {
            return AuditLog::create([
                ...$attributes,
                'event' => $event,
                'description' => $this->truncate($description, 1000),
                'user_id' => $actor?->getKey(),
                'user_name' => $actor?->name,
                'user_email' => $actor?->email,
                'route_name' => $attributes['route_name'] ?? request()?->route()?->getName(),
                'method' => $attributes['method'] ?? request()?->method() ?? 'SYSTEM',
                'url' => $this->truncate($attributes['url'] ?? request()?->fullUrl(), 500),
                'ip_address' => $attributes['ip_address'] ?? request()?->ip(),
                'user_agent' => $this->truncate(request()?->userAgent(), 500),
                'old_values' => $this->normalise($oldValues),
                'new_values' => $this->normalise($newValues),
            ]);
        } catch (Throwable $e) {
            // Auditing must never break the operation being audited.
            report($e);

            return null;
        }
    }

    /**
     * Record the outcome of a mutating HTTP request.
     *
     * Called by the middleware once the response is known, so a rejected
     * validation never looks like a successful change.
     */
    public function recordRequest(Request $request, Response $response, ?Model $subject = null): ?AuditLog
    {
        $routeName = $request->route()?->getName() ?? 'unknown';
        $statusCode = $response->getStatusCode();

        // A 403 is the interesting case: somebody was signed in and was
        // refused. A 401 only means "not signed in", which is noise, and
        // anything higher is a failure rather than a change.
        //
        // This codebase refuses most requests by redirecting to the
        // unauthorized page rather than aborting, so that counts too.
        if ($statusCode === 403 || $this->wasRefused($request, $response)) {
            return $this->record(
                AuditLog::DENIED,
                sprintf('%s %s was refused (%d)', $request->method(), $request->path(), $statusCode),
                [
                    'route_name' => $routeName,
                    'method' => $request->method(),
                    'status_code' => $statusCode,
                    'new_values' => $this->redact($request->except(['_token'])),
                ]
            );
        }

        // Anything at or above 400 never reached a successful change.
        if ($statusCode >= 400) {
            return null;
        }

        $event = $this->eventForRoute($routeName, $request->method());
        $payload = $this->redact($request->except(['_token']));
        $label = $this->subjectLabel($subject, $routeName);

        // A redirect back carrying validation errors is a rejected
        // submission, not a change, even though the status is 302.
        if ($this->wasRejected($request)) {
            return null;
        }

        // For an update the model's "original" holds the pre-request state.
        $old = $subject?->exists ? $subject->getOriginal() : null;

        if ($event === AuditLog::UPDATED && is_array($old)) {
            $diff = $this->diff($old, $payload);

            // A no-op update (re-saving identical data) is not a change.
            if ($diff === []) {
                return null;
            }

            return $this->record(
                $event,
                sprintf('Updated %s #%s (%d field%s changed)', $label, $subject?->getKey(), count($diff), count($diff) === 1 ? '' : 's'),
                [
                    'route_name' => $routeName,
                    'method' => $request->method(),
                    'status_code' => $statusCode,
                    'subject_type' => $subject ? $subject::class : null,
                    'subject_id' => $subject?->getKey(),
                    'old_values' => array_map(fn (array $pair) => $pair['old'], $diff),
                    'new_values' => array_map(fn (array $pair) => $pair['new'], $diff),
                ]
            );
        }

        return $this->record(
            $event,
            sprintf(
                '%s %s %s',
                ucfirst(str_replace('_', ' ', $event)),
                $label,
                $subject?->getKey() ? '#' . $subject->getKey() : ''
            ),
            [
                'route_name' => $routeName,
                'method' => $request->method(),
                'status_code' => $statusCode,
                'subject_type' => $subject ? $subject::class : null,
                'subject_id' => $subject?->getKey(),
                'new_values' => $payload,
            ]
        );
    }

    /**
     * Record an authentication event.
     */
    public function recordAuth(string $event, ?User $user, string $description, array $context = []): ?AuditLog
    {
        return $this->record($event, $description, [
            'user' => $user,
            ...$context,
        ]);
    }

    /**
     * Map a route to an audit event, preferring the route action name and
     * falling back to the HTTP method.
     */
    public function eventForRoute(string $routeName, string $method): string
    {
        $action = Str::of($routeName)->afterLast('.')->lower()->toString();

        $map = [
            'store' => AuditLog::CREATED,
            'create' => AuditLog::CREATED,
            'update' => AuditLog::UPDATED,
            'edit' => AuditLog::UPDATED,
            'toggle' => AuditLog::UPDATED,
            'bulk-update' => AuditLog::UPDATED,
            'destroy' => AuditLog::DELETED,
            'delete' => AuditLog::DELETED,
            'bulk-delete' => AuditLog::DELETED,
            'restore' => AuditLog::RESTORED,
            'force-delete' => AuditLog::FORCE_DELETED,
            'force-delete-bulk' => AuditLog::FORCE_DELETED,
            'export' => AuditLog::EXPORTED,
        ];

        if (isset($map[$action])) {
            return $map[$action];
        }

        return match ($method) {
            'POST' => AuditLog::CREATED,
            'PUT', 'PATCH' => AuditLog::UPDATED,
            'DELETE' => AuditLog::DELETED,
            default => AuditLog::UPDATED,
        };
    }

    /**
     * Only the fields that actually changed, before -> after.
     *
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function diff(array $before, array $after): array
    {
        $changed = [];

        foreach ($after as $key => $value) {
            if (in_array($key, self::DIFF_IGNORED, true)) {
                continue;
            }

            $old = $before[$key] ?? null;

            if ($this->normaliseValue($old) === $this->normaliseValue($value)) {
                continue;
            }

            $changed[$key] = ['old' => $old, 'new' => $value];
        }

        return $changed;
    }

    /**
     * Recursively replace sensitive values with a placeholder.
     *
     * @param  array<mixed>  $payload
     * @return array<mixed>
     */
    public function redact(array $payload): array
    {
        $clean = [];

        foreach ($payload as $key => $value) {
            if (is_array($value)) {
                $clean[$key] = $this->redact($value);

                continue;
            }

            if (is_string($key) && $this->isSensitive($key)) {
                $clean[$key] = '[redacted]';

                continue;
            }

            // Long opaque strings and uploaded files are never useful in a
            // diff and bloat the row.
            if (is_string($value) && (strlen($value) > 255 || str_starts_with($value, 'data:'))) {
                $clean[$key] = '[omitted]';

                continue;
            }

            $clean[$key] = $value;
        }

        return $clean;
    }

    public function isSensitive(string $key): bool
    {
        $normalised = strtolower(str_replace('-', '_', $key));

        if (in_array($normalised, self::REDACTED_KEYS, true)) {
            return true;
        }

        foreach (self::REDACTED_FRAGMENTS as $fragment) {
            if (str_contains($normalised, $fragment)) {
                return true;
            }
        }

        foreach ((array) config('audit.redacted_keys', []) as $configured) {
            if ($normalised === strtolower((string) $configured)) {
                return true;
            }
        }

        return false;
    }

    private function subjectLabel(?Model $subject, string $routeName = ''): string
    {
        if ($subject) {
            return trim(preg_replace('/(?<!^)[A-Z]/', ' $0', class_basename($subject)) ?? class_basename($subject));
        }

        // No model to name, so fall back to the resource segment of the
        // route: `backend.cms.blogs.store` reads as "Blog".
        $segments = explode('.', $routeName);
        array_pop($segments); // the action
        $resource = end($segments);

        if (! $resource || in_array($resource, ['backend', 'admin', 'api'], true)) {
            return 'Record';
        }

        return ucfirst(rtrim(Str::singular(str_replace('-', '_', $resource)), 's'));
    }

    /**
     * True when the request bounced back with a validation error bag, which
     * Laravel also signals with a 302 — so the status code alone cannot
     * distinguish "saved" from "rejected".
     */
    private function wasRejected(Request $request): bool
    {
        try {
            return $request->hasSession() && $request->session()->has('errors');
        } catch (Throwable) {
            return false;
        }
    }

    /**
     * True when the response bounced the user to the unauthorized page,
     * which is how most permission checks in this app refuse a request
     * (they redirect rather than abort with 403).
     */
    private function wasRefused(Request $request, Response $response): bool
    {
        if (! $response->isRedirection()) {
            return false;
        }

        return rtrim((string) $response->headers->get('Location'), '/')
            === rtrim(route('unauthorized.access'), '/');
    }

    private function currentUser(): ?User
    {
        try {
            return auth()->user();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array<mixed>|null
     */
    private function normalise(mixed $values): ?array
    {
        if ($values === null) {
            return null;
        }

        return is_array($values) ? $this->redact($values) : null;
    }

    private function normaliseValue(mixed $value): mixed
    {
        if (is_bool($value)) {
            return $value ? 1 : 0;
        }

        if (is_scalar($value) || $value === null) {
            return (string) $value;
        }

        return json_encode($value);
    }

    private function truncate(?string $value, int $length): ?string
    {
        if ($value === null) {
            return null;
        }

        return mb_strlen($value) > $length ? mb_substr($value, 0, $length - 1) . '…' : $value;
    }
}
