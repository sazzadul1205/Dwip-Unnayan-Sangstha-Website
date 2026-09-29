<?php

namespace App\Console\Commands;

use App\Services\SimpleLogger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Logs are append-only, so without pruning the files grow without bound.
 * This command trims each log file to keep only entries within the
 * retention window, mirroring the audit:prune command's approach.
 */
class PruneSystemLogs extends Command
{
    protected $signature = 'logs:prune
                            {--days= : Delete entries older than this many days (default: config value)}
                            {--dry-run : Report what would be pruned without deleting it}';

    protected $description = 'Trim system log files to the configured retention window';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: config('system-logs.retention_days', 90));

        if ($days < 1) {
            $this->error('Retention must be at least one day.');

            return self::INVALID;
        }

        $logTypes = (array) config('system-logs.log_types', []);
        $cutoff = now()->subDays($days);
        $cutoffTs = $cutoff->getTimestamp();

        $totalPruned = 0;
        $filesPruned = [];

        foreach (array_keys($logTypes) as $type) {
            $filePath = storage_path("logs/{$type}.log");

            if (!file_exists($filePath)) {
                continue;
            }

            $kept = [];
            $pruned = 0;

            $handle = fopen($filePath, 'r');

            if ($handle === false) {
                continue;
            }

            while (($line = fgets($handle)) !== false) {
                $line = trim($line);

                if ($line === '') {
                    continue;
                }

                preg_match('/\[(.*?)\]/', $line, $matches);

                if (empty($matches)) {
                    $kept[] = $line;
                    continue;
                }

                $entryTs = strtotime($matches[1]);

                if ($entryTs === false) {
                    $kept[] = $line;
                    continue;
                }

                if ($entryTs < $cutoffTs) {
                    $pruned++;
                } else {
                    $kept[] = $line;
                }
            }

            fclose($handle);

            if ($pruned > 0) {
                $filesPruned[$type] = $pruned;
                $totalPruned += $pruned;

                if (!$this->option('dry-run')) {
                    file_put_contents($filePath, implode("\n", $kept) . "\n", LOCK_EX);
                }
            }
        }

        if ($totalPruned === 0) {
            $this->info("Nothing to prune — every entry is inside the {$days}-day window.");

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            foreach ($filesPruned as $type => $count) {
                $this->line("Would prune {$count} entr" . ($count === 1 ? 'y' : 'ies') . " from {$type}.log");
            }
            $this->line("Total: {$totalPruned} entries across " . count($filesPruned) . " file(s).");

            return self::SUCCESS;
        }

        foreach ($filesPruned as $type => $count) {
            $this->line("Pruned {$count} entr" . ($count === 1 ? 'y' : 'ies') . " from {$type}.log");
        }

        $this->info("Pruned {$totalPruned} entries older than {$cutoff->toDateTimeString()}.");

        SimpleLogger::system(
            "🧹 Auto-pruned {$totalPruned} log entries older than {$days} days",
            [
                'days' => $days,
                'files' => $filesPruned,
                'total_pruned' => $totalPruned,
            ]
        );

        return self::SUCCESS;
    }
}
