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
import type {Page} from '@playwright/test';
import {test, expect} from '../../../support/fixtures';
import {LoginPage} from '../../../pages/login-page';
import type {User} from '../../../data/users';

/** Log in through the form and assert the redirect to the dashboard */
const login = async (page: Page, user: User) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().endsWith('/auth/validate'),
  );
  await loginPage.login(user);

  expect((await loginResponse).headers().location).toMatch(/dashboard\/index/);
  await expect(page).toHaveURL(/dashboard\/index/);
};

test.describe('Core - Login Page', () => {
  test.beforeAll(async ({db}) => {
    await db.reset();
  });

  test('should login as admin', async ({page, users}) => {
    await login(page, users.admin);
  });

  test('should login as an ESS user', async ({page, users, api}) => {
    await api.users.ensure(users.john);
    await login(page, users.john);

    await expect(page.getByText(users.john.fullName)).toBeVisible();
    const menu = page.getByRole('navigation');
    await expect(menu.getByRole('link', {name: 'My Info'})).toBeVisible();
    await expect(
      menu.getByRole('link', {name: 'Admin', exact: true}),
    ).toHaveCount(0);
  });

  test('login form validations should work', async ({page}) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginButton.click();

    await expect(loginPage.username.root).toContainText('Required');
    await expect(loginPage.password.root).toContainText('Required');
  });

  test('wrong password is rejected', async ({page, users}) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login({
      username: users.admin.username,
      password: 'Wrong@OHRM123',
    });

    await expect(page.getByRole('alert')).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/auth\/login/);
  });
});
