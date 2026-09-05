<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ClearLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'logs:clear 
                            {--backup : Create a backup of the current log file before clearing}
                            {--days=7 : Number of days to keep in the backup (default: 7)}
                            {--all : Clear all log files including old log files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all Laravel log files and create a fresh start for testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $logPath = storage_path('logs');
        $backupOption = $this->option('backup');
        $daysToKeep = (int) $this->option('days');
        $clearAll = $this->option('all');

        if (!File::exists($logPath)) {
            $this->error("Log directory not found: {$logPath}");
            return 1;
        }

        // Get all log files
        $logFiles = File::files($logPath);

        if (empty($logFiles)) {
            $this->info('No log files found to clear.');
            return 0;
        }

        $this->info("Found " . count($logFiles) . " log file(s) in " . $logPath);

        // Create backup if requested
        if ($backupOption) {
            $this->createBackup($logPath, $logFiles, $daysToKeep);
        }

        // Ask for confirmation
        if (!$this->confirm('Are you sure you want to clear all log files?', false)) {
            $this->info('Operation cancelled.');
            return 0;
        }

        $clearedCount = 0;
        $errorCount = 0;

        foreach ($logFiles as $file) {
            $filename = $file->getFilename();

            // Skip backup files if not clearing all
            if (!$clearAll && str_contains($filename, 'backup-')) {
                $this->line("Skipping backup file: {$filename}");
                continue;
            }

            // Skip .gitignore or other non-log files
            if ($filename === '.gitignore') {
                continue;
            }

            try {
                // Clear the file content by writing empty string
                File::put($file->getPathname(), '');
                $this->line("Cleared: {$filename}");
                $clearedCount++;
            } catch (\Exception $e) {
                $this->error("Failed to clear: {$filename} - " . $e->getMessage());
                $errorCount++;
            }
        }

        // Write a fresh log header to help identify new logs
        if ($clearedCount > 0) {
            $this->writeFreshLogHeader($logPath);
        }

        // Summary
        $this->newLine();
        $this->info("✅ Logs cleared successfully!");
        $this->line("   - Files cleared: {$clearedCount}");
        $this->line("   - Errors: {$errorCount}");

        if ($backupOption) {
            $this->line("   - Backup created (keeping {$daysToKeep} days)");
        }

        // Show disk space
        $this->showDiskSpace($logPath);

        // Add a separator in the log file to mark the clear
        Log::info('=== LOGS CLEARED - Fresh Start ===', [
            'cleared_by' => 'console:logs:clear',
            'timestamp' => now()->toDateTimeString(),
            'files_cleared' => $clearedCount,
        ]);

        return 0;
    }

    /**
     * Create a backup of current log files.
     */
    private function createBackup(string $logPath, array $logFiles, int $daysToKeep): void
    {
        $backupDir = $logPath . '/backups';

        // Create backup directory if it doesn't exist
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
            $this->line("Created backup directory: {$backupDir}");
        }

        // Clean old backups (keep only X days)
        $this->cleanOldBackups($backupDir, $daysToKeep);

        $timestamp = now()->format('Y-m-d_H-i-s');
        $backupCount = 0;

        foreach ($logFiles as $file) {
            $filename = $file->getFilename();

            // Skip already backed up files or non-log files
            if ($filename === '.gitignore' || str_contains($filename, 'backup-')) {
                continue;
            }

            $content = File::get($file->getPathname());

            // Only backup if file has content
            if (trim($content) !== '') {
                $backupFilename = "backup-{$timestamp}-{$filename}";
                $backupPath = $backupDir . '/' . $backupFilename;

                File::put($backupPath, $content);
                $backupCount++;
                $this->line("Backed up: {$filename} -> {$backupFilename}");
            }
        }

        if ($backupCount > 0) {
            $this->info("📦 Created backup with {$backupCount} file(s)");
        } else {
            $this->line("No content to backup (all logs were empty)");
        }
    }

    /**
     * Clean old backup files.
     */
    private function cleanOldBackups(string $backupDir, int $daysToKeep): void
    {
        if (!File::exists($backupDir)) {
            return;
        }

        $backupFiles = File::files($backupDir);
        $cutoffDate = now()->subDays($daysToKeep);
        $deletedCount = 0;

        foreach ($backupFiles as $file) {
            if ($file->getMTime() < $cutoffDate->timestamp) {
                try {
                    File::delete($file->getPathname());
                    $deletedCount++;
                } catch (\Exception $e) {
                    $this->error("Failed to delete old backup: {$file->getFilename()}");
                }
            }
        }

        if ($deletedCount > 0) {
            $this->line("🧹 Removed {$deletedCount} old backup(s) (older than {$daysToKeep} days)");
        }
    }

    /**
     * Write a fresh log header to help identify new logs.
     */
    private function writeFreshLogHeader(string $logPath): void
    {
        $laravelLog = $logPath . '/laravel.log';

        if (File::exists($laravelLog)) {
            $header = str_repeat('=', 80) . PHP_EOL;
            $header .= 'FRESH LOG START - ' . now()->toDateTimeString() . PHP_EOL;
            $header .= 'Logs cleared via console command' . PHP_EOL;
            $header .= str_repeat('=', 80) . PHP_EOL . PHP_EOL;

            // Prepend header to the log file
            $currentContent = File::get($laravelLog);
            File::put($laravelLog, $header . $currentContent);
        }
    }

    /**
     * Show disk space information for the logs directory.
     */
    private function showDiskSpace(string $logPath): void
    {
        $totalSize = 0;
        $allFiles = File::allFiles($logPath);

        foreach ($allFiles as $file) {
            $totalSize += $file->getSize();
        }

        $this->newLine();
        $this->line("📊 Log directory size: " . $this->formatSize($totalSize));
        $this->line("   - Total files: " . count($allFiles));
        $this->line("   - Location: {$logPath}");
    }

    /**
     * Format file size in human-readable format.
     */
    private function formatSize(int $bytes): string
    {
        if ($bytes === 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes, 1024));

        return round($bytes / pow(1024, $i), 2) . ' ' . $units[(int) $i];
    }
}
