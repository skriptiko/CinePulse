import { resolve } from 'node:path';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { createMfShared } from '../../scripts/mf-shared';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, '../..'), '');

  return {
    plugins: [
      tailwindcss(),
      react(),
      federation({
        name: 'pagesMfe',
        filename: 'remoteEntry.js',
        exposes: {
          './routes': './src/routes.tsx',
        },
        shared: createMfShared(),
        // The default, 'version-first', downloads every remote at startup (ADR-0011).
        shareStrategy: 'loaded-first',
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      modulePreload: false,
      target: 'chrome89',
      // Tailwind 4 output: `@layer`, `@property` and `color-mix()` must reach the browser as written.
      cssTarget: 'chrome111',
      cssCodeSplit: false,
    },
    server: {
      port: 5001,
      strictPort: true,
      cors: true,
      origin: 'http://localhost:5001',
      proxy: {
        '/api/tmdb': {
          target: 'https://api.themoviedb.org/3',
          changeOrigin: true,
          secure: false,
          headers: {
            Authorization: `Bearer ${env.TMDB_API_READ_TOKEN || ''}`,
            'Content-Type': 'application/json',
          },
          rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
        },
      },
    },
    preview: {
      port: 5001,
      strictPort: true,
      cors: true,
    },
  };
});
