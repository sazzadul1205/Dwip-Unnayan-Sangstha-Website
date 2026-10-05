<?php

// config/asset-library.php
//
// Configuration for the admin asset manager (Image / Asset Management).
//
// The manager is deliberately filesystem-driven: it reads whatever is on disk
// under the roots below and never queries the database, so it keeps working
// when the database is unavailable (migrations running, a broken connection,
// a fresh checkout that has not been seeded yet).

return [

    /*
    |---------------------------------------------------------------------------
    | Scanned roots
    |---------------------------------------------------------------------------
    |
    | Every file under these directories shows up in the asset manager. Paths
    | are absolute; the `label` is what the browser shows as the root name and
    | the `url_prefix` is prepended to build the public URL for each file.
    |
    | `url_prefix` must point at the web path that serves that directory. For the
    | default `public` disk, storage/app/public is exposed at /storage by the
    | `public/storage` link, so a file stored as "banner/x.jpg" is served from
    | /storage/banner/x.jpg.
    |
    */
    'roots' => [
        [
            'path' => 'storage/app/public',
            'label' => 'Uploads',
            'url_prefix' => '/storage',
        ],
        [
            'path' => 'public/images',
            'label' => 'Public images',
            'url_prefix' => '/images',
        ],
    ],

    /*
    |---------------------------------------------------------------------------
    | Extension metadata
    |---------------------------------------------------------------------------
    |
    | Extension => category. The category drives the icon, the filter tabs and
    | whether the manager tries to read image dimensions. Extensions that are not
    | listed fall into the "other" category and are still listed and deletable.
    |
    */
    'categories' => [
        'image' => [
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'ico', 'svg', 'tif', 'tiff',
        ],
        'video' => ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v'],
        'audio' => ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
        'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt'],
        'archive' => ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    ],

    /*
    |---------------------------------------------------------------------------
    | Reference detection
    |---------------------------------------------------------------------------
    |
    | An asset counts as "in use" when its file name appears in one of the source
    | files below, or — when enabled — in stored CMS content.
    |
    | The source scan alone is not enough to spot orphans. Uploads are given a
    | generated file name such as "20260711_0147bd33-....jpg", which by design
    | appears in no source file; the reference lives in the database instead. On
    | a content-managed site a code-only scan therefore reports almost every
    | asset as unused, which is worse than no answer at all.
    |
    | So the content scan is on by default. It is strictly optional and fully
    | guarded: if the database is unreachable the page still renders, it just
    | falls back to the code-only result and says so in the UI.
    |
    | Set `database.enabled` to false for a strictly filesystem-only scan.
    |
    */
    'reference_scan' => [
        'paths' => [
            'app',
            'config',
            'database',
            'public',
            'resources',
            'routes',
        ],

        // Directories never worth scanning: build output duplicates hashed files,
        // and public/storage is a link back into storage/app/public.
        'exclude' => [
            'public/build',
            'public/storage',
            'public/hot',
            'node_modules',
            'vendor',
            '.git',
        ],

        'extensions' => [
            'php', 'blade.php', 'js', 'jsx', 'mjs', 'ts', 'tsx', 'css', 'scss',
            'json', 'md', 'txt', 'env', 'sql', 'xml', 'yml', 'yaml', 'html',
        ],

        // Files that are only ever loaded dynamically (for example the icon
        // resolver in app.blade.php reads them by folder name). Listed here so
        // they are not reported as unused.
        'always_referenced' => [
            'Uploads/images/favicon.png',
            'Uploads/images/preloader.png',
        ],

        'database' => [
            'enabled' => true,

            // null means "discover every table and use the ones that are not
            // excluded", so new content tables are covered automatically.
            'tables' => null,

            'exclude' => [
                // Infrastructure: nothing here ever points at an uploaded file.
                'migrations', 'password_reset_tokens', 'password_resets',
                'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches',
                'failed_jobs', 'personal_access_tokens', 'telescope_entries',
                'telescope_queries', 'telescope_requests', 'telescope_commands',

                // Schema and access control.
                'permissions', 'roles', 'role_permissions', 'role_user',
                'model_has_roles', 'model_has_permissions', 'media',
            ],

            // Column types treated as searchable text.
            'column_types' => [
                'string', 'text', 'longtext', 'mediumtext', 'tinytext',
                'json', 'jsonb', 'uuid', 'char', 'varchar',
            ],

            // Safety valve for a table that somehow holds a huge number of rows.
            'max_rows_per_table' => 2000,
        ],
    ],

    /*
    |---------------------------------------------------------------------------
    | Limits
    |---------------------------------------------------------------------------
    */

    // Guard against pointing the scanner at a drive root by accident.
    'max_files' => 5000,

    // Seconds to reuse a scan. Reference detection re-reads source files, so it
    // is worth caching; deleting an asset clears the cache immediately.
    'cache_ttl' => 300,

    // Skipped while walking: editor swap files, OS metadata, partial uploads.
    'skip_patterns' => ['*.tmp', '*.part', '*.crdownload', '.DS_Store', 'Thumbs.db', 'desktop.ini', '*.lnk'],
];