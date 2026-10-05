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
    | Critically, an incomplete scan is never presented as a clean result. Every
    | asset carries one of three states:
    |
    |   referenced — the name was found
    |   unused     — every source file and every stored value was searched, and
    |                nothing matched. Only this state may be deleted.
    |   unknown    — the scan could not search everywhere (no database, an
    |                unreadable table, a table past max_rows_per_table). Nothing
    |                can be concluded, so deletion is refused, force or not.
    |
    | A reference that was never read is indistinguishable from a reference that
    | does not exist, and that gap is exactly how a live image gets deleted.
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

            /*
             * An explicit allowlist, measured against this project.
             *
             * Scanning every table looked thorough but was almost entirely
             * wasted: of 3680 rows read, 3594 belonged to tables that never
             * mention an asset name, and job_views alone contributed 2317. Worse,
             * reading them all on every render is what made the page slow enough
             * to want paginating in the first place.
             *
             * An asset only exists in one of two places:
             *   - CMS content — the images an admin uploads through the section
             *     editor, referenced from the content tables below
             *   - applicant documents — CVs and résumé files, which the applicant
             *     tables store by path
             *
             * Nothing else points at an uploaded file. Adding a table here is
             * the only thing needed when a new content type is introduced.
             */
            'tables' => [
                // CMS content.
                'custom_section_data',
                'shared_data',
                'programs',
                'blogs',
                'publications',
                'about_content',
                'pages',
                'section_configs',

                // Applicant documents and photos.
                'applicant_cvs',
                'applicant_profiles',
                'applications',
            ],

            /*
             * Narrow the scanned columns where the table stores a mix of
             * relevant and bulky irrelevant text.
             *
             * Without this, applications contributes ats_score, matched_keywords,
             * missing_keywords and employer_notes — hundreds of longtext values
             * that cannot contain a file name.
             */
            'columns' => [
                'applicant_cvs' => ['cv_path', 'original_name'],
                'applications' => ['resume_path'],
                'applicant_profiles' => ['photo_path', 'social_links'],
            ],

            // Defence in depth: still skipped if named in the allowlist above.
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
            //
            // This is a genuine limit on how much can be verified, not just a
            // performance knob: a reference past it cannot be found, and an
            // unread row looks exactly like an absent reference. Reaching it
            // therefore downgrades every unreferenced file to "unknown" and
            // blocks its deletion, rather than quietly reporting it as unused.
            // The old value of 2000 was low enough to be hit by ordinary tables
            // such as users, and did exactly that.
            'max_rows_per_table' => 50000,
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