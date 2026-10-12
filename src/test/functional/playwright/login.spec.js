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

const {test, expect} = require('@playwright/test');
const {admin} = require('../cypress/fixtures/user.json');

const appBaseUrl =
  process.env.PLAYWRIGHT_BASE_URL || 'http://php80/web/index.php';
const apiBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL || appBaseUrl;
const appHost = new URL(appBaseUrl).hostname;

test.beforeEach(async ({page}) => {
  const response = await page.request.post(
    `${apiBaseUrl}/functional-testing/database/reset`,
    {headers: {host: appHost}},
  );
  expect(
    response.ok(),
    `Database reset returned HTTP ${response.status()}: ${await response.text()}`,
  ).toBeTruthy();
});

test('admin can log in', async ({page}) => {
  await page.goto(`${appBaseUrl}/auth/login`);
  await page.locator('input[name="username"]').fill(admin.username);
  await page.locator('input[name="password"]').fill(admin.password);
  await page.getByRole('button', {name: 'Login'}).click();

  await expect(page).toHaveURL(/dashboard\/index/);
  await expect(page.locator('.oxd-layout')).toBeVisible();
});
