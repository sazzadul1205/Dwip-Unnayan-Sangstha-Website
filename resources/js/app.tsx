import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { type route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
// Import all page files in the pages folder (TSX and JSX)
const pageFiles = import.meta.glob('./pages/**/*.{tsx,jsx}');

// Resolve Inertia page component with TSX/JSX fallback
const resolvePage = (name: string) => {
    const tsxPath = `./pages/${name}.tsx`;
    const jsxPath = `./pages/${name}.jsx`;

    const pagePath = pageFiles[tsxPath]
        ? tsxPath
        : pageFiles[jsxPath]
          ? jsxPath
          : null;

    if (!pagePath) {
        throw new Error(`Page not found: ${tsxPath} or ${jsxPath}`);
    }

    return resolvePageComponent(pagePath, pageFiles);
};

function AppReady({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        let cancelled = false;

        const signalReady = async () => {
            await document.fonts.ready;

            await new Promise<void>((resolve) => {
                requestAnimationFrame(resolve);
            });

            if (document.documentElement.dataset.frontendPage === 'true') {
                if (document.documentElement.dataset.frontendReady !== 'true') {
                    await new Promise<void>((resolve) => {
                        window.addEventListener('frontend:ready', () => resolve(), { once: true });
                    });
                }
            }

            await new Promise<void>((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(resolve);
                });
            });

            const visibleImages = Array.from(document.images).filter((image) => {
                const rect = image.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight;
            });

            await Promise.all(
                visibleImages.map((image) =>
                    image.complete ? Promise.resolve() : image.decode().catch(() => undefined),
                ),
            );

            if (!cancelled) {
                window.dispatchEvent(new Event('app:ready'));
            }
        };

        void signalReady();

        return () => {
            cancelled = true;
        };
    }, []);

    return children;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name: string) => resolvePage(name),
    setup({ el, App, props }) {
        const root = createRoot(el);

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

// This will set light / dark mode on load...
initializeTheme();


