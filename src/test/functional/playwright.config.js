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

const appHost = process.env.PLAYWRIGHT_HOST || 'php80';

module.exports = defineConfig({
  testDir: './playwright',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', {outputFolder: 'playwright-report', open: 'never'}],
  ],
  use: {
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL || `http://${appHost}/web/index.php`,
    browserName: 'chromium',
    headless: true,
    launchOptions: {
      args: [`--host-resolver-rules=MAP ${appHost} 127.0.0.1`],
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  outputDir: 'playwright/test-results',
});
