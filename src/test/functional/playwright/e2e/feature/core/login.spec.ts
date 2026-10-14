import {test, expect} from '../../../support/fixtures';
import {LoginPage} from '../../../pages/core/login-page';
import {DashboardPage} from '../../../pages/core/dashboard-page';

test.describe('Core - Login Page', () => {
  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.users.ensure(users.john);
  });

  test('ESS user logs in to the dashboard', async ({page, users}) => {
    // John logs in and lands on the dashboard
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.john);
    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.heading).toBeVisible();

    // He sees his name and the ESS menu, without Admin
    await expect(dashboardPage.topBar.userDropdown).toContainText(
      users.john.fullName,
    );
    const {menu} = dashboardPage;
    await expect(menu.getByRole('link', {name: 'My Info'})).toBeVisible();
    await expect(
      menu.getByRole('link', {name: 'Admin', exact: true}),
    ).toHaveCount(0);
  });

  test('empty login form shows required errors', async ({page}) => {
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

    await expect(loginPage.alert).toContainText('Invalid credentials');
  });
});
