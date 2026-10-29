import { resolve } from 'node:path';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const REMOTE_URL_KEYS = ['PAGES_MFE_URL', 'USER_MFE_URL'] as const;

export default defineConfig(({ command, mode }) => {
  // Root .env holds shared secrets (TMDB token); app-level .env.[mode] holds remote URLs.
  const env = {
    ...loadEnv(mode, resolve(__dirname, '../..'), ''),
    ...loadEnv(mode, __dirname, ''),
  };

  if (command === 'build') {
    const missing = REMOTE_URL_KEYS.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing ${missing.join(', ')} for "${mode}" build. Set them in apps/host/.env.${mode}.`
      );
    }
  }

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
