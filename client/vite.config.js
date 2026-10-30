import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const DEFAULT_API = 'https://arcjournal-production.up.railway.app';

// The packaged app only talks to its own files and the ArcJournal API.
function contentSecurityPolicy(apiUrl) {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${new URL(apiUrl).origin}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return {
    name: 'arcjournal-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' },
    ],
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), contentSecurityPolicy(env.VITE_API_URL || DEFAULT_API)],
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Loaded from disk, so one bundle is fine.
      chunkSizeWarningLimit: 1500,
    },
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, 'src'),
      },
    },
    test: {
      environment: 'node',
    },
  };
});
