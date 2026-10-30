import { defineProject } from 'vitest/config';

// Pure logic without the DOM: the bus falls back to a module-level instance outside the browser.
// Files that need `window` or React (the store) opt into jsdom with `// @vitest-environment jsdom`.
export default defineProject({
  test: {
    name: 'events',
    environment: 'node',
  },
});
