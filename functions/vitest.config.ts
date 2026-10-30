import { configDefaults, defineProject } from 'vitest/config';

// Pure proxy rules only: the HTTP handler itself is not unit-tested.
export default defineProject({
  test: {
    name: 'functions',
    exclude: [...configDefaults.exclude, '**/dist/**'],
    environment: 'node',
  },
});
