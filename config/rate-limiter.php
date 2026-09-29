<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rate Limiter Configuration
    |--------------------------------------------------------------------------
    */

    'limiter' => env('RATE_LIMITER', 'redis'),

    'default' => [
        'web' => [
            'limit' => env('RATE_LIMIT_WEB', 100),
            'decay' => env('RATE_LIMIT_WEB_DECAY', 60), // per minute
        ],
        'api' => [
            'limit' => env('RATE_LIMIT_API', 60),
            'decay' => env('RATE_LIMIT_API_DECAY', 60), // per minute
        ],
        'auth' => [
            'limit' => env('RATE_LIMIT_AUTH', 5),
            'decay' => env('RATE_LIMIT_AUTH_DECAY', 60), // per minute
        ],
        'password_reset' => [
            'limit' => env('RATE_LIMIT_PASSWORD_RESET', 3),
            'decay' => env('RATE_LIMIT_PASSWORD_RESET_DECAY', 900), // per 15 minutes
        ],
        'register' => [
            'limit' => env('RATE_LIMIT_REGISTER', 3),
            'decay' => env('RATE_LIMIT_REGISTER_DECAY', 900), // per 15 minutes
        ],
        'email_verification' => [
            'limit' => env('RATE_LIMIT_EMAIL_VERIFICATION', 5),
            'decay' => env('RATE_LIMIT_EMAIL_VERIFICATION_DECAY', 3600), // per hour
        ],
    ],

];