import {test, expect} from '../../../support/fixtures';
import {AddEmployeePage} from '../../../pages/pim/add-employee-page';
import {EmployeeListPage} from '../../../pages/pim/employee-list-page';
import {LoginPage} from '../../../pages/core/login-page';

test.describe('PIM - Add Employee', () => {
  test.use({loginAs: 'admin'});

  test.beforeAll(async ({db}) => {
    await db.reset();
  });

  test('employee added with login details can log in', async ({
    page,
    guestPage,
    api,
  }) => {
    const employee = {
      firstName: 'Linda',
      lastName: 'Anderson',
      employeeId: 'E2E-0101',
      username: 'LindaA',
      password: 'Linda@OHRM123',
    };

    const addEmployeePage = new AddEmployeePage(page);
    await addEmployeePage.goto();
    await addEmployeePage.firstName.fill(employee.firstName);
    await addEmployeePage.lastName.fill(employee.lastName);
    await addEmployeePage.employeeId.fill(employee.employeeId);
    await addEmployeePage.createLoginDetails.set(true);
    await addEmployeePage.username.fill(employee.username);
    await addEmployeePage.status('Enabled');
    await addEmployeePage.password.fill(employee.password);
    await addEmployeePage.confirmPassword.fill(employee.password);
    const empNumber = await addEmployeePage.save();

    expect(await api.employees.getById(empNumber)).toMatchObject({
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeId: employee.employeeId,
    });
    expect(await api.users.findByUsername(employee.username)).toMatchObject({
      status: true,
      userRole: {name: 'ESS'},
      employee: {empNumber},
    });

    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();
    await expect(
      employeeListPage.row(employee.firstName, employee.lastName),
    ).toContainText(employee.employeeId);

    const loginPage = new LoginPage(guestPage);
    await loginPage.goto();
    await loginPage.login(employee);
    await expect(guestPage).toHaveURL(/dashboard\/index/);
    await expect(
      guestPage.getByText(`${employee.firstName} ${employee.lastName}`),
    ).toBeVisible();
  });
});
