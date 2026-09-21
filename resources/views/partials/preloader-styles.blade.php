{{--
    ============================================================
    PRELOADER — STYLES
    ============================================================
    Critical CSS for the initial-paint loader. Must live in <head>
    so the loader's fixed overlay paints styled from frame 1.

    Include in app.blade.php <head>:
        @include('partials.preloader-styles')
--}}
<style>
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
