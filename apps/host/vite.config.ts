import { resolve } from 'node:path';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, '../..'), '');

  return {
    plugins: [
      react(),
      federation({
        name: 'host',
        remotes: {
          pagesMfe: {
            type: 'module',
            name: 'pagesMfe',
            entry: env.PAGES_MFE_URL || 'http://localhost:5001/remoteEntry.js',
            entryGlobalName: 'pagesMfe',
            shareScope: 'default',
          },
          userMfe: {
            type: 'module',
            name: 'userMfe',
            entry: env.USER_MFE_URL || 'http://localhost:5002/remoteEntry.js',
            entryGlobalName: 'userMfe',
            shareScope: 'default',
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
      target: 'chrome89',
      minify: false,
      cssCodeSplit: false,
    },
    server: {
      port: 5000,
      strictPort: true,
      origin: 'http://localhost:5000',
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
      port: 5000,
      strictPort: true,
    },
  };
});
