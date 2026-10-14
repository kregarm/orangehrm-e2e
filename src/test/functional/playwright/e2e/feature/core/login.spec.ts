import {test, expect} from '../../../support/fixtures';
import {LoginPage} from '../../../pages/core/login-page';

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
    await expect(page.getByRole('heading', {name: 'Dashboard'})).toBeVisible();

    // He sees his name and the ESS menu, without Admin
    await expect(page.getByText(users.john.fullName)).toBeVisible();
    const menu = page.getByRole('navigation');
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
