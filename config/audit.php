<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    | The audit trail is append-only. `audit:prune` removes entries older
    | than this many days; without it the table would grow without bound.
    */

    'retention_days' => (int) env('AUDIT_RETENTION_DAYS', 365),

    /*
    |--------------------------------------------------------------------------
    | Record Failed Sign-ins
    |--------------------------------------------------------------------------
    | Failed authentication attempts are recorded by default. Turn this off
    | only if the volume becomes a problem — they are the cheapest signal
    | for detecting credential stuffing.
    */

    'record_failed_logins' => (bool) env('AUDIT_RECORD_FAILED_LOGINS', true),

    /*
    |--------------------------------------------------------------------------
    | Ignored Fields
    |--------------------------------------------------------------------------
    | Extra input keys treated as sensitive by AuditLogger, on top of the
    | built-in password / token / secret list.
    */

    'redacted_keys' => array_filter(array_map(
        'trim',
        explode(',', (string) env('AUDIT_REDACTED_KEYS', ''))
    )),

];
