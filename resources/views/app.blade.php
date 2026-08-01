<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    class="{{ ($appearance ?? 'system') === 'dark' ? 'dark' : '' }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <base href="{{ rtrim(url('/'), '/') }}/">

    <!-- SEO -->
    <title inertia>Dwip Unnayan Songstha </title>

    <meta name="description"
        content="Dwip Unnayan Songstha (DUS) is a non-governmental organization dedicated to sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">

    <meta name="keywords"
        content="Dwip Unnayan Songstha, DUS, NGO Bangladesh, island development, sustainable development, community empowerment, education, healthcare, livelihood support, coastal communities, NGO">

    <meta name="author" content="Dwip Unnayan Songstha">

    <meta name="robots" content="index, follow">

    <link rel="canonical" href="{{ url()->current() }}">

    <!-- Open Graph (Facebook, LinkedIn, Discord, etc.) -->
    <meta property="og:type" content="website">

    <meta property="og:title" content="Dwip Unnayan Songstha - Empowering Island Communities">

    <meta property="og:description"
        content="Dwip Unnayan Songstha (DUS) works for sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">

    <meta property="og:url" content="{{ url()->current() }}">

    <meta property="og:image" content="{{ asset('storage/images/dus-logo-og.png') }}">

    <meta property="og:site_name" content="Dwip Unnayan Songstha">

    <meta property="og:locale" content="bn_BD">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">

    <meta name="twitter:title" content="Dwip Unnayan Songstha - Empowering Island Communities">

    <meta name="twitter:description"
        content="Dwip Unnayan Songstha (DUS) works for sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">

    <meta name="twitter:image" content="{{ asset('storage/images/dus-logo-og.png') }}">

    <!-- Improved: Theme detection with reduced flash -->
    <script>
        (function() {
            const appearance = @json($appearance ?? 'system');
            const root = document.documentElement;

            if (appearance === 'dark') {
                root.classList.add('dark');
            } else if (appearance === 'light') {
                root.classList.remove('dark');
            } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.classList.add('dark');
            }
        })();
    </script>

    <!-- Improved: Critical CSS inline to prevent flash -->
    <style>
        html {
            background-color: oklch(1 0 0);
            color-scheme: light;
            -webkit-text-size-adjust: 100%;
        }

        html.dark {
            background-color: oklch(0.145 0 0);
            color-scheme: dark;
        }

        body {
            min-height: 100vh;
            min-height: 100dvh;
            margin: 0;
            padding: 0;
        }

        /* Custom NGO colors - DUS Brand Colors */
        :root {
            --dus-primary: #006B3F;
            --dus-secondary: #FF9933;
            --dus-accent: #1A5C8E;
        }
    </style>

    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta name="theme-color" content="{{ ($appearance ?? 'system') === 'dark' ? '#1a2a3a' : '#006B3F' }}">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Dynamic Favicon from Storage -->
    @php
        $storagePath = storage_path('app/public/images');
        $iconPngPath = $storagePath . '/dus-icon.png';
        $iconSvgPath = $storagePath . '/dus-icon.svg';
        $iconIcoPath = $storagePath . '/dus-icon.ico';

        use Illuminate\Support\Facades\Storage;
        $disk = Storage::disk('public');
        $hasIconPng = $disk->exists('images/dus-icon.png');
        $hasIconSvg = $disk->exists('images/dus-icon.svg');
        $hasIconIco = $disk->exists('images/dus-icon.ico');
    @endphp

    <!-- Favicon with dynamic detection from storage -->
    @if ($hasIconSvg)
        <link rel="icon" href="{{ asset('storage/images/dus-icon.svg') }}" type="image/svg+xml">
    @endif

    @if ($hasIconPng)
        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('storage/images/dus-icon.png') }}">
        <link rel="icon" type="image/png" sizes="16x16" href="{{ asset('storage/images/dus-icon.png') }}">
        <link rel="apple-touch-icon" href="{{ asset('storage/images/dus-icon.png') }}">
    @elseif($hasIconIco)
        <link rel="icon" href="{{ asset('storage/images/dus-icon.ico') }}" type="image/x-icon">
        <link rel="shortcut icon" href="{{ asset('storage/images/dus-icon.ico') }}" type="image/x-icon">
    @else
        <!-- Fallback default icon -->
        <link rel="icon" href="{{ asset('images/dus-default-icon.png') }}" type="image/png">
    @endif

    <!-- Added: Web app manifest for PWA support -->
    <link rel="manifest" href="{{ asset('manifest.json') }}" crossorigin="use-credentials">

    <!-- Improved: Font loading with preload for performance -->
    <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
    <link rel="preload" as="style"
        href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|noto-sans-bengali:400,600,700&display=swap">
    <link rel="stylesheet"
        href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|noto-sans-bengali:400,600,700&display=swap"
        media="print" onload="this.media='all'">
    <noscript>
        <link rel="stylesheet"
            href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|noto-sans-bengali:400,600,700&display=swap">
    </noscript>

    <!-- Improved: Preconnect for external resources -->
    <link rel="preconnect" href="https://{{ config('app.url') }}" crossorigin>

    <!-- Added: Resource hints for performance -->
    <link rel="dns-prefetch" href="https://fonts.bunny.net">
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>

    <!-- Added: Progressive Web App meta tags -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Dwip Unnayan Songstha">

    <!-- Additional NGO-specific meta tags -->
    <meta name="organization-type" content="NGO">
    <meta name="organization-registration" content="Registered with NGO Affairs Bureau, Bangladesh">
    <meta name="target-region" content="Island Communities of Bangladesh">

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    {{-- Added: Skip to main content --}}
    <a href="#main"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg">
        Skip to main content
    </a>

    {{-- Added: Loading spinner with DUS branding --}}
    <div id="app-loading" aria-hidden="true"
        class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-opacity duration-300">
        <div class="w-12 h-12 border-4 border-green-200 border-t-[#006B3F] rounded-full animate-spin"></div>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">Loading Dwip Unnayan Songstha...</p>
    </div>

    <main id="main">
        @inertia
    </main>

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
