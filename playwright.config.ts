import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const reportDir = process.env.REPORT_DIR || 'reports/default';

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/setup/global.setup.ts',
  // Single worker: the journey mutates shared live data and must run in order.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 12_000 },
  reporter: [['line'], ['html', { outputFolder: reportDir, open: 'never' }]],
  use: {
    baseURL: process.env.PORTAL_URL || 'https://dmoneyportal.roadtocareer.net',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: { slowMo: Number(process.env.SLOW_MO || 0) },
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } },
    },
  ],
});
