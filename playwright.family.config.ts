import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /family-dashboard\.spec\.ts/,
  webServer: {
    command: 'corepack pnpm --dir apps/family dev:test',
    port: 3100,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://127.0.0.1:3100',
  },
});
