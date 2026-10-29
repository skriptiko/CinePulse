import { resolve } from 'node:path';
import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'test-utils',
    environment: resolve(__dirname, '../../scripts/vitest-jsdom-environment.ts'),
    setupFiles: ['./src/setup.ts'],
  },
});
