<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Services\AuditLogger;
use Illuminate\Console\Command;

/**
 * The audit trail is append-only, so without pruning it becomes the
 * largest table in the database. This keeps a configurable window.
 */
class PruneAuditLogs extends Command
{
    protected $signature = 'audit:prune
                            {--days= : Delete entries older than this many days (default: config value)}
                            {--dry-run : Report what would be deleted without deleting it}';

    protected $description = 'Delete audit trail entries older than the retention window';

    public function handle(AuditLogger $audit): int
    {
        $days = (int) ($this->option('days') ?: config('audit.retention_days', 365));

        if ($days < 1) {
            $this->error('Retention must be at least one day.');

            return self::INVALID;
        }

        $cutoff = now()->subDays($days);
        $count = AuditLog::where('created_at', '<', $cutoff)->count();

        if ($count === 0) {
            $this->info("Nothing to prune — every entry is inside the {$days}-day window.");

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->line("Would delete {$count} entr" . ($count === 1 ? 'y' : 'ies') . " older than {$cutoff->toDateTimeString()}.");

            return self::SUCCESS;
        }

        AuditLog::where('created_at', '<', $cutoff)->delete();

        // Recorded after the delete so the notice itself survives this run.
        $audit->record(
            AuditLog::PRUNED,
            sprintf('Pruned %d audit entries older than %d days', $count, $days)
        );

        $this->info("Pruned {$count} audit entries older than {$cutoff->toDateTimeString()}.");

        return self::SUCCESS;
    }
}
