<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Log Types
    |--------------------------------------------------------------------------
    | The file-based log types that appear in the log viewer. Each entry maps
    | the internal key to a human-readable label. The key is also the file
    | name stem (e.g. "security" => storage/logs/security.log).
    */

    'log_types' => [
        'security' => '🔒 Security Logs',
        'jobs' => '💼 Jobs Log',
        'applications' => '📄 Applications Log',
        'users' => '👤 Users Log',
        'cms' => '📝 CMS Log',
        'system' => '⚙️ System Log',
        'ats' => '🤖 ATS Log',
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    | Old log files grow without bound. `logs:prune` removes entries older
    | than this many days; without it the files would grow indefinitely.
    */

    'retention_days' => (int) env('SYSTEM_LOG_RETENTION_DAYS', 90),

    /*
    |--------------------------------------------------------------------------
    | Max Lines Per File
    |--------------------------------------------------------------------------
    | SimpleLogger rotates each file when it exceeds this many lines, keeping
    | the most recent half so recent context is always available.
    */

    'max_lines' => (int) env('SYSTEM_LOG_MAX_LINES', 10000),

    /*
    |--------------------------------------------------------------------------
    | Read Limit
    |--------------------------------------------------------------------------
    | How many of the most recent lines the viewer reads by default.
    */

    'read_limit' => (int) env('SYSTEM_LOG_READ_LIMIT', 200),

    /*
    |--------------------------------------------------------------------------
    | Export Limit
    |--------------------------------------------------------------------------
    | Maximum number of entries that can be exported to CSV in a single
    | request. Protects against memory exhaustion on huge files.
    */

    'export_limit' => (int) env('SYSTEM_LOG_EXPORT_LIMIT', 5000),

    /*
    |--------------------------------------------------------------------------
    | Cache TTL
    |--------------------------------------------------------------------------
    | Duration (in seconds) that the viewer and stats endpoints cache their
    | file reads.
    */

    'cache_ttl' => (int) env('SYSTEM_LOG_CACHE_TTL', 60),

    /*
    |--------------------------------------------------------------------------
    | Highlight Patterns
    |--------------------------------------------------------------------------
    | Substrings that cause a log entry row to be highlighted (red) in the UI.
    */

    'highlight_patterns' => [
        '❌',
        '🔴',
        'Failed',
        'failed',
        'error',
        'Error',
        'deleted',
        'Deleted',
        'permanently',
        'Permanently',
    ],

];
