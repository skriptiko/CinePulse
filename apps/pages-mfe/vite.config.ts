import { resolve } from 'node:path';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'pagesMfe',
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
    port: 5001,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5001',
    proxy: {
      '/api/tmdb': {
        target: 'https://api.themoviedb.org/3',
        changeOrigin: true,
        secure: true,
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_READ_TOKEN || ''}`,
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
});
