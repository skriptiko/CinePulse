import { defineProject } from 'vitest/config';

// Pure logic without the DOM: the bus falls back to a module-level instance outside the browser.
export default defineProject({
  test: {
    name: 'events',
    environment: 'node',
  },
});
