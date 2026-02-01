import { resolve } from 'node:path';
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        pagesMfe: {
          external: process.env.PAGES_MFE_URL || 'http://localhost:5001/assets/remoteEntry.js',
          externalType: 'url',
        },
        userMfe: {
          external: process.env.USER_MFE_URL || 'http://localhost:5002/assets/remoteEntry.js',
          externalType: 'url',
        },
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
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5000,
    strictPort: true,
    proxy: {
      '/api/tmdb': {
        target: 'http://127.0.0.1:5001/cinepulse-eec15/us-central1/tmdbProxy',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, ''),
      },
    },
  },
  preview: {
    port: 5000,
    strictPort: true,
  },
});
