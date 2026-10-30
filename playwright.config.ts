import { defineConfig, devices } from '@playwright/test';

const PORT = 5010;

// Runs on the merged dist/ (`pnpm build:deploy`), so rewrites and headers match production.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // biome-ignore lint/suspicious/noUndeclaredEnvVars: read by Playwright, not by a Turbo task.
    command: process.env.FIREBASE_CLI ?? 'firebase emulators:start --project demo --only hosting',
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
