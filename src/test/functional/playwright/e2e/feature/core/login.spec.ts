import {test, expect} from '../../../support/fixtures';
import {LoginPage} from '../../../pages/core/login-page';

test.describe('Core - Login Page', () => {
  test.beforeAll(async ({db}) => {
    await db.reset();
  });

  test('should login as an ESS user', async ({page, users, api}) => {
    await api.users.ensure(users.john);

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

    await expect(loginPage.alert).toContainText('Invalid credentials');
  });
});
