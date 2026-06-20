import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /iphone-suite\.playwright\.spec\.ts/,
  webServer: {
    command: 'corepack pnpm run preview:iphone',
    port: 4173,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    ...devices['iPhone 13'],
  },
});
