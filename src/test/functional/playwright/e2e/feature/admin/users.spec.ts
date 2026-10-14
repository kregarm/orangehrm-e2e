import {test, expect} from '../../../support/fixtures';
import {SystemUsersPage} from '../../../pages/system-users-page';
import {LoginPage} from '../../../pages/login-page';

test.describe('Admin - System Users', () => {
  test.use({loginAs: 'admin'});

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.users.ensure(users.john);
  });

  test('disabled user can no longer log in', async ({
    page,
    guestPage,
    users,
  }) => {
    // User is enabled by default
    const systemUsersPage = new SystemUsersPage(page);
    await systemUsersPage.goto();
    const row = systemUsersPage.row(users.john.username);
    await expect(await systemUsersPage.status(row)).toHaveText('Enabled');

    // Disable user
    const editSystemUserPage = await systemUsersPage.edit(row);
    await editSystemUserPage.status.choose('Disabled');
    await editSystemUserPage.save();
    await expect(await systemUsersPage.status(row)).toHaveText('Disabled');

    // Disabled user can no longer log in
    const loginPage = new LoginPage(guestPage);
    await loginPage.goto();
    await loginPage.login(users.john);
    await expect(loginPage.alert).toContainText('Account disabled');
  });
});
