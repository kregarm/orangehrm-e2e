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
    api,
    users,
  }) => {
    const systemUsersPage = new SystemUsersPage(page);
    await systemUsersPage.goto();
    const row = systemUsersPage.row(users.john.username);
    await expect(systemUsersPage.status(row)).toHaveText('Enabled');

    const editSystemUserPage = await systemUsersPage.edit(row);
    await editSystemUserPage.status.choose('Disabled');
    await editSystemUserPage.save();
    await expect(systemUsersPage.status(row)).toHaveText('Disabled');
    expect(await api.users.findByUsername(users.john.username)).toMatchObject({
      status: false,
    });

    const loginPage = new LoginPage(guestPage);
    await loginPage.goto();
    await loginPage.login(users.john);
    await expect(guestPage.getByRole('alert')).toContainText(
      'Account disabled',
    );
    await expect(guestPage).toHaveURL(/auth\/login/);
  });
});
