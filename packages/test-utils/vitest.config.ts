import { resolve } from 'node:path';
import { configDefaults, defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'test-utils',
    exclude: [...configDefaults.exclude, '**/dist/**'],
    environment: resolve(__dirname, '../../scripts/vitest-jsdom-environment.ts'),
    setupFiles: ['./src/setup.ts'],
  },
});
