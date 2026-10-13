/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */
import {test, expect} from '../../../support/fixtures';
import {AddEmployeePage} from '../../../pages/add-employee-page';
import {EmployeeListPage} from '../../../pages/employee-list-page';
import {LoginPage} from '../../../pages/login-page';

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
