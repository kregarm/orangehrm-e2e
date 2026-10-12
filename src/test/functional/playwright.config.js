/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */

const {defineConfig} = require('@playwright/test');
const {chromiumArgs} = require('./playwright/support/hosts');

// The dev environment's PHP 8.0 host, as used by Cypress. The trailing slash
// lets specs navigate relative to index.php, e.g. page.goto('auth/login').
const baseURL = `${(
  process.env.PLAYWRIGHT_BASE_URL || 'http://php80/web/index.php'
).replace(/\/+$/, '')}/`;

module.exports = defineConfig({
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
    launchOptions: {args: chromiumArgs},
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
