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

        /* ─── LOADER (matches Figma "loader design" node exactly) ───
           Intentionally NOT theme-aware: this is a fixed splash asset
           shown before the app/theme exists, so it always renders in
           the Figma-specified light palette regardless of html.dark. */
        #app-loading {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fafbfd;
            transition: opacity 0.6s ease, visibility 0.6s ease;
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
            gap: 0.75rem;
            padding: 1rem;
        }

        /* Logo */
        .loader-logo {
            position: relative;
            flex-shrink: 0;
            width: 100px;
            height: 100px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .loader-logo img {
            width: 62px;
            height: 91px;
            object-fit: contain;
        }

        /* Title / Subtitle */
        .loader-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            text-align: center;
            color: #000000;
        }

        .loader-title {
            font-family: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
            font-weight: 800;
            font-size: 20px;
            margin: 0;
            line-height: 1.2;
        }

        .loader-subtitle {
            font-family: 'Instrument Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
            font-weight: 400;
            opacity: 0.5;
            font-size: 12px;
            margin: 0;
            line-height: 1.4;
        }

        /* Progress Bar — grows like a real loading bar (per Figma),
           not a sliding/bouncing shimmer. Eases up to ~92% and holds;
           JS snaps it to 100% right before the loader is hidden. */
        .loader-progress-track {
            position: relative;
            height: 6px;
            width: 100%;
            max-width: 400px;
            border-radius: 7px;
            background: #eaeaea;
            overflow: hidden;
        }

        .loader-progress-track {
            position: relative;
            height: 6px;
            width: 100%;
            max-width: 400px;
            border-radius: 7px;
            overflow: hidden;
            background: linear-gradient(90deg,
                #b76ef0 0%,
                #4fc3f7 18%,
                #34d399 36%,
                #fbbf24 54%,
                #fb923c 68%,
                #f43f5e 82%,
                #ec4899 100%);
        }

        .loader-progress-cover {
            position: absolute;
            inset: 0;
            left: auto;
            width: 99.75%;
            border-radius: 7px;
            background: #eaeaea;
            animation: loader-progress-reveal 1.8s cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }

        .loader-progress-cover.done {
            animation: none;
            width: 0% !important;
            transition: width 0.25s ease;
        }

        @keyframes loader-progress-reveal {
            0%   { width: 99.75%; }
            60%  { width: 25%; }
            100% { width: 8%; }
        }

        /* Responsive */
        @media (max-width: 480px) {
            .loader-logo {
                width: 80px;
                height: 80px;
            }

            .loader-logo img {
                width: 50px;
                height: 73px;
            }

            .loader-title {
                font-size: 16px;
            }

            .loader-subtitle {
                font-size: 10px;
            }

            .loader-progress-track {
                max-width: 280px;
                height: 5px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .loader-progress-cover {
                animation: none !important;
                width: 0% !important;
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

    <!-- ─── LOADER ─── (fixed light splash, matches Figma "loader design" node) -->
    <div id="app-loading" role="status" aria-label="Loading Dwip Unnayan Songstha" aria-busy="true">
        <div class="loader-container">
            <!-- Logo -->
            <div class="loader-logo" aria-hidden="true">
                <img src="{{ asset('images/icon.png') }}"
                    onerror="this.onerror=null;this.src='https://www.figma.com/api/mcp/asset/8a275104-bf1c-4422-93b3-43790ebc5f2f.svg';"
                    alt="Dwip Unnayan Songstha logo" />
            </div>

            <!-- Title / Subtitle -->
            <div class="loader-text">
                <p class="loader-title">Dwip Unnayan Songstha</p>
                <p class="loader-subtitle">Island Development Association</p>
            </div>

            <!-- Progress Bar -->
            <div class="loader-progress-track">
                <div class="loader-progress-cover" id="loader-progress-cover"></div>
            </div>
        </div>
    </div>

    <!-- ─── MAIN ─── -->
    <main id="main">
        @inertia
    </main>

    <!-- ─── LOADER HIDE SCRIPT ─── -->
    <script>
        (function() {
            const loading = document.getElementById('app-loading');
            const cover = document.getElementById('loader-progress-cover');
            if (!loading) return;

            let hidden = false;

            function hideLoader() {
                if (hidden) return;
                hidden = true;
                if (cover) cover.classList.add('done');
                setTimeout(function() {
                    loading.classList.add('hidden');
                    setTimeout(function() {
                        if (loading.parentNode) loading.style.display = 'none';
                    }, 700);
                }, 200);
            }

            // Hide once Inertia has actually mounted content into #main,
            // instead of guessing with DOMContentLoaded/setTimeout.
            const mainEl = document.getElementById('main');
            if (mainEl && mainEl.children.length > 0) {
                hideLoader();
            } else if (mainEl) {
                const observer = new MutationObserver(function() {
                    if (mainEl.children.length > 0) {
                        observer.disconnect();
                        hideLoader();
                    }
                });
                observer.observe(mainEl, { childList: true, subtree: true });
            }

            // Fallback safety net so the loader never gets stuck.
            window.addEventListener('load', function() {
                setTimeout(hideLoader, 4000);
            });
        })();
    </script>

</body>

</html>