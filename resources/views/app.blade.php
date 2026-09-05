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

    @php
        // Helper to get icon URL with cache busting
        function getIconUrl($type, $default = null)
        {
            $disk = Storage::disk('public');
            $path = 'images/';
            $prefixes = [
                'favicon' => 'favicon',
                'preloader' => 'preloader',
                'og-image' => 'og-image',
                'apple-touch' => 'apple-touch-icon',
                'site-icon' => 'icon',
                'logo' => 'logo',
            ];
            $prefix = $prefixes[$type] ?? $type;
            $extensions = ['png', 'svg', 'ico', 'jpg', 'jpeg', 'webp'];
            foreach ($extensions as $ext) {
                $file = $prefix . '.' . $ext;
                if ($disk->exists($path . $file)) {
                    $url = asset('storage/' . $path . $file);
                    $mtime = $disk->lastModified($path . $file);
                    return $url . '?v=' . $mtime;
                }
            }
            return $default;
        }

        $faviconUrl = getIconUrl('favicon');
        $appleTouchUrl = getIconUrl('apple-touch');
        $preloaderUrl = getIconUrl('preloader', asset('images/pre-loader-icon.png'));
        $ogImageUrl = getIconUrl('og-image', asset('storage/images/dus-logo-og.png'));
        $siteIconUrl = getIconUrl('site-icon');
        $logoUrl = getIconUrl('logo');
    @endphp

    <!-- Open Graph image -->
    <meta property="og:image" content="{{ $ogImageUrl }}">
    <meta property="og:site_name" content="Dwip Unnayan Songstha">
    <meta property="og:locale" content="bn_BD">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Dwip Unnayan Songstha - Empowering Island Communities">
    <meta name="twitter:description"
        content="Dwip Unnayan Songstha (DUS) works for sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">
    <meta name="twitter:image" content="{{ $ogImageUrl }}">

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
        /* ... your existing styles (unchanged) ... */
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

        #app-loading {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fafbfd;
            transition: opacity 0.2s ease, visibility 0.2s ease;
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

        .loader-progress-track {
            position: relative;
            height: 6px;
            width: 100%;
            max-width: 400px;
            border-radius: 7px;
            overflow: hidden;
            background: linear-gradient(90deg,
                    #b76ef0 0%, #4fc3f7 18%, #34d399 36%, #fbbf24 54%,
                    #fb923c 68%, #f43f5e 82%, #ec4899 100%);
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
            0% {
                width: 99.75%;
            }

            60% {
                width: 25%;
            }

            100% {
                width: 8%;
            }
        }

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

        @media (min-width: 1024px) {
            .loader-container {
                gap: 1rem;
            }

            .loader-logo {
                width: 130px;
                height: 130px;
            }

            .loader-logo img {
                width: 81px;
                height: 118px;
            }

            .loader-title {
                font-size: 26px;
            }

            .loader-subtitle {
                font-size: 14px;
            }

            .loader-progress-track {
                max-width: 480px;
                height: 7px;
            }
        }

        @media (min-width: 1440px) {
            .loader-container {
                gap: 1.25rem;
            }

            .loader-logo {
                width: 150px;
                height: 150px;
            }

            .loader-logo img {
                width: 93px;
                height: 137px;
            }

            .loader-title {
                font-size: 30px;
            }

            .loader-subtitle {
                font-size: 16px;
            }

            .loader-progress-track {
                max-width: 560px;
                height: 8px;
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

    <!-- ─── DYNAMIC FAVICONS ─── -->
    @if ($faviconUrl)
        <link rel="icon" href="{{ $faviconUrl }}" type="image/x-icon">
        <link rel="shortcut icon" href="{{ $faviconUrl }}" type="image/x-icon">
        <!-- Also provide PNG/SVG variants if available -->
        @php
            $disk = Storage::disk('public');
            $faviconPng = $disk->exists('images/favicon.png')
                ? asset('storage/images/favicon.png?v=' . $disk->lastModified('images/favicon.png'))
                : null;
            $faviconSvg = $disk->exists('images/favicon.svg')
                ? asset('storage/images/favicon.svg?v=' . $disk->lastModified('images/favicon.svg'))
                : null;
        @endphp
        @if ($faviconPng)
            <link rel="icon" type="image/png" sizes="32x32" href="{{ $faviconPng }}">
            <link rel="icon" type="image/png" sizes="16x16" href="{{ $faviconPng }}">
        @endif
        @if ($faviconSvg)
            <link rel="icon" href="{{ $faviconSvg }}" type="image/svg+xml">
        @endif
    @else
        <!-- Default fallback -->
        <link rel="icon" href="{{ asset('images/dus-default-icon.png') }}" type="image/png">
    @endif

    <!-- Apple Touch Icon -->
    @if ($appleTouchUrl)
        <link rel="apple-touch-icon" href="{{ $appleTouchUrl }}">
    @else
        <link rel="apple-touch-icon" href="{{ asset('images/dus-default-icon.png') }}">
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

    <!-- SKIP LINK -->
    <a href="#main"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg">
        Skip to main content
    </a>

    @php
        $isFrontendRoute = request()->routeIs('home', 'sitemap')
            || request()->route('pageSlug') !== null
            || request()->route('detailSlug') !== null;
    @endphp

    <!-- ─── LOADER ─── uses dynamic preloader icon -->
    <div id="app-loading" role="status" aria-label="Loading Dwip Unnayan Songstha" aria-busy="true"
        style="{{ $isFrontendRoute ? '' : 'display: none' }}">
        <div class="loader-container">
            <div class="loader-logo" aria-hidden="true">
                <img src="{{ $preloaderUrl }}"
                    onerror="this.onerror=null;this.src='https://www.figma.com/api/mcp/asset/8a275104-bf1c-4422-93b3-43790ebc5f2f.svg';"
                    alt="Dwip Unnayan Songstha logo" />
            </div>
            <div class="loader-text">
                <p class="loader-title">Dwip Unnayan Songstha</p>
                <p class="loader-subtitle">Island Development Association</p>
            </div>
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
                loading.setAttribute('aria-busy', 'false');
                if (cover) cover.classList.add('done');
                loading.classList.add('hidden');
                setTimeout(function() {
                    if (loading.parentNode) loading.style.display = 'none';
                }, 250);
            }

            function showLoader() {
                hidden = false;
                loading.style.display = 'flex';
                loading.setAttribute('aria-busy', 'true');
                if (cover) cover.classList.remove('done');
                loading.classList.remove('hidden');
            }

            window.addEventListener('app:loading', showLoader);
            window.addEventListener('app:ready', hideLoader);
        })();
    </script>

</body>

</html>
