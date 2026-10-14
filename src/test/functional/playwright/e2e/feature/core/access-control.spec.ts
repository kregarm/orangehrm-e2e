import {test, expect} from '../../../support/fixtures';
import {LoginPage} from '../../../pages/core/login-page';
import {SystemUsersPage} from '../../../pages/admin/system-users-page';

test.describe('Core - Access control', () => {
  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.users.ensure(users.john);
  });

  test.describe('as an ESS user', () => {
    test.use({loginAs: 'john'});

    test('admin pages are forbidden', async ({page}) => {
      // John opens an admin page and is refused, without the users list
      const systemUsersPage = new SystemUsersPage(page);
      await systemUsersPage.goto();
      await expect(page.getByRole('alert')).toContainText(
        'Credential Required',
      );
      await expect(systemUsersPage.table.root).toHaveCount(0);
    });
  });

  // Logs in through the form: logging out a `loginAs` page would end the
  // API session it shares cookies with.
  test('logging out ends the session', async ({page, users}) => {
    // John logs in
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.john);
    await expect(page.getByRole('heading', {name: 'Dashboard'})).toBeVisible();

    // He logs out and is back at the login form
    await page.locator('.oxd-userdropdown-tab').click();
    await page.getByRole('menuitem', {name: 'Logout'}).click();
    await expect(loginPage.loginButton).toBeVisible();

    // His pages now send him to the login form too
    await page.goto('pim/viewMyDetails');
    await expect(loginPage.loginButton).toBeVisible();
  });
});
