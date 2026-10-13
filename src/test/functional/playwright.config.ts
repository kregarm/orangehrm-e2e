import {defineConfig} from '@playwright/test';
import {chromiumArgs} from './playwright/support/hosts';

// The dev environment's PHP 8.0 host, as used by Cypress. The trailing slash
// lets specs navigate relative to index.php, e.g. page.goto('auth/login').
const baseURL = `${(
  process.env.PLAYWRIGHT_BASE_URL || 'http://php80/web/index.php'
).replace(/\/+$/, '')}/`;

export default defineConfig({
  testDir: './playwright/e2e',
  outputDir: './playwright/test-results',
  globalSetup: require.resolve('./playwright/global-setup'),
  // Specs share one database, so run them serially like Cypress does.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: [
    ['list'],
    ['html', {outputFolder: 'playwright-report', open: 'never'}],
  ],
  expect: {timeout: 10000},
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    // E2E_SLOW_MO=500 pauses 500ms after every browser action, to follow a
    // --headed run by eye. Off by default.
    launchOptions: {
      args: chromiumArgs,
      slowMo: Number(process.env.E2E_SLOW_MO) || 0,
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
