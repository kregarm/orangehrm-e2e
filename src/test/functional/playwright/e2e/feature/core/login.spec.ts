import type {Page} from '@playwright/test';
import {test, expect} from '../../../support/fixtures';

const inputGroup = (page: Page, label: string) =>
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
