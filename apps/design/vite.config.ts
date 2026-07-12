import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Standalone design sandbox — no Module Federation.
// Used purely to prototype full-page mockups with @repo/ui before
// porting the finished screens into the real MFE apps.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, '../..'), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5100,
      strictPort: true,
      cors: true,
      // Optional: lets mockups pull real TMDB data through @repo/api hooks.
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
      port: 5100,
      strictPort: true,
      cors: true,
    },
  };
});
