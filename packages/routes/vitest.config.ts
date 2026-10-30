import { configDefaults, defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'routes',
    exclude: [...configDefaults.exclude, '**/dist/**'],
    environment: 'node',
  },
});
