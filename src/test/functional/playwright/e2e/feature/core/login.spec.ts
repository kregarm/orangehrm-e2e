import type {Page} from '@playwright/test';
import {test, expect} from '../../../support/fixtures';
import type {User} from '../../../data/users';

const inputGroup = (page: Page, label: string) =>
  page.locator('.oxd-input-group').filter({hasText: label});

/** Log in through the form and assert the redirect to the dashboard */
const login = async (page: Page, user: User) => {
  await page.goto('auth/login');
  await inputGroup(page, 'Username').locator('input').fill(user.username);
  await inputGroup(page, 'Password').locator('input').fill(user.password);

  const loginResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().endsWith('/auth/validate'),
  );
  await page.getByRole('button', {name: 'Login'}).click();

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

    await page.pause();
  });

  test('login form validations should work', async ({page}) => {
    await page.goto('auth/login');
    await page.getByRole('button', {name: 'Login'}).click();

    await expect(inputGroup(page, 'Username')).toContainText('Required');
    await expect(inputGroup(page, 'Password')).toContainText('Required');
  });
});
