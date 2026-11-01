import { resolve } from 'node:path';
import { configDefaults, defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'ui',
    // West of UTC, unlike CI: a calendar date that shifts with the zone fails here.
    env: { TZ: 'America/Los_Angeles' },
    exclude: [...configDefaults.exclude, '**/dist/**'],
    environment: resolve(__dirname, '../../scripts/vitest-jsdom-environment.ts'),
    setupFiles: ['@repo/test-utils/setup'],
  },
});
