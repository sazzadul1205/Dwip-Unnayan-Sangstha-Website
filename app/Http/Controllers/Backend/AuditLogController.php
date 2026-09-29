<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * ============================================================
 *  AUDIT TRAIL
 * ============================================================
 *
 * Read-only view over the `audit_logs` table written by the
 * AuditMutations middleware and the auth listeners. Every mutating
 * controller in the application is covered automatically, so this is
 * the one screen that answers "who changed what, when, and from where".
 */
class AuditLogController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        if (!$this->can('audit.view')) {
            return $this->deny('You do not have permission to view the audit trail.');
        }

        return Inertia::render('Backend/AuditLogs/Index', [
            'logs' => $this->query($request)->latest('id')->paginate(50)->withQueryString(),
            'filters' => [
                'event' => $request->input('event', 'all'),
                'user' => $request->input('user', ''),
                'from' => $request->input('from', ''),
                'to' => $request->input('to', ''),
                'search' => $request->input('search', ''),
            ],
            'events' => AuditLog::eventLabels(),
            'actors' => $this->actorOptions(),
            'can' => [
                'export' => $this->can('audit.export'),
                'prune' => $this->can('audit.prune'),
            ],
            'retentionDays' => (int) config('audit.retention_days', 365),
        ]);
    }

    /**
     * The full change set for one entry, for the detail drawer.
     */
    public function show(int $id): JsonResponse
    {
        if (!$this->can('audit.view')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $log = AuditLog::with('user')->find($id);

        if (!$log) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json([
            'log' => $log,
            'changes' => $log->changes(),
        ]);
    }

    /**
     * Stream the filtered trail as CSV.
     */
    public function export(Request $request): StreamedResponse|JsonResponse
    {
        if (!$this->can('audit.export')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $rows = $this->query($request)->latest('id')->limit(10000)->get();

        $filename = 'audit-trail-' . now()->format('Ymd-His') . '.csv';

        app(AuditLogger::class)->record(
            AuditLog::EXPORTED,
            sprintf('Exported %d audit entries', $rows->count()),
            ['new_values' => ['filters' => $this->filterSummary($request)]]
        );

        return response()->streamDownload(function () use ($rows) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['ID', 'When', 'Event', 'User', 'Email', 'Subject', 'Description', 'Route', 'Method', 'Status', 'IP', 'URL']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->id,
                    $row->created_at?->toDateTimeString(),
                    $row->event,
                    $row->user_name,
                    $row->user_email,
                    $row->subject_type ? class_basename($row->subject_type) . '#' . $row->subject_id : '',
                    $row->description,
                    $row->route_name,
                    $row->method,
                    $row->status_code,
                    $row->ip_address,
                    $row->url,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Statistics for the header cards.
     */
    public function stats(): JsonResponse
    {
        if (!$this->can('audit.view')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $counts = AuditLog::selectRaw('event, COUNT(*) as total')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('event')
            ->pluck('total', 'event')
            ->all();

        return response()->json([
            'total' => AuditLog::count(),
            'last30Days' => array_sum($counts),
            'byEvent' => $counts,
            'lastEntryAt' => AuditLog::max('created_at'),
        ]);
    }

    /* ==========================================================
     |  INTERNALS
     *========================================================== */

    private function query(Request $request)
    {
        return AuditLog::query()
            ->ofEvent($request->input('event', 'all'))
            ->forUser($request->input('user') ?: null)
            ->betweenDates($request->input('from') ?: null, $request->input('to') ?: null)
            ->matching($request->input('search') ?: null);
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function actorOptions(): array
    {
        return User::query()
            ->whereExists(fn ($q) => $q->selectRaw(1)->from('audit_logs')->whereColumn('audit_logs.user_id', 'users.id'))
            ->orderBy('name')
            ->limit(100)
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function filterSummary(Request $request): array
    {
        return array_filter([
            'event' => $request->input('event') ?: null,
            'user' => $request->input('user') ?: null,
            'from' => $request->input('from') ?: null,
            'to' => $request->input('to') ?: null,
            'search' => $request->input('search') ?: null,
        ]);
    }

    private function can(string $permission): bool
    {
        $user = Auth::user();

        return $user && method_exists($user, 'hasPermission') && $user->hasPermission($permission);
    }

    private function deny(string $message): RedirectResponse
    {
        return redirect()->route('unauthorized.access')->with('error', $message);
    }
}
