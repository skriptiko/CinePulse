import { resolve } from 'node:path';
import { configDefaults, defineProject } from 'vitest/config';

// jsdom gives `location`, so relative `/api/tmdb/*` URLs resolve like in the browser.
export default defineProject({
  test: {
    name: 'api',
    exclude: [...configDefaults.exclude, '**/dist/**'],
    environment: resolve(__dirname, '../../scripts/vitest-jsdom-environment.ts'),
  },
});
