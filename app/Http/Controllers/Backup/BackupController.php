<?php

namespace App\Http\Controllers\Backup;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SimpleLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

/**
 * BackupController
 *
 * Handles system backup operations including database backup, file backup,
 * restore functionality, and backup management. Supports both manual and
 * automatic backup creation with configurable retention limits.
 */
class BackupController extends Controller
{
  /** @var string Base path for all backup-related storage */
  protected string $basePath;

  /** @var string Path where backup ZIP files are stored */
  protected string $backupPath;

  /** @var string Path where backup operation logs are stored */
  protected string $logPath;

  /** @var int Maximum number of backups to retain before automatic cleanup */
  protected int $maxBackups;

  /**
   * Cache duration for backup list (2 minutes).
   */
  protected int $cacheDuration = 120;

  /**
   * Constructor - Initializes backup paths and ensures required directories exist.
   */
  public function __construct()
  {
    $this->basePath = storage_path('app/backups');
    $this->backupPath = $this->basePath . '/files';
    $this->logPath = $this->basePath . '/logs';
    $this->maxBackups = 10;

    $this->ensureDirectories();
  }

  /**
   * Display the backup management dashboard.
   */
  public function index(): \Inertia\Response|\Illuminate\Http\RedirectResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('admin.manage')) {
      return redirect()->route('unauthorized.access')
        ->with('error', 'You do not have permission to view backups.');
    }

    // Cache the backup list and logs for 2 minutes
    $backups = Cache::remember('backup_list', $this->cacheDuration, function () {
      return $this->getBackupList();
    });

    $backupLogs = Cache::remember('backup_logs', $this->cacheDuration, function () {
      return $this->getBackupLogs();
    });

    $storageInfo = $this->getStorageInfo();

    return Inertia::render('Backend/Backup/Index', [
      'backups' => $backups,
      'backupLogs' => $backupLogs,
      'storageInfo' => $storageInfo,
      'config' => [
        'maxBackups' => $this->maxBackups,
        'backupPath' => 'storage/app/backups/files',
      ],
    ]);
  }

  /**
   * Create a manual backup on demand – with rate limiting.
   */
  public function createManual(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('admin.manage')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('backup_manual', $user->id);

    try {
      $type = $request->input('type', 'full');
      $description = $request->input('description', 'Manual backup');

      SimpleLogger::system(
        "📦 Manual backup initiated: {$type}",
        [
          'type' => $type,
          'description' => $description,
          'performed_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      $backupId = $this->createBackup($type, $description, 'manual');

      RateLimiter::clear($this->getThrottleKey('backup_manual', $user->id));
      $this->clearCache();

      SimpleLogger::system(
        "✅ Manual backup completed: {$backupId}",
        [
          'backup_id' => $backupId,
          'type' => $type,
          'performed_by' => $user->email,
        ]
      );

      return response()->json([
        'success' => true,
        'message' => 'Backup created successfully!',
        'backup' => $backupId,
        'location' => $this->backupPath . '/' . $backupId . '.zip',
      ]);
    } catch (ValidationException $e) {
      return response()->json(['success' => false, 'errors' => $e->errors()], 422);
    } catch (\Exception $e) {
      SimpleLogger::system(
        "❌ Manual backup failed",
        [
          'type' => $request->input('type', 'full'),
          'error' => $e->getMessage(),
          'performed_by' => $user->email,
        ]
      );

      Log::error('Manual backup failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to create backup: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Create an automatic/scheduled backup – with rate limiting.
   */
  public function createAuto(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('admin.manage')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('backup_auto', $user->id);

    try {
      $type = $request->input('type', 'full');
      $description = 'Automatic backup - ' . Carbon::now()->format('Y-m-d H:i:s');

      SimpleLogger::system(
        "🔄 Automatic backup initiated: {$type}",
        [
          'type' => $type,
          'performed_by' => 'system',
          'ip' => $request->ip(),
        ]
      );

      $backupId = $this->createBackup($type, $description, 'auto');

      RateLimiter::clear($this->getThrottleKey('backup_auto', $user->id));
      $this->clearCache();

      SimpleLogger::system(
        "✅ Automatic backup completed: {$backupId}",
        [
          'backup_id' => $backupId,
          'type' => $type,
        ]
      );

      return response()->json([
        'success' => true,
        'message' => 'Automatic backup created successfully!',
        'backup' => $backupId,
        'location' => $this->backupPath . '/' . $backupId . '.zip',
      ]);
    } catch (ValidationException $e) {
      return response()->json(['success' => false, 'errors' => $e->errors()], 422);
    } catch (\Exception $e) {
      SimpleLogger::system(
        "❌ Automatic backup failed",
        [
          'type' => $request->input('type', 'full'),
          'error' => $e->getMessage(),
        ]
      );

      Log::error('Automatic backup failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to create automatic backup: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Download a backup ZIP file.
   */
  public function download(Request $request): BinaryFileResponse|JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('admin.manage')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
      $backupId = $request->input('backup_id');

      if (!$backupId) {
        throw new \Exception('Backup ID is required');
      }

      $zipPath = $this->backupPath . '/' . $backupId . '.zip';

      if (!File::exists($zipPath)) {
        throw new \Exception('Backup file not found at: ' . $zipPath);
      }

      SimpleLogger::system(
        "📥 Backup downloaded: {$backupId}",
        [
          'backup_id' => $backupId,
          'performed_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return response()->download($zipPath, $backupId . '.zip', [
        'Content-Type' => 'application/zip',
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to download backup: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Delete a backup file and its metadata – with rate limiting.
   */
  public function delete(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('admin.manage')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('backup_delete', $user->id);

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

      RateLimiter::clear($this->getThrottleKey('backup_delete', $user->id));
      $this->clearCache();

      SimpleLogger::system(
        "🗑️ Backup deleted: {$backupId}",
        [
          'backup_id' => $backupId,
          'performed_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      return response()->json([
        'success' => true,
        'message' => 'Backup deleted successfully!',
      ]);
    } catch (ValidationException $e) {
      return response()->json(['success' => false, 'errors' => $e->errors()], 422);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to delete backup: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Restore a backup from a ZIP file – with rate limiting.
   */
  public function restore(Request $request): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('admin.manage')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $this->checkRateLimit('backup_restore', $user->id);

    try {
      $backupId = $request->input('backup_id');
      $type = $request->input('type', 'full');

      if (!$backupId) {
        throw new \Exception('Backup ID is required');
      }

      SimpleLogger::system(
        "🔄 Backup restore initiated: {$backupId} ({$type})",
        [
          'backup_id' => $backupId,
          'type' => $type,
          'performed_by' => $user->email,
          'ip' => $request->ip(),
        ]
      );

      $zipPath = $this->backupPath . '/' . $backupId . '.zip';

      if (!File::exists($zipPath)) {
        throw new \Exception('Backup file not found at: ' . $zipPath);
      }

      // Extract to temporary location
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

      // Perform restore based on type
      if ($type === 'full' || $type === 'database') {
        $this->restoreDatabase($tempDir);
      }

      if ($type === 'full' || $type === 'files') {
        $this->restoreFiles($tempDir);
      }

      // Clean up temporary directory
      File::deleteDirectory($tempDir);

      RateLimiter::clear($this->getThrottleKey('backup_restore', $user->id));
      $this->clearCache();

      $this->logRestore($backupId, $type, 'success');

      SimpleLogger::system(
        "✅ Backup restore completed: {$backupId}",
        [
          'backup_id' => $backupId,
          'type' => $type,
          'performed_by' => $user->email,
        ]
      );

      return response()->json([
        'success' => true,
        'message' => 'Backup restored successfully!',
      ]);
    } catch (ValidationException $e) {
      return response()->json(['success' => false, 'errors' => $e->errors()], 422);
    } catch (\Exception $e) {
      SimpleLogger::system(
        "❌ Backup restore failed",
        [
          'backup_id' => $request->input('backup_id'),
          'type' => $request->input('type', 'full'),
          'error' => $e->getMessage(),
          'performed_by' => $user->email,
        ]
      );

      Log::error('Restore failed: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to restore backup: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Get the current backup status.
   */
  public function status(): JsonResponse
  {
    $user = $this->getAuthUser();

    if (!$user->hasPermission('admin.manage')) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    try {
      $lastBackup = $this->getLastBackup();
      $storageInfo = $this->getStorageInfo();

      return response()->json([
        'success' => true,
        'data' => [
          'last_backup' => $lastBackup,
          'storage' => $storageInfo,
          'is_backup_running' => false,
        ],
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Failed to get backup status: ' . $e->getMessage(),
      ], 500);
    }
  }

    // ==========================================
    // PRIVATE HELPER METHODS
    // ==========================================

  /**
   * Get the authenticated user.
   */
  private function getAuthUser(): User
  {
    $user = Auth::user();
    if (!$user instanceof User) {
      abort(401, 'Unauthenticated');
    }
    return $user;
  }

  /**
   * Check rate limit for backup actions.
   */
  private function checkRateLimit(string $action, int $userId, int $maxAttempts = 5, int $decaySeconds = 3600): void
  {
    $key = $this->getThrottleKey($action, $userId);
    if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
      Log::warning("Rate limit exceeded for {$action}", ['user_id' => $userId]);
      throw ValidationException::withMessages([
        'rate_limit' => 'Too many attempts. Please wait a moment.',
      ]);
    }
    RateLimiter::hit($key, $decaySeconds);
  }

  /**
   * Get throttle key.
   */
  private function getThrottleKey(string $action, int $userId): string
  {
    return "backup_{$action}|{$userId}";
  }

  /**
   * Clear backup cache.
   */
  private function clearCache(): void
  {
    Cache::forget('backup_list');
    Cache::forget('backup_logs');
  }

  /**
   * Ensures all required backup directories exist.
   */
  private function ensureDirectories(): void
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

    // ==========================================
    // CORE BACKUP METHODS (unchanged logic, kept as-is)
    // ==========================================

  /**
   * Core backup creation method.
   */
  protected function createBackup(string $type, string $description, string $trigger): string
  {
    $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
    $backupId = $type . '_' . $timestamp;
    $tempDir = $this->basePath . '/temp_' . $timestamp;

    try {
      if (!File::exists($tempDir)) {
        File::makeDirectory($tempDir, 0755, true);
      }

      $files = [];

      if ($type === 'full' || $type === 'database') {
        $files['database'] = $this->backupDatabase($tempDir);
      }

      if ($type === 'full' || $type === 'files') {
        $files['files'] = $this->backupFiles($tempDir);
      }

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

      $size = File::exists($zipPath) ? File::size($zipPath) : 0;
      $info['size'] = $size;

      $infoPath = $this->backupPath . '/' . $backupId . '_info.json';
      File::put($infoPath, json_encode($info, JSON_PRETTY_PRINT));

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

  /**
   * Backup database to SQL file.
   */
  protected function backupDatabase(string $tempDir): string
  {
    $filename = 'database.sql';
    $filepath = $tempDir . '/' . $filename;

    try {
      $connection = config('database.default');
      $database = config("database.connections.{$connection}.database");

      $tables = DB::select('SHOW TABLES');

      $firstTable = $tables[0] ?? null;
      $tableKeys = $firstTable ? array_keys((array) $firstTable) : [];
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

        $sql .= "INSERT INTO `{$tableName}` VALUES\n";
        $insertChunks = [];

        DB::table($tableName)->orderBy('id')->chunk(1000, function ($chunk) use (&$insertChunks) {
          foreach ($chunk as $row) {
            $rowArray = (array) $row;
            $escapedValues = array_map(function ($value) {
              return $value === null ? 'NULL' : "'" . addslashes((string) $value) . "'";
            }, $rowArray);
            $insertChunks[] = "(" . implode(',', $escapedValues) . ")";
          }
        });

        if (!empty($insertChunks)) {
          $sql .= implode(",\n", $insertChunks) . ";\n\n";
        } else {
          $sql = substr($sql, 0, -strlen("INSERT INTO `{$tableName}` VALUES\n"));
        }
      }

      $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
      File::put($filepath, $sql);
      return $filename;
    } catch (\Exception $e) {
      throw new \Exception('Database backup failed: ' . $e->getMessage());
    }
  }

  /**
   * Backup files to ZIP archive.
   */
  protected function backupFiles(string $tempDir): string
  {
    $filename = 'files.zip';
    $filepath = $tempDir . '/' . $filename;

    try {
      $zip = new ZipArchive();
      if ($zip->open($filepath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        throw new \Exception('Failed to create files zip');
      }

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

  /**
   * Add directory to ZIP recursively.
   */
  protected function addDirectoryToZip(ZipArchive $zip, string $directory, string $prefix = ''): void
  {
    try {
      $files = File::allFiles($directory);

      foreach ($files as $file) {
        if (
          strpos($file->getPathname(), '/cache/') !== false ||
          strpos($file->getPathname(), '/logs/') !== false ||
          strpos($file->getPathname(), '/temp_') !== false
        ) {
          continue;
        }

        if ($file->getSize() > 5000000) {
          continue;
        }

        $relativePath = $prefix . '/' . $file->getRelativePathname();
        $zip->addFile($file->getPathname(), $relativePath);
      }
    } catch (\Exception $e) {
      Log::warning('Failed to add directory to zip: ' . $e->getMessage());
    }
  }

  /**
   * Add all files from directory to ZIP.
   */
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

  /**
   * Restore database from SQL file.
   */
  protected function restoreDatabase(string $tempDir): void
  {
    $sqlFile = $tempDir . '/database.sql';
    if (!File::exists($sqlFile)) {
      Log::warning('Database backup file not found, skipping database restore');
      return;
    }

    $sql = File::get($sqlFile);

    try {
      $statements = $this->splitSqlStatements($sql);

      foreach ($statements as $statement) {
        if (trim($statement)) {
          try {
            DB::unprepared($statement);
          } catch (\Exception $e) {
            Log::warning('Failed to execute SQL statement: ' . $e->getMessage());
          }
        }
      }
    } catch (\Exception $e) {
      throw new \Exception('Database restore failed: ' . $e->getMessage());
    }
  }

  /**
   * Restore files from backup.
   */
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

    $envFile = $extractDir . '/.env';
    if (File::exists($envFile)) {
      if (File::exists(base_path('.env'))) {
        File::copy(base_path('.env'), base_path('.env_backup_' . Carbon::now()->timestamp));
      }
      File::copy($envFile, base_path('.env'));
    }

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

  /**
   * Split SQL into individual statements.
   */
  protected function splitSqlStatements(string $sql): array
  {
    $sql = preg_replace('/--.*$/m', '', $sql);
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);

    $statements = explode(';', $sql);
    $statements = array_map('trim', $statements);
    $statements = array_filter($statements, function ($stmt) {
      return !empty($stmt);
    });

    return array_values($statements);
  }

  /**
   * Get list of available backups.
   */
  protected function getBackupList(): array
  {
    try {
      if (!File::exists($this->backupPath)) {
        return [];
      }

      $files = File::files($this->backupPath);
      $backups = [];

      foreach ($files as $file) {
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

      usort($backups, function ($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
      });

      return $backups;
    } catch (\Exception $e) {
      Log::error('Failed to get backup list: ' . $e->getMessage());
      return [];
    }
  }

  /**
   * Get backup operation logs.
   */
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
        if (empty($line)) {
          continue;
        }

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

      return array_slice(array_reverse($logs), 0, $limit);
    } catch (\Exception $e) {
      Log::error('Failed to get backup logs: ' . $e->getMessage());
      return [];
    }
  }

  /**
   * Log a backup operation.
   */
  protected function logBackup(
    string $backupId,
    string $type,
    string $trigger,
    string $description,
    int $size,
    string $status,
    ?string $error = null
  ): void {
    try {
      $logFile = $this->logPath . '/backup.log';
      $timestamp = Carbon::now()->format('Y-m-d H:i:s');

      $logEntry = sprintf(
        "%s | %s | %s | %s | %s | %s | %d bytes | %s\n",
        $timestamp,
        $status,
        $backupId,
        $type,
        $trigger,
        $description,
        $size,
        $error ?? ''
      );

      File::append($logFile, $logEntry);
    } catch (\Exception $e) {
      Log::error('Failed to log backup: ' . $e->getMessage());
    }
  }

  /**
   * Log a restore operation.
   */
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

  /**
   * Clean up old backups.
   */
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

  /**
   * Get storage information.
   */
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

  /**
   * Get the most recent backup.
   */
  protected function getLastBackup(): ?array
  {
    $backups = $this->getBackupList();
    return count($backups) > 0 ? $backups[0] : null;
  }

  /**
   * Format bytes to human-readable string.
   */
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
}
