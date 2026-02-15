import { resolve } from 'node:path';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'userMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './routes': './src/routes.tsx',
      },
      shared: {
        react: {
          requiredVersion: '^18.3.1',
        },
        'react-dom': {
          requiredVersion: '^18.3.1',
        },
        'react-router-dom': {},
        '@repo/events': {},
        '@repo/routes': {},
        '@repo/api': {},
        '@tanstack/react-query': {},
      },
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
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5002,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5002',
  },
  preview: {
    port: 5002,
    strictPort: true,
    cors: true,
  },
});
