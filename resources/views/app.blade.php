<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    class="{{ ($appearance ?? 'system') === 'dark' ? 'dark' : '' }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <base href="{{ rtrim(url('/'), '/') }}/">

    <!-- SEO -->
    <title inertia>Dwip Unnayan Songstha</title>

    <meta name="description"
        content="Dwip Unnayan Songstha (DUS) is a non-governmental organization dedicated to sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">

    <meta name="keywords"
        content="Dwip Unnayan Songstha, DUS, NGO Bangladesh, island development, sustainable development, community empowerment, education, healthcare, livelihood support, coastal communities, NGO">

    <meta name="author" content="Dwip Unnayan Songstha">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{{ url()->current() }}">

    <!-- Open Graph -->
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

    <!-- Theme detection -->
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

    <!-- Critical CSS -->
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

        :root {
            --dus-primary: #006B3F;
            --dus-secondary: #FF9933;
            --dus-accent: #1A5C8E;
            --dus-primary-light: #008a50;
            --dus-primary-dark: #004d2d;
            --dus-gold: #D4A843;
            --dus-teal: #2A9D8F;
        }

        /* ─── MODERN LOADER ─── */
        #app-loading {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            transition: opacity 0.6s ease, visibility 0.6s ease;
        }

        html.dark #app-loading {
            background: #0d1117;
        }

        #app-loading.hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }

        .loader-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            max-width: 420px;
            width: 100%;
            text-align: center;
        }

        /* ── Animated Emblem ── */
        .loader-emblem {
            position: relative;
            width: 120px;
            height: 120px;
            margin-bottom: 1.75rem;
            flex-shrink: 0;
        }

        .loader-emblem svg {
            width: 100%;
            height: 100%;
            display: block;
        }

        /* Rotating ring */
        .emblem-ring {
            animation: spin-ring 4s linear infinite;
            transform-origin: center;
        }

        @keyframes spin-ring {
            to {
                transform: rotate(360deg);
            }
        }

        /* Pulsing core */
        .emblem-core {
            animation: pulse-core 2.4s ease-in-out infinite;
            transform-origin: center;
        }

        @keyframes pulse-core {

            0%,
            100% {
                transform: scale(1);
                opacity: 0.9;
            }

            50% {
                transform: scale(1.08);
                opacity: 1;
            }
        }

        /* Floating elements */
        .emblem-float {
            animation: float-element 3.2s ease-in-out infinite;
        }

        .emblem-float:nth-child(2) {
            animation-delay: 0.6s;
        }

        .emblem-float:nth-child(3) {
            animation-delay: 1.2s;
        }

        @keyframes float-element {

            0%,
            100% {
                transform: translateY(0) scale(1);
            }

            50% {
                transform: translateY(-6px) scale(1.05);
            }
        }

        /* Wave animation */
        .emblem-wave {
            animation: wave-motion 2.8s ease-in-out infinite;
            transform-origin: bottom;
        }

        @keyframes wave-motion {

            0%,
            100% {
                transform: scaleX(1) translateY(0);
            }

            50% {
                transform: scaleX(1.04) translateY(-2px);
            }
        }

        /* ── Typography ── */
        .loader-title {
            font-family: 'Instrument Sans', 'Noto Sans Bengali', system-ui, sans-serif;
            font-size: 1.6rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: var(--dus-primary);
            margin: 0 0 0.2rem 0;
            line-height: 1.2;
        }

        html.dark .loader-title {
            color: #e8edf3;
        }

        .loader-title span {
            color: var(--dus-secondary);
        }

        html.dark .loader-title span {
            color: #FFB347;
        }

        .loader-tagline {
            font-family: 'Instrument Sans', 'Noto Sans Bengali', system-ui, sans-serif;
            font-size: 0.95rem;
            font-weight: 400;
            color: #4b5563;
            margin: 0 0 2rem 0;
            letter-spacing: 0.02em;
        }

        html.dark .loader-tagline {
            color: #9ca3af;
        }

        /* ── Progress Bar ── */
        .loader-progress-track {
            width: 100%;
            height: 5px;
            background: #e5e7eb;
            border-radius: 999px;
            overflow: hidden;
            position: relative;
            margin-bottom: 1rem;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        html.dark .loader-progress-track {
            background: #1f2937;
        }

        .loader-progress-fill {
            width: 0%;
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, var(--dus-primary), var(--dus-teal), var(--dus-secondary));
            background-size: 200% 100%;
            animation: fill-progress 2.8s ease-in-out forwards, shimmer 1.8s ease-in-out infinite;
            transition: width 0.15s ease-out;
        }

        @keyframes fill-progress {
            0% {
                width: 0%;
            }

            20% {
                width: 18%;
            }

            45% {
                width: 42%;
            }

            70% {
                width: 68%;
            }

            88% {
                width: 86%;
            }

            100% {
                width: 100%;
            }
        }

        @keyframes shimmer {

            0%,
            100% {
                background-position: 0% 0%;
            }

            50% {
                background-position: 100% 0%;
            }
        }

        /* ── Status text with dots ── */
        .loader-status {
            font-family: 'Instrument Sans', 'Noto Sans Bengali', system-ui, sans-serif;
            font-size: 0.8rem;
            font-weight: 500;
            color: #6b7280;
            letter-spacing: 0.04em;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            margin: 0;
        }

        html.dark .loader-status {
            color: #9ca3af;
        }

        .loader-status .dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: var(--dus-primary);
            border-radius: 50%;
            animation: dot-bounce 1.4s ease-in-out infinite;
        }

        .loader-status .dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .loader-status .dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        html.dark .loader-status .dot {
            background: #60a5fa;
        }

        @keyframes dot-bounce {

            0%,
            80%,
            100% {
                transform: scale(0.6);
                opacity: 0.4;
            }

            40% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* ── Mission carousel ── */
        .loader-mission {
            font-family: 'Instrument Sans', 'Noto Sans Bengali', system-ui, sans-serif;
            font-size: 0.75rem;
            font-weight: 400;
            color: #9ca3af;
            margin: 0.75rem 0 0 0;
            height: 1.4em;
            overflow: hidden;
            position: relative;
            width: 100%;
        }

        .loader-mission-inner {
            display: flex;
            flex-direction: column;
            animation: mission-slide 9s ease-in-out infinite;
        }

        .loader-mission-inner span {
            display: block;
            height: 1.4em;
            line-height: 1.4;
            white-space: nowrap;
            color: #6b7280;
        }

        html.dark .loader-mission-inner span {
            color: #9ca3af;
        }

        @keyframes mission-slide {

            0%,
            28% {
                transform: translateY(0);
            }

            33%,
            61% {
                transform: translateY(-1.4em);
            }

            66%,
            94% {
                transform: translateY(-2.8em);
            }

            100% {
                transform: translateY(-2.8em);
            }
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
            .loader-emblem {
                width: 88px;
                height: 88px;
            }

            .loader-title {
                font-size: 1.25rem;
            }

            .loader-tagline {
                font-size: 0.8rem;
            }

            .loader-status {
                font-size: 0.7rem;
            }

            .loader-mission {
                font-size: 0.65rem;
            }
        }

        /* ── Reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
            .loader-emblem * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
            }

            .loader-progress-fill {
                animation: fill-progress 3s ease-out forwards !important;
                background: var(--dus-primary) !important;
            }

            .loader-mission-inner {
                animation: none !important;
            }

            .loader-mission-inner span:not(:first-child) {
                display: none;
            }
        }
    </style>

    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta name="theme-color" content="{{ ($appearance ?? 'system') === 'dark' ? '#0d1117' : '#006B3F' }}">

    <!-- CSRF Token -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Favicon -->
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
        <link rel="icon" href="{{ asset('images/dus-default-icon.png') }}" type="image/png">
    @endif

    <link rel="manifest" href="{{ asset('manifest.json') }}" crossorigin="use-credentials">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
    <link rel="preload" as="style"
        href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|noto-sans-bengali:400,600,700&display=swap">
    <link rel="stylesheet"
        href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|noto-sans-bengali:400,600,700&display=swap"
        media="print" onload="this.media='all'">
    <noscript>
        <link rel="stylesheet"
            href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700|noto-sans-bengali:400,600,700&display=swap">
    </noscript>

    <link rel="preconnect" href="https://{{ config('app.url') }}" crossorigin>
    <link rel="dns-prefetch" href="https://fonts.bunny.net">
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>

    <!-- PWA -->
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Dwip Unnayan Songstha">

    <!-- NGO meta -->
    <meta name="organization-type" content="NGO">
    <meta name="organization-registration" content="Registered with NGO Affairs Bureau, Bangladesh">
    <meta name="target-region" content="Island Communities of Bangladesh">

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>

<body class="font-sans antialiased">

    <!-- ─── SKIP LINK ─── -->
    <a href="#main"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg">
        Skip to main content
    </a>

    <!-- ─── MODERN LOADER ─── -->
    <div id="app-loading" role="status" aria-label="Loading Dwip Unnayan Songstha">
        <div class="loader-container">

            <!-- Animated Emblem -->
            <div class="loader-emblem" aria-hidden="true">
                <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Outer ring -->
                    <circle class="emblem-ring" cx="60" cy="60" r="54"
                        stroke="var(--dus-primary, #006B3F)" stroke-width="2.5" stroke-dasharray="8 8"
                        stroke-linecap="round" opacity="0.3" />
                    <circle class="emblem-ring" cx="60" cy="60" r="48"
                        stroke="var(--dus-secondary, #FF9933)" stroke-width="1.8" stroke-dasharray="4 12"
                        stroke-linecap="round" opacity="0.25"
                        style="animation-duration: 6s; animation-direction: reverse;" />

                    <!-- Core circle -->
                    <circle class="emblem-core" cx="60" cy="60" r="32"
                        fill="var(--dus-primary, #006B3F)" opacity="0.10" />
                    <circle class="emblem-core" cx="60" cy="60" r="24"
                        fill="var(--dus-primary, #006B3F)" opacity="0.15" style="animation-delay: 0.2s;" />

                    <!-- Island / Land -->
                    <g transform="translate(60, 68)">
                        <path class="emblem-float"
                            d="M-28 4C-22 -6 -8 -10 0 -8C8 -10 22 -6 28 4C22 10 8 12 0 12C-8 12 -22 10 -28 4Z"
                            fill="var(--dus-primary, #006B3F)" opacity="0.85" />
                        <path class="emblem-float"
                            d="M-16 2C-12 -4 -4 -6 0 -5C4 -6 12 -4 16 2C12 6 4 7 0 7C-4 7 -12 6 -16 2Z"
                            fill="var(--dus-secondary, #FF9933)" opacity="0.6" style="animation-delay: 0.4s;" />
                    </g>

                    <!-- Waves -->
                    <g class="emblem-wave" transform="translate(60, 82)">
                        <path d="M-36 0C-28 -6 -16 -6 -8 0C0 6 12 6 20 0C28 -6 40 -6 48 0"
                            stroke="var(--dus-accent, #1A5C8E)" stroke-width="2.2" stroke-linecap="round"
                            opacity="0.5" />
                        <path d="M-30 6C-22 0 -10 0 -2 6C6 12 18 12 26 6C34 0 46 0 54 6"
                            stroke="var(--dus-secondary, #FF9933)" stroke-width="2.2" stroke-linecap="round"
                            opacity="0.35" style="animation-delay: 0.4s;" />
                    </g>

                    <!-- Small stars / dots -->
                    <circle class="emblem-float" cx="30" cy="28" r="2.5"
                        fill="var(--dus-secondary, #FF9933)" opacity="0.5" style="animation-delay: 0.2s;" />
                    <circle class="emblem-float" cx="88" cy="34" r="2"
                        fill="var(--dus-accent, #1A5C8E)" opacity="0.4" style="animation-delay: 0.8s;" />
                    <circle class="emblem-float" cx="22" cy="78" r="1.8"
                        fill="var(--dus-primary, #006B3F)" opacity="0.35" style="animation-delay: 1.4s;" />
                    <circle class="emblem-float" cx="94" cy="72" r="2.2"
                        fill="var(--dus-secondary, #FF9933)" opacity="0.4" style="animation-delay: 0.5s;" />
                </svg>
            </div>

            <!-- Title -->
            <h1 class="loader-title">
                Dwip <span>Unnayan</span> Songstha
            </h1>

            <!-- Tagline -->
            <p class="loader-tagline">Empowering Island Communities</p>

            <!-- Progress Bar -->
            <div class="loader-progress-track" role="progressbar" aria-valuenow="100" aria-valuemin="0"
                aria-valuemax="100">
                <div class="loader-progress-fill" style="width: 100%;"></div>
            </div>

            <!-- Status with dots -->
            <p class="loader-status">
                <span>Loading</span>
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </p>

            <!-- Mission carousel -->
            <div class="loader-mission" aria-hidden="true">
                <div class="loader-mission-inner">
                    <span>🌱 Sustainable Development</span>
                    <span>📚 Education for All</span>
                    <span>❤️ Healthcare &amp; Livelihood</span>
                </div>
            </div>

        </div>
    </div>

    <!-- ─── MAIN ─── -->
    <main id="main">
        @inertia
    </main>

    <!-- ─── LOADER HIDE SCRIPT ─── -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const loading = document.getElementById('app-loading');
            if (loading) {
                // Ensure progress fills completely before hiding
                const fill = loading.querySelector('.loader-progress-fill');
                if (fill) {
                    fill.style.width = '100%';
                }
                // Fade out after a short delay for smooth experience
                setTimeout(function() {
                    loading.classList.add('hidden');
                    // Remove from DOM after transition
                    setTimeout(function() {
                        if (loading.parentNode) {
                            loading.style.display = 'none';
                        }
                    }, 700);
                }, 600);
            }
        });

        // Fallback: hide loader if page takes too long
        window.addEventListener('load', function() {
            const loading = document.getElementById('app-loading');
            if (loading && !loading.classList.contains('hidden')) {
                loading.classList.add('hidden');
                setTimeout(function() {
                    if (loading.parentNode) {
                        loading.style.display = 'none';
                    }
                }, 700);
            }
        });
    </script>

</body>

</html>
