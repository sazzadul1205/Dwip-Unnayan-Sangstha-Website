import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { type route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';
import { resolvePage } from './inertia-resolver';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/**
 * Fires `app:ready` after React commits + browser paints two frames.
 *
 * The preloader partial listens for this event ONLY, and hides itself
 * once received. Route-level navigation is handled by:
 *   1. Inertia's 2px progress bar (see `progress` below)
 *   2. Each section's own skeleton while its data / chunk loads
 */
export function AppReady({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        let cancelled = false;
        let pendingFrames: number[] = [];

        const signalReady = () => {
            if (cancelled) return;

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

        return () => {
            cancelled = true;
            pendingFrames.forEach((id) => cancelAnimationFrame(id));
        };
    }, []);

    return children;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: resolvePage,
    setup({ el, App, props }) {
        const root = createRoot(el);

        // No route-level listeners here — the preloader only cares about
        // the initial paint. Subsequent navigations rely on Inertia's
        // native progress bar + per-section skeletons.

        root.render(
            <StrictMode>
                <AppReady>
                    <App {...props} />
                </AppReady>
            </StrictMode>,
        );
    },
    progress: {
        color: '#009BE2',
        delay: 100,
        showSpinner: false,
    },
});

initializeTheme();