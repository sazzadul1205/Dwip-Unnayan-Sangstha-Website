<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    class="{{ ($appearance ?? 'system') === 'dark' ? 'dark' : '' }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <base href="{{ rtrim(url('/'), '/') }}/">

    <!-- ✅ Improved: Theme detection with reduced flash -->
    <script>
        (function() {
            const appearance = @json($appearance ?? 'system');
            const root = document.documentElement;

            // Optimize: Only add/remove classes, no other DOM operations
            if (appearance === 'dark') {
                root.classList.add('dark');
            } else if (appearance === 'light') {
                root.classList.remove('dark');
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            }
        })();
    </script>

    <!-- ✅ Improved: Critical CSS inline to prevent flash -->
    <style>
        /* Optimized initial render */
        html {
            background-color: oklch(1 0 0);
            color-scheme: light;
            -webkit-text-size-adjust: 100%;
        }

        html.dark {
            background-color: oklch(0.145 0 0);
            color-scheme: dark;
        }

        /* Prevent layout shift during loading */
        body {
            min-height: 100vh;
            min-height: 100dvh;
            /* Dynamic viewport height for mobile */
            margin: 0;
            padding: 0;
        }
    </style>

    <!-- ✅ Improved: Security headers via meta tags -->
    {{-- <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.bunny.net; font-src 'self' https://fonts.bunny.net; img-src 'self' data: https:; connect-src 'self' https:;"> --}}
    <meta name="referrer" content= "strict-origin-when-cross-origin">
    <meta name="theme-color" content="{{ ($appearance ?? 'system') === 'dark' ? '#252525' : '#ffffff' }}">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- ✅ Improved: Favicon with proper sizes and fallbacks -->
    <link rel="icon" href="{{ asset('images/icon.png') }}">
    <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('storage/images/icon.png') }}">
    <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('storage/images/icon.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('storage/images/icon.png') }}">

    <!-- ✅ Added: Web app manifest for PWA support -->
    {{-- <link rel="manifest" href="{{ asset('manifest.json') }}" crossorigin="use-credentials"> --}}

    <!-- ✅ Improved: Font loading with preload for performance -->
    <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
    <link rel="preload" as="style"
        href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600&display=swap">
    <link rel="stylesheet" href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600&display=swap"
        media="print" onload="this.media='all'">
    <noscript>
        <link rel="stylesheet" href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600&display=swap">
    </noscript>

    <!-- ✅ Improved: Preconnect for external resources -->
    <link rel="preconnect" href="https://{{ config('app.url') }}" crossorigin>

    <!-- ✅ Added: Resource hints for performance -->
    <link rel="dns-prefetch" href="https://fonts.bunny.net">
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>

    <!-- ✅ Added: Progressive Web App meta tags -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="{{ config('app.name') }}">

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    <!-- ✅ Added: Skip to main content for accessibility -->
    <a href="#main"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg">
        Skip to main content
    </a>

    <!-- ✅ Added: Loading indicator placeholder -->
    <div id="app-loading" aria-hidden="true"
        class="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 transition-opacity duration-300">
        <div class="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>

    @inertia

    <!-- ✅ Added: Script to remove loading indicator -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const loading = document.getElementById('app-loading');
            if (loading) {
                loading.classList.add('opacity-0');
                setTimeout(() => loading.remove(), 300);
            }
        });
    </script>
</body>

</html>
