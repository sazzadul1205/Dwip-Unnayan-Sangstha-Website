<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    class="{{ ($appearance ?? 'system') === 'dark' ? 'dark' : '' }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <base href="{{ rtrim(url('/'), '/') }}/">

    {{-- ============================================ --}}
    {{-- SEO - BASIC META TAGS                        --}}
    {{-- ============================================ --}}
    <title inertia>Dwip Unnayan Songstha - Empowering Island Communities</title>

    <meta name="description"
        content="Dwip Unnayan Songstha (DUS) is a non-governmental organization dedicated to sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">

    <meta name="keywords"
        content="Dwip Unnayan Songstha, DUS, NGO Bangladesh, island development, sustainable development, community empowerment, education, healthcare, livelihood support, coastal communities, NGO">

    <meta name="author" content="Dwip Unnayan Songstha">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{{ url()->current() }}">

    {{-- ============================================ --}}
    {{-- OPEN GRAPH                                   --}}
    {{-- ============================================ --}}
    <meta property="og:type" content="website">
    <meta property="og:title" content="Dwip Unnayan Songstha - Empowering Island Communities">
    <meta property="og:description"
        content="Dwip Unnayan Songstha (DUS) works for sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:site_name" content="Dwip Unnayan Songstha">
    <meta property="og:locale" content="bn_BD">

    @php
        if (!function_exists('getIconUrl')) {
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
        }

        $faviconUrl = getIconUrl('favicon');
        $appleTouchUrl = getIconUrl('apple-touch');
        $preloaderUrl = getIconUrl('preloader', asset('images/pre-loader-icon.png'));
        $ogImageUrl = getIconUrl('og-image', asset('storage/images/dus-logo-og.png'));
        $siteIconUrl = getIconUrl('site-icon');
        $logoUrl = getIconUrl('logo');

        $ogImageFullUrl = $ogImageUrl;
        if (!$ogImageFullUrl || $ogImageFullUrl === asset('storage/images/dus-logo-og.png')) {
            $ogImageFullUrl = asset('images/dus-default-og.jpg');
        }

        $schemaLogo = $logoUrl ?? asset('storage/images/dus-logo.png');

        // Compute once so both <head> and the preloader partial can use it.
        $isFrontendRoute =
            request()->routeIs('home', 'sitemap') ||
            request()->route('pageSlug') !== null ||
            request()->route('detailSlug') !== null;
    @endphp

    <meta property="og:image" content="{{ $ogImageFullUrl }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Dwip Unnayan Songstha - Empowering Island Communities">
    <meta property="og:image:secure_url" content="{{ $ogImageFullUrl }}">
    <meta property="og:image:type" content="image/jpeg">

    {{-- ============================================ --}}
    {{-- TWITTER CARD                                 --}}
    {{-- ============================================ --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Dwip Unnayan Songstha - Empowering Island Communities">
    <meta name="twitter:description"
        content="Dwip Unnayan Songstha (DUS) works for sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.">
    <meta name="twitter:image" content="{{ $ogImageFullUrl }}">
    <meta name="twitter:image:alt" content="Dwip Unnayan Songstha - Empowering Island Communities">
    <meta name="twitter:site" content="@DUS_NGO">
    <meta name="twitter:creator" content="@DUS_NGO">

    {{-- ============================================ --}}
    {{-- WHATSAPP / TELEGRAM / MESSENGER              --}}
    {{-- ============================================ --}}
    <meta property="og:video" content="">
    <meta property="og:video:width" content="">
    <meta property="og:video:height" content="">
    <meta property="al:android:url" content="https://dus.ngo/">
    <meta property="al:android:package" content="">
    <meta property="al:ios:url" content="https://dus.ngo/">
    <meta property="al:ios:app_store_id" content="">

    {{-- ============================================ --}}
    {{-- STRUCTURED DATA (JSON-LD)                    --}}
    {{-- NOTE: always build as PHP arrays + json_encode. --}}
    {{--       Never hand-write "@context" in Blade.     --}}
    {{-- ============================================ --}}
    @php
        $ngoSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'NGO',
            'name' => 'Dwip Unnayan Songstha',
            'alternateName' => 'DUS NGO',
            'description' =>
                'Dwip Unnayan Songstha (DUS) is a non-governmental organization dedicated to sustainable development, education, healthcare, and livelihood support for island communities in Bangladesh.',
            'url' => url('/'),
            'logo' => $schemaLogo,
            'image' => $ogImageFullUrl,
            'email' => 'info@dus.ngo',
            'telephone' => '+880-XXXX-XXXXXX',
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => 'Dhaka',
                'addressCountry' => 'BD',
            ],
            'contactPoint' => [
                '@type' => 'ContactPoint',
                'contactType' => 'Customer Service',
                'availableLanguage' => ['English', 'Bengali'],
            ],
            'sameAs' => [
                'https://www.facebook.com/dusngo',
                'https://twitter.com/DUS_NGO',
                'https://www.linkedin.com/company/dusngo',
                'https://www.instagram.com/dusngo',
            ],
        ];

        $organizationSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => 'Dwip Unnayan Songstha',
            'legalName' => 'Dwip Unnayan Songstha',
            'url' => url('/'),
            'logo' => $schemaLogo,
            'description' =>
                'Empowering island communities in Bangladesh through sustainable development, education, healthcare, and livelihood support.',
            'foundingDate' => '1990',
            'slogan' => 'Empowering Island Communities',
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => 'Dhaka',
                'addressRegion' => 'Dhaka',
                'addressCountry' => 'Bangladesh',
            ],
        ];
    @endphp
    <script type="application/ld+json">{!! json_encode($ngoSchema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
    <script type="application/ld+json">{!! json_encode($organizationSchema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>

    {{-- ============================================ --}}
    {{-- THEME DETECTION                              --}}
    {{-- ============================================ --}}
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

    {{-- ============================================ --}}
    {{-- CRITICAL CSS (base only)                     --}}
    {{-- ============================================ --}}
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
    </style>

    {{-- Preloader styles — must be in <head> to avoid FOUC --}}
    @include('partials.preloader-styles')

    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta name="theme-color" content="{{ ($appearance ?? 'system') === 'dark' ? '#0d1117' : '#006B3F' }}">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- ============================================ --}}
    {{-- FAVICONS                                     --}}
    {{-- ============================================ --}}
    @if ($faviconUrl)
        <link rel="icon" href="{{ $faviconUrl }}" type="image/x-icon">
        <link rel="shortcut icon" href="{{ $faviconUrl }}" type="image/x-icon">
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
        <link rel="icon" href="{{ asset('images/dus-default-icon.png') }}" type="image/png">
    @endif

    @if ($appleTouchUrl)
        <link rel="apple-touch-icon" href="{{ $appleTouchUrl }}">
    @else
        <link rel="apple-touch-icon" href="{{ asset('images/dus-default-icon.png') }}">
    @endif

    <link rel="manifest" href="{{ asset('manifest.json') }}" crossorigin="use-credentials">

    {{-- ============================================ --}}
    {{-- FONTS                                        --}}
    {{-- ============================================ --}}
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

    {{-- ============================================ --}}
    {{-- PWA                                          --}}
    {{-- ============================================ --}}
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="application-name" content="Dwip Unnayan Songstha">

    {{-- ============================================ --}}
    {{-- NGO META                                     --}}
    {{-- ============================================ --}}
    <meta name="organization-type" content="NGO">
    <meta name="organization-registration" content="Registered with NGO Affairs Bureau, Bangladesh">
    <meta name="target-region" content="Island Communities of Bangladesh">

    @routes

    @if (app()->isLocal())
        @viteReactRefresh
    @endif

    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>

<body class="font-sans antialiased">

    {{-- SKIP LINK --}}
    <a href="#main"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded focus:shadow-lg">
        Skip to main content
    </a>

    {{-- INITIAL-PAINT LOADER (markup + hide script) --}}
    @include('partials.preloader', [
        'preloaderUrl' => $preloaderUrl,
        'isFrontendRoute' => $isFrontendRoute,
    ])

    {{-- INERTIA MOUNT POINT --}}
    <main id="main">
        @inertia
    </main>

</body>

</html>
