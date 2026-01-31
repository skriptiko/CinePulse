import { resolve } from 'node:path';
import federation from '@originjs/vite-plugin-federation';
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
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  base: '/pages-mfe/',
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5001,
    strictPort: true,
    cors: true,
  },
  preview: {
    port: 5001,
    strictPort: true,
    cors: true,
  },
});
