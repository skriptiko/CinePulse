import { defineConfig } from 'vitest/config';

// Not a project of the root config: these tests need the Firestore emulator (`pnpm test:rules`).
export default defineConfig({
  test: {
    name: 'firestore-rules',
    root: 'firestore',
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
});
