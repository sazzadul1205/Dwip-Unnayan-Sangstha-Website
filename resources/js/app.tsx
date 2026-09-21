import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { type route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { resolvePage } from './inertia-resolver';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const isFrontendPath = (path: string) =>
    !/^\/(backend|login|register|dashboard|api|storage|auth|complete-profile|seeker|apply|profile|unauthorized|playground)(\/|$)/.test(
        path,
    );

/**
 * Fires `app:ready` as soon as React has committed and the browser has
 * painted two frames. No font waiting, no image decoding, no observers.
 *
 * Lazy sections stream in afterwards — each shows its own Suspense
 * fallback inside its own slot, so the global loader never blocks on them.
 */
export function AppReady({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        let cancelled = false;
        let pendingFrames: number[] = [];

        const signalReady = () => {
            if (cancelled) return;

            // cancel any frames still queued from a previous navigation
            pendingFrames.forEach((id) => cancelAnimationFrame(id));
            pendingFrames = [];

            const f1 = requestAnimationFrame(() => {
                const f2 = requestAnimationFrame(() => {
                    if (cancelled) return;
                    window.dispatchEvent(new Event('app:ready'));
                });
                pendingFrames.push(f2);
            });
            pendingFrames.push(f1);
        };

        signalReady();

        const handlePageFinished = () => signalReady();
        window.addEventListener('app:page-finished', handlePageFinished);

        return () => {
            cancelled = true;
            pendingFrames.forEach((id) => cancelAnimationFrame(id));
            window.removeEventListener('app:page-finished', handlePageFinished);
        };
    }, []);

    return children;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: resolvePage,
    setup({ el, App, props }) {
        const root = createRoot(el);
        let loadingTimer: number | null = null;

        router.on('start', (event) => {
            const path = new URL(event.detail.visit.url, window.location.origin).pathname;
            if (!isFrontendPath(path)) return;

            loadingTimer = window.setTimeout(() => {
                window.dispatchEvent(new Event('app:loading'));
            }, 150);
        });

        router.on('finish', () => {
            if (loadingTimer !== null) {
                window.clearTimeout(loadingTimer);
                loadingTimer = null;
            }

            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('app:page-finished'));
            });
        });

        root.render(
            <StrictMode>
                <AppReady>
                    <App {...props} />
                </AppReady>
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
        delay: 100,
        showSpinner: false,
    },
});

initializeTheme();