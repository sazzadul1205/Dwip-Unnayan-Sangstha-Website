// resources/js/inertia-resolver.ts
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

// Lazy glob — NO `eager: true`. Each page becomes a separate chunk
// that loads only when Inertia asks for it.
const pageFiles = import.meta.glob('./pages/**/*.{tsx,jsx}');

export function resolvePage(name: string) {
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
}