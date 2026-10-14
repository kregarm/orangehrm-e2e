import {test, expect} from '../../../support/fixtures';
import {LoginPage} from '../../../pages/core/login-page';

test.describe('Core - Access control', () => {
  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.users.ensure(users.john);
  });

  test.describe('as an ESS user', () => {
    test.use({loginAs: 'john'});

    test('admin pages are forbidden', async ({page}) => {
      const response = await page.goto('admin/viewSystemUsers');

      expect(response?.status()).toBe(403);
      await expect(page.getByRole('alert')).toContainText(
        'Credential Required',
      );
      await expect(page.locator('.oxd-table')).toHaveCount(0);
    });
  });

  // Logs in through the form: logging out a `loginAs` page would end the
  // API session it shares cookies with.
  test('logging out ends the session', async ({page, users}) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.john);
    await expect(page).toHaveURL(/dashboard\/index/);

    await page.locator('.oxd-userdropdown-tab').click();
    await page.getByRole('menuitem', {name: 'Logout'}).click();
    await expect(page).toHaveURL(/auth\/login/);

    await page.goto('pim/viewMyDetails');
    await expect(page).toHaveURL(/auth\/login/);
  });
});
