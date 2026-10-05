/**
 * Node resolve hook: this project is built by Vite, which allows extensionless
 * relative imports. Node's ESM resolver does not, so the verification script
 * needs a shim to import the source modules directly.
 *
 * Usage: node --import ./tests/js/esm-extensionless-resolve.mjs <script>
 */
import { register } from 'node:module';

register('./esm-extensionless-hook.mjs', import.meta.url);
