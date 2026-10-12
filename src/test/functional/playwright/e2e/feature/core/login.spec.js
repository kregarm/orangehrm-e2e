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

const {test, expect} = require('../../../support/fixtures');

const inputGroup = (page, label) =>
  page.locator('.oxd-input-group').filter({hasText: label});

test.describe('Core - Login Page', () => {
  test.beforeAll(async ({db}) => {
    await db.reset();
  });

  test('should login as admin', async ({page, users}) => {
    await page.goto('auth/login');
    await inputGroup(page, 'Username')
      .locator('input')
      .fill(users.admin.username);
    await inputGroup(page, 'Password')
      .locator('input')
      .fill(users.admin.password);

    const loginResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/auth/validate'),
    );
    await page.getByRole('button', {name: 'Login'}).click();

    expect((await loginResponse).headers().location).toMatch(
      /dashboard\/index/,
    );
    await expect(page).toHaveURL(/dashboard\/index/);
  });

  test('login form validations should work', async ({page}) => {
    await page.goto('auth/login');
    await page.getByRole('button', {name: 'Login'}).click();

    await expect(inputGroup(page, 'Username')).toContainText('Required');
    await expect(inputGroup(page, 'Password')).toContainText('Required');
  });
});
