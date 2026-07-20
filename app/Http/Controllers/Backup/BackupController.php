<?php
// app/Http/Controllers/Backup/BackupController.php

namespace App\Http\Controllers\Backup;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use ZipArchive;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\JsonResponse;

class BackupController extends Controller
{
  protected string $basePath;
  protected string $backupPath;
  protected string $logPath;
  protected int $maxBackups;

  public function __construct()
  {
    // Centralized base path
    $this->basePath = storage_path('app/backups');
    $this->backupPath = $this->basePath . '/files';
    $this->logPath = $this->basePath . '/logs';
    $this->maxBackups = 10;

    $this->ensureDirectories();
  }

  protected function ensureDirectories(): void
  {
    try {
      $directories = [
        $this->basePath,
        $this->backupPath,
        $this->logPath,
      ];

      foreach ($directories as $dir) {
        if (!File::exists($dir)) {
          File::makeDirectory($dir, 0755, true);
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to create backup directories: ' . $e->getMessage());
    }
  }

  public function index()
  {
    $backups = $this->getBackupList();
    $backupLogs = $this->getBackupLogs();
    $storageInfo = $this->getStorageInfo();

    return Inertia::render('Backend/Backup/Index', [
      'backups' => $backups,
      'backupLogs' => $backupLogs,
      'storageInfo' => $storageInfo,
      'config' => [
        'maxBackups' => $this->maxBackups,
        'backupPath' => 'storage/app/backups/files',
      ]
    ]);
  }

  public function createManual(Request $request): JsonResponse
  {
    try {
      $type = $request->input('type', 'full');
      $description = $request->input('description', 'Manual backup');

      $backupId = $this->createBackup($type, $description, 'manual');

      return response()->json([
        'success' => true,
        'message' => 'Backup created successfully!',
        'backup' => $backupId,
        'location' => $this->backupPath . '/' . $backupId . '.zip'
      ]);
    } catch (\Exception $e) {
      Log::error('Manual backup failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to create backup: ' . $e->getMessage()
      ], 500);
    }
  }

  public function createAuto(Request $request): JsonResponse
  {
    try {
      $type = $request->input('type', 'full');
      $description = 'Automatic backup - ' . Carbon::now()->format('Y-m-d H:i:s');

      $backupId = $this->createBackup($type, $description, 'auto');

      return response()->json([
        'success' => true,
        'message' => 'Automatic backup created successfully!',
        'backup' => $backupId,
        'location' => $this->backupPath . '/' . $backupId . '.zip'
      ]);
    } catch (\Exception $e) {
      Log::error('Automatic backup failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to create automatic backup: ' . $e->getMessage()
      ], 500);
    }
  }

  protected function createBackup(string $type, string $description, string $trigger): string
  {
    $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
    $backupId = $type . '_' . $timestamp;
    $tempDir = $this->basePath . '/temp_' . $timestamp;


    try {
      // Create temp directory
      if (!File::exists($tempDir)) {
        File::makeDirectory($tempDir, 0755, true);
      }

      $files = [];

      // Database backup
      if ($type === 'full' || $type === 'database') {
        $files['database'] = $this->backupDatabase($tempDir);
      }

      // Files backup
      if ($type === 'full' || $type === 'files') {
        $files['files'] = $this->backupFiles($tempDir);
      }

      // Create final zip in the centralized location
      $zipPath = $this->backupPath . '/' . $backupId . '.zip';

      $zip = new ZipArchive();
      if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new \Exception('Failed to create zip archive at: ' . $zipPath);
      }

      $this->addFilesToZip($zip, $tempDir);

      $info = [
        'id' => $backupId,
        'type' => $type,
        'trigger' => $trigger,
        'description' => $description,
        'created_at' => Carbon::now()->toISOString(),
        'size' => 0,
        'files' => $files,
        'database' => $type === 'full' || $type === 'database',
        'php_version' => phpversion(),
        'laravel_version' => app()->version(),
      ];

      $zip->addFromString('backup_info.json', json_encode($info, JSON_PRETTY_PRINT));

      if (!$zip->close()) {
        throw new \Exception('Failed to close zip file');
      }

      // Get file size
      $size = File::exists($zipPath) ? File::size($zipPath) : 0;
      $info['size'] = $size;

      // Save info file
      $infoPath = $this->backupPath . '/' . $backupId . '_info.json';
      File::put($infoPath, json_encode($info, JSON_PRETTY_PRINT));

      // Clean up temp directory
      if (File::exists($tempDir)) {
        File::deleteDirectory($tempDir);
      }

      $this->logBackup($backupId, $type, $trigger, $description, $size, 'success');
      $this->cleanupOldBackups();

      return $backupId;
    } catch (\Exception $e) {
      Log::error('Backup failed: ' . $e->getMessage());
      if (File::exists($tempDir)) {
        File::deleteDirectory($tempDir);
      }
      $this->logBackup($backupId ?? 'unknown', $type, $trigger, $description, 0, 'failed', $e->getMessage());
      throw $e;
    }
  }

  protected function backupDatabase(string $tempDir): string
  {
    $filename = 'database.sql';
    $filepath = $tempDir . '/' . $filename;

    try {
      $connection = config('database.default');
      $database = config("database.connections.{$connection}.database");

      $tables = DB::select('SHOW TABLES');

      $firstTable = $tables[0] ?? null;
      if (!$firstTable) {
        throw new \Exception('No tables found in database');
      }

      $tableKeys = array_keys((array) $firstTable);
      $tableKey = $tableKeys[0] ?? 'Tables_in_' . str_replace('-', '_', $database);

      $sql = "-- Database Backup\n";
      $sql .= "-- Generated: " . Carbon::now() . "\n";
      $sql .= "-- Database: {$database}\n\n";
      $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

      foreach ($tables as $table) {
        $tableArray = (array) $table;
        $tableName = $tableArray[$tableKey] ?? null;

        if (!$tableName) {
          continue;
        }

        $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
        $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
        $sql .= $createTable[0]->{'Create Table'} . ";\n\n";

        $rows = DB::table($tableName)->limit(1000)->get();
        if ($rows->count() > 0) {
          $sql .= "INSERT INTO `{$tableName}` VALUES\n";
          $values = [];
          foreach ($rows as $row) {
            $rowArray = (array) $row;
            $escapedValues = array_map(function ($value) {
              if ($value === null) return 'NULL';
              return "'" . addslashes((string)$value) . "'";
            }, $rowArray);
            $values[] = "(" . implode(',', $escapedValues) . ")";
          }
          $sql .= implode(",\n", $values) . ";\n\n";
        }
      }

      $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
      File::put($filepath, $sql);
      return $filename;
    } catch (\Exception $e) {
      throw new \Exception('Database backup failed: ' . $e->getMessage());
    }
  }

  protected function backupFiles(string $tempDir): string
  {
    $filename = 'files.zip';
    $filepath = $tempDir . '/' . $filename;

    try {
      $zip = new ZipArchive();
      if ($zip->open($filepath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new \Exception('Failed to create files zip');
      }

      // Backup important directories
      $directories = [
        'config' => base_path('config'),
        'database/migrations' => base_path('database/migrations'),
        'routes' => base_path('routes'),
        'resources/views' => base_path('resources/views'),
      ];

      foreach ($directories as $name => $path) {
        if (File::exists($path)) {
          $this->addDirectoryToZip($zip, $path, $name);
        }
      }

      // Backup important files
      $files = [
        '.env' => base_path('.env'),
        '.env.example' => base_path('.env.example'),
        'composer.json' => base_path('composer.json'),
        'package.json' => base_path('package.json'),
      ];

      foreach ($files as $name => $path) {
        if (File::exists($path) && File::size($path) < 1000000) {
          $zip->addFile($path, $name);
        }
      }

      $zip->close();
      return $filename;
    } catch (\Exception $e) {
      throw new \Exception('Files backup failed: ' . $e->getMessage());
    }
  }

  protected function addDirectoryToZip(ZipArchive $zip, string $directory, string $prefix = ''): void
  {
    try {
      $files = File::allFiles($directory);

      foreach ($files as $file) {
        // Skip cache, logs, and temp files
        if (
          strpos($file->getPathname(), '/cache/') !== false ||
          strpos($file->getPathname(), '/logs/') !== false ||
          strpos($file->getPathname(), '/temp_') !== false
        ) {
          continue;
        }

        // Skip large files
        if ($file->getSize() > 5000000) { // 5MB
          continue;
        }

        $relativePath = $prefix . '/' . $file->getRelativePathname();
        $zip->addFile($file->getPathname(), $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to add directory to zip: ' . $e->getMessage());
    }
  }

  protected function addFilesToZip(ZipArchive $zip, string $directory): void
  {
    try {
      $files = File::allFiles($directory);

      foreach ($files as $file) {
        $relativePath = $file->getRelativePathname();
        $zip->addFile($file->getPathname(), $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to add files to zip: ' . $e->getMessage());
    }
  }

  public function download(Request $request): BinaryFileResponse|JsonResponse
  {
    try {
      $backupId = $request->input('backup_id');

      if (!$backupId) {
        throw new \Exception('Backup ID is required');
      }

      $zipPath = $this->backupPath . '/' . $backupId . '.zip';

      if (!File::exists($zipPath)) {
        throw new \Exception('Backup file not found at: ' . $zipPath);
      }

      return response()->download($zipPath, $backupId . '.zip', [
        'Content-Type' => 'application/zip',
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to download backup: ' . $e->getMessage()
      ], 500);
    }
  }

  public function delete(Request $request): JsonResponse
  {
    try {
      $backupId = $request->input('backup_id');

      if (!$backupId) {
        throw new \Exception('Backup ID is required');
      }

      $zipPath = $this->backupPath . '/' . $backupId . '.zip';
      $infoPath = $this->backupPath . '/' . $backupId . '_info.json';

      if (File::exists($zipPath)) {
        File::delete($zipPath);
      }

      if (File::exists($infoPath)) {
        File::delete($infoPath);
      }

      return response()->json([
        'success' => true,
        'message' => 'Backup deleted successfully!'
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to delete backup: ' . $e->getMessage()
      ], 500);
    }
  }

  public function restore(Request $request): JsonResponse
  {
    try {
      $backupId = $request->input('backup_id');
      $type = $request->input('type', 'full');

      if (!$backupId) {
        throw new \Exception('Backup ID is required');
      }

      $zipPath = $this->backupPath . '/' . $backupId . '.zip';

      if (!File::exists($zipPath)) {
        throw new \Exception('Backup file not found at: ' . $zipPath);
      }

      $tempDir = $this->basePath . '/temp_restore_' . Carbon::now()->timestamp;
      if (!File::exists($tempDir)) {
        File::makeDirectory($tempDir, 0755, true);
      }

      $zip = new ZipArchive();
      if ($zip->open($zipPath) !== true) {
        throw new \Exception('Failed to open backup archive');
      }

      $zip->extractTo($tempDir);
      $zip->close();

      if ($type === 'full' || $type === 'database') {
        $this->restoreDatabase($tempDir);
      }

      if ($type === 'full' || $type === 'files') {
        $this->restoreFiles($tempDir);
      }

      File::deleteDirectory($tempDir);
      $this->logRestore($backupId, $type, 'success');

      return response()->json([
        'success' => true,
        'message' => 'Backup restored successfully!'
      ]);
    } catch (\Exception $e) {
      Log::error('Restore failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to restore backup: ' . $e->getMessage()
      ], 500);
    }
  }

  protected function restoreDatabase(string $tempDir): void
  {
    $sqlFile = $tempDir . '/database.sql';
    if (!File::exists($sqlFile)) {
      Log::warning('Database backup file not found, skipping database restore');
      return;
    }

    $sql = File::get($sqlFile);

    try {
      // Split SQL into individual statements
      $statements = $this->splitSqlStatements($sql);
      $total = count($statements);
      $executed = 0;

      foreach ($statements as $statement) {
        if (trim($statement)) {
          try {
            DB::unprepared($statement);
            $executed++;
          } catch (\Exception $e) {
            Log::warning('Failed to execute SQL statement: ' . $e->getMessage());
          }
        }
      }
    } catch (\Exception $e) {
      throw new \Exception('Database restore failed: ' . $e->getMessage());
    }
  }

  protected function restoreFiles(string $tempDir): void
  {
    $filesZip = $tempDir . '/files.zip';
    if (!File::exists($filesZip)) {
      Log::warning('Files backup not found, skipping files restore');
      return;
    }

    $zip = new ZipArchive();
    if ($zip->open($filesZip) !== true) {
      throw new \Exception('Failed to open files zip');
    }

    $extractDir = $this->basePath . '/temp_files_restore';
    if (!File::exists($extractDir)) {
      File::makeDirectory($extractDir, 0755, true);
    }

    $zip->extractTo($extractDir);
    $zip->close();

    // Restore .env
    $envFile = $extractDir . '/.env';
    if (File::exists($envFile)) {
      if (File::exists(base_path('.env'))) {
        File::copy(base_path('.env'), base_path('.env_backup_' . Carbon::now()->timestamp));
      }
      File::copy($envFile, base_path('.env'));
    }

    // Restore config files
    $configDir = $extractDir . '/config';
    if (File::exists($configDir)) {
      $configFiles = File::files($configDir);
      foreach ($configFiles as $file) {
        $targetPath = base_path('config/' . $file->getFilename());
        if (File::exists($targetPath)) {
          File::copy($targetPath, base_path('config/' . $file->getFilename() . '_backup_' . Carbon::now()->timestamp));
        }
        File::copy($file->getPathname(), $targetPath);
      }
    }

    // Restore routes
    $routesDir = $extractDir . '/routes';
    if (File::exists($routesDir)) {
      $routeFiles = File::files($routesDir);
      foreach ($routeFiles as $file) {
        $targetPath = base_path('routes/' . $file->getFilename());
        File::copy($file->getPathname(), $targetPath);
      }
    }

    File::deleteDirectory($extractDir);
  }

  protected function splitSqlStatements(string $sql): array
  {
    // Remove comments
    $sql = preg_replace('/--.*$/m', '', $sql);
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);

    // Split by semicolon
    $statements = explode(';', $sql);

    // Clean up each statement
    $statements = array_map('trim', $statements);
    $statements = array_filter($statements, function ($stmt) {
      return !empty($stmt);
    });

    return array_values($statements);
  }

  protected function getBackupList(): array
  {
    try {
      if (!File::exists($this->backupPath)) {
        return [];
      }

      $files = File::files($this->backupPath);
      $backups = [];

      foreach ($files as $file) {
        // $file is a SplFileInfo object
        $filename = $file->getFilename();

        if (str_ends_with($filename, '_info.json')) {
          $backupId = str_replace('_info.json', '', $filename);
          $content = File::get($file->getPathname());
          $info = json_decode($content, true);

          if ($info && is_array($info)) {
            $backups[] = [
              'id' => $backupId,
              'type' => $info['type'] ?? 'full',
              'trigger' => $info['trigger'] ?? 'manual',
              'description' => $info['description'] ?? 'No description',
              'created_at' => $info['created_at'] ?? Carbon::now()->toISOString(),
              'size' => $info['size'] ?? 0,
              'size_formatted' => $this->formatBytes($info['size'] ?? 0),
              'database' => $info['database'] ?? false,
            ];
          }
        }
      }

      // Sort by created_at descending (newest first)
      usort($backups, function ($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
      });

      return $backups;
    } catch (\Exception $e) {
      Log::error('Failed to get backup list: ' . $e->getMessage());
      return [];
    }
  }

  protected function getBackupLogs(int $limit = 50): array
  {
    try {
      $logFile = $this->logPath . '/backup.log';
      if (!File::exists($logFile)) {
        return [];
      }

      $content = File::get($logFile);
      $lines = explode("\n", $content);
      $logs = [];

      foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) continue;

        $parts = explode(' | ', $line);
        if (count($parts) >= 5) {
          $logs[] = [
            'timestamp' => $parts[0] ?? '',
            'level' => $parts[1] ?? 'info',
            'backup_id' => $parts[2] ?? '',
            'type' => $parts[3] ?? '',
            'message' => $parts[4] ?? '',
          ];
        }
      }

      // Return last $limit logs (newest first)
      return array_slice(array_reverse($logs), 0, $limit);
    } catch (\Exception $e) {
      Log::error('Failed to get backup logs: ' . $e->getMessage());
      return [];
    }
  }

  protected function logBackup(string $backupId, string $type, string $trigger, string $description, int $size, string $status, string $error = null): void
  {
    try {
      $logFile = $this->logPath . '/backup.log';
      $timestamp = Carbon::now()->format('Y-m-d H:i:s');

      $logEntry = sprintf(
        "%s | %s | %s | %s | %s | %s | %s\n",
        $timestamp,
        $status,
        $backupId,
        $type,
        $trigger,
        $description,
        $error ?? ''
      );

      File::append($logFile, $logEntry);
    } catch (\Exception $e) {
      Log::error('Failed to log backup: ' . $e->getMessage());
    }
  }

  protected function logRestore(string $backupId, string $type, string $status): void
  {
    try {
      $logFile = $this->logPath . '/restore.log';
      $timestamp = Carbon::now()->format('Y-m-d H:i:s');

      $logEntry = sprintf(
        "%s | %s | %s | %s\n",
        $timestamp,
        $status,
        $backupId,
        $type
      );

      File::append($logFile, $logEntry);
    } catch (\Exception $e) {
      Log::error('Failed to log restore: ' . $e->getMessage());
    }
  }

  protected function cleanupOldBackups(): void
  {
    try {
      $backups = $this->getBackupList();

      if (count($backups) > $this->maxBackups) {
        $toDelete = array_slice($backups, $this->maxBackups);

        foreach ($toDelete as $backup) {
          $zipPath = $this->backupPath . '/' . $backup['id'] . '.zip';
          $infoPath = $this->backupPath . '/' . $backup['id'] . '_info.json';

          if (File::exists($zipPath)) {
            File::delete($zipPath);
          }
          if (File::exists($infoPath)) {
            File::delete($infoPath);
          }
        }
      }
    } catch (\Exception $e) {
      Log::error('Failed to clean up old backups: ' . $e->getMessage());
    }
  }

  protected function getStorageInfo(): array
  {
    try {
      $total = 0;
      $backups = $this->getBackupList();

      foreach ($backups as $backup) {
        $total += $backup['size'] ?? 0;
      }

      $diskFree = @disk_free_space(storage_path());
      $diskTotal = @disk_total_space(storage_path());

      return [
        'total_backups' => count($backups),
        'total_size' => $total,
        'total_size_formatted' => $this->formatBytes($total),
        'max_backups' => $this->maxBackups,
        'disk_free' => $diskFree ? $this->formatBytes($diskFree) : 'Unknown',
        'disk_total' => $diskTotal ? $this->formatBytes($diskTotal) : 'Unknown',
      ];
    } catch (\Exception $e) {
      return [
        'total_backups' => 0,
        'total_size' => 0,
        'total_size_formatted' => '0 B',
        'max_backups' => $this->maxBackups,
        'disk_free' => 'Unknown',
        'disk_total' => 'Unknown',
      ];
    }
  }

  protected function formatBytes(int $bytes): string
  {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $i = 0;
    while ($bytes >= 1024 && $i < count($units) - 1) {
      $bytes /= 1024;
      $i++;
    }
    return round($bytes, 2) . ' ' . $units[$i];
  }

  public function status(): JsonResponse
  {
    try {
      $lastBackup = $this->getLastBackup();
      $storageInfo = $this->getStorageInfo();

      return response()->json([
        'success' => true,
        'data' => [
          'last_backup' => $lastBackup,
          'storage' => $storageInfo,
          'is_backup_running' => false,
        ]
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to get backup status: ' . $e->getMessage()
      ], 500);
    }
  }

  protected function getLastBackup(): ?array
  {
    $backups = $this->getBackupList();
    return count($backups) > 0 ? $backups[0] : null;
  }
}
