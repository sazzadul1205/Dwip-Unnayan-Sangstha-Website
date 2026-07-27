<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;

class SimpleLogger
{
    private static int $maxLines = 10000;
    private static string $logDir = 'logs';

    public static function log(string $type, string $message, array $context = []): void
    {
        $logFile = storage_path(self::$logDir . '/' . $type . '.log');

        if (!is_dir(storage_path(self::$logDir))) {
            mkdir(storage_path(self::$logDir), 0755, true);
        }

        $timestamp = now()->format('Y-m-d H:i:s');
        $user = Auth::id() ?? 'system';
        $ip = request()->ip() ?? '0.0.0.0';
        $email = Auth::user()?->email ?? 'system';

        $logEntry = sprintf(
            "[%s] [User: %s] [%s] [IP: %s] %s %s\n",
            $timestamp,
            $user,
            $email,
            $ip,
            $message,
            !empty($context) ? json_encode($context) : ''
        );

        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
        self::rotateIfNeeded($logFile);
    }

    private static function rotateIfNeeded(string $logFile): void
    {
        if (!file_exists($logFile)) {
            return;
        }

        $lineCount = 0;
        $handle = fopen($logFile, 'r');
        while (fgets($handle) !== false) {
            $lineCount++;
        }
        fclose($handle);

        if ($lineCount > self::$maxLines) {
            $keepLines = (int) floor(self::$maxLines / 2);
            $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $newLines = array_slice($lines, -$keepLines);
            file_put_contents($logFile, implode("\n", $newLines) . "\n", LOCK_EX);
        }
    }

    public static function security(string $message, array $context = []): void
    {
        self::log('security', '🔒 ' . $message, $context);
    }

    public static function jobs(string $message, array $context = []): void
    {
        self::log('jobs', '💼 ' . $message, $context);
    }

    public static function applications(string $message, array $context = []): void
    {
        self::log('applications', '📄 ' . $message, $context);
    }

    public static function users(string $message, array $context = []): void
    {
        self::log('users', '👤 ' . $message, $context);
    }

    public static function cms(string $message, array $context = []): void
    {
        self::log('cms', '📝 ' . $message, $context);
    }

    public static function system(string $message, array $context = []): void
    {
        self::log('system', '⚙️ ' . $message, $context);
    }

    public static function ats(string $message, array $context = []): void
    {
        self::log('ats', '🤖 ' . $message, $context);
    }
}
