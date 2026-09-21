/* prettier-ignore */
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';
import { resolvePage } from './inertia-resolver';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: resolvePage,
        // prettier-ignore
        setup: ({ App, props }) => <App {...props} />,
    }),
);