import { defineConfig } from 'vitest/config';

// One run over every project that has its own vitest.config.ts (ADR-0006).
export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts', 'apps/*/vitest.config.ts'],
    coverage: {
      provider: 'v8',
      // Explicit list: v8 only counts files that were loaded otherwise.
      include: ['packages/api/src/**', 'packages/events/src/**', 'packages/ui/src/lib/**'],
      exclude: ['**/__tests__/**', '**/index.ts'],
    },
  },
});
