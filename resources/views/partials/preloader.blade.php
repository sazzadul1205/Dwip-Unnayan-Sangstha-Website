{{--
    ============================================================
    PRELOADER — MARKUP + HIDE LOGIC
    ============================================================
    Initial-paint loader only. It responds to a single event:

        app:ready  →  fired by <AppReady> in app.tsx after React
                      commits + browser paints two frames.

    Route-level navigation is intentionally NOT handled here.
    Inertia's built-in 2px progress bar covers that case, and each
    section renders its own skeleton while its data/chunk loads.

    Include in app.blade.php <body>:
        @include('partials.preloader', ['preloaderUrl' => $preloaderUrl, 'isFrontendRoute' => $isFrontendRoute])

    Expected variables (inherited from parent scope or passed):
        $preloaderUrl       (string)  — logo image URL
        $isFrontendRoute    (bool)    — hide loader entirely for backend routes
--}}

<div id="app-loading" role="status" aria-label="Loading Dwip Unnayan Songstha" aria-busy="true"
    style="{{ $isFrontendRoute ?? true ? '' : 'display: none' }}">
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

<script>
    (function() {
        var loading = document.getElementById('app-loading');
        var cover = document.getElementById('loader-progress-cover');
        if (!loading) return;

        var hidden = false;

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

        // Only event we care about — the very first paint of the app.
        window.addEventListener('app:ready', hideLoader, {
            once: true
        });

        // Safety net: if React never signals ready (JS crash, network hang),
        // reveal the page after 8s so the user is never stuck on a blank screen.
        setTimeout(hideLoader, 8000);
    })();
</script>
