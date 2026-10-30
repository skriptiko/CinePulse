import { resolve } from 'node:path';
import { configDefaults, defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'ui',
    exclude: [...configDefaults.exclude, '**/dist/**'],
    environment: resolve(__dirname, '../../scripts/vitest-jsdom-environment.ts'),
    setupFiles: ['@repo/test-utils/setup'],
  },
});
