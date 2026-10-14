import {test, expect} from '../../../support/fixtures';
import {AddEmployeePage} from '../../../pages/pim/add-employee-page';
import {EmployeeListPage} from '../../../pages/pim/employee-list-page';
import {LoginPage} from '../../../pages/core/login-page';
import {DashboardPage} from '../../../pages/core/dashboard-page';

test.describe('PIM - Add Employee', () => {
  test.use({loginAs: 'admin'});

  test.beforeAll(async ({db}) => {
    await db.reset();
  });

  test('employee added with login details can log in', async ({
    page,
    guestPage,
  }) => {
    const employee = {
      firstName: 'Linda',
      lastName: 'Anderson',
      employeeId: 'E2E-0101',
      username: 'LindaA',
      password: 'Linda@OHRM123',
    };

    // Admin adds the employee
    const addEmployeePage = new AddEmployeePage(page);
    await addEmployeePage.goto();
    await addEmployeePage.firstName.fill(employee.firstName);
    await addEmployeePage.lastName.fill(employee.lastName);
    await addEmployeePage.employeeId.fill(employee.employeeId);

    // ...with an enabled login
    await addEmployeePage.createLoginDetails.set(true);
    await addEmployeePage.username.fill(employee.username);
    await addEmployeePage.status('Enabled');
    await addEmployeePage.password.fill(employee.password);
    await addEmployeePage.confirmPassword.fill(employee.password);
    await addEmployeePage.save();

    // The employee is in the Employee List
    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();
    await expect(
      employeeListPage.row(employee.firstName, employee.lastName),
    ).toContainText(employee.employeeId);

    // The employee can log in and sees their name
    const loginPage = new LoginPage(guestPage);
    await loginPage.goto();
    await loginPage.login(employee);
    const dashboardPage = new DashboardPage(guestPage);
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.topBar.userDropdown).toContainText(
      `${employee.firstName} ${employee.lastName}`,
    );
  });
});
