import { resolve } from 'node:path';
import { defineProject } from 'vitest/config';

export default defineProject({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    name: 'host',
    environment: resolve(__dirname, '../../scripts/vitest-jsdom-environment.ts'),
    setupFiles: ['@repo/test-utils/setup'],
  },
});
