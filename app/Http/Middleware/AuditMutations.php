<?php

namespace App\Http\Middleware;

use App\Services\AuditLogger;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * ============================================================
 *  AUDIT MUTATIONS
 * ============================================================
 *
 * Registered globally, so every mutating controller in the application
 * is audited without each one opting in. That is deliberate: the audit
 * trail must not depend on a developer remembering to log.
 *
 * Only state-changing verbs are recorded, and only after the response is
 * known — so a validation failure or a 500 is not recorded as a
 * successful change. Refusals (401/403) are recorded separately,
 * because "who tried to do what and was blocked" is exactly the kind of
 * thing an audit trail exists to answer.
 *
 * Auditing failures are swallowed: the trail must never break the
 * request it is recording.
 */
class AuditMutations
{
    /** Verbs that can change state. */
    private const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /**
     * Routes that are noise or would recurse.
     *
     * @var array<int, string>
     */
    private const IGNORED_ROUTE_PREFIXES = [
        'backend.audit-logs.export',
        'backend.audit-logs.prune',
    ];

    public function __construct(private readonly AuditLogger $audit) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!in_array($request->method(), self::MUTATING, true)) {
            return $response;
        }

        $routeName = $request->route()?->getName() ?? '';

        foreach (self::IGNORED_ROUTE_PREFIXES as $prefix) {
            if (str_starts_with($routeName, $prefix)) {
                return $response;
            }
        }

        try {
            $this->audit->recordRequest(
                $request,
                $response,
                $this->resolveSubject($request)
            );
        } catch (Throwable $e) {
            report($e);
        }

        return $response;
    }

    /**
     * Best-effort lookup of the model a request is acting on, so the entry
     * can be grouped per record in the UI and diffed field by field.
     *
     * Route-model binding puts the model itself in the parameters when the
     * controller type-hints it; when it only receives an id there is
     * nothing to diff against and the entry is recorded without a subject.
     */
    private function resolveSubject(Request $request): ?Model
    {
        foreach ((array) $request->route()?->parameters() as $parameter) {
            if ($parameter instanceof Model) {
                return $parameter;
            }
        }

        return null;
    }
}
