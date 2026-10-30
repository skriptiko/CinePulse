import { resolve } from 'node:path';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createMfShared } from '../../scripts/mf-shared';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    federation({
      name: 'userMfe',
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
    port: 5002,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5002',
    proxy: {
      // The Firebase config comes from Hosting, as in production.
      '/__/firebase': { target: 'https://cinepulse-eec15.web.app', changeOrigin: true },
    },
  },
  preview: {
    port: 5002,
    strictPort: true,
    cors: true,
  },
});
