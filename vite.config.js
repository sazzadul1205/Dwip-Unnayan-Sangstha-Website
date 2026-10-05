import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import {defineConfig} from 'vite';
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    server: {
        // Pin the dev server to IPv4. A bracketed IPv6 URL (http://[::1]:5173)
        // is not a valid CSP host-source, so the app would refuse to load the
        // bundle when the browser resolved the dev server over IPv6.
        host: '127.0.0.1',
        port: 5173,
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    optimizeDeps: {
        include: ['pdfjs-dist'],
    },
});
