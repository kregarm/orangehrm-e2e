import {test, expect} from '../../../support/fixtures';
import {EmployeeListPage} from '../../../pages/pim/employee-list-page';

const currentEmployees = [
  {firstName: 'Alice', lastName: 'Brown', employeeId: 'E2E-0201'},
  {firstName: 'Bob', lastName: 'Carter', employeeId: 'E2E-0202'},
];
const terminatedEmployee = {
  firstName: 'Carl',
  lastName: 'Dunn',
  employeeId: 'E2E-0203',
};

test.describe('PIM - Employee List', () => {
  test.use({loginAs: 'admin'});

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    for (const employee of currentEmployees)
      await api.employees.create(employee);
    const {empNumber} = await api.employees.create(terminatedEmployee);
    await api.employees.terminate(empNumber, {date: '2026-01-15'});
  });

  test('employees can be found by name and by id', async ({page}) => {
    const [alice, bob] = currentEmployees;
    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();

    // Searching by name finds only Alice
    await employeeListPage.filters.employeeName.pick(
      alice.firstName,
      `${alice.firstName} ${alice.lastName}`,
    );
    await employeeListPage.filters.search();
    await expect(employeeListPage.table.rows).toHaveCount(1);
    await expect(
      employeeListPage.row(alice.firstName, alice.lastName),
    ).toBeVisible();

    // Searching by ID finds only Bob
    await employeeListPage.filters.resetButton.click();
    await employeeListPage.filters.employeeId.fill(bob.employeeId);
    await employeeListPage.filters.search();
    await expect(employeeListPage.table.rows).toHaveCount(1);
    await expect(
      employeeListPage.row(bob.firstName, bob.lastName),
    ).toBeVisible();
  });

  test('terminated employee is only listed with past employees', async ({
    page,
  }) => {
    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();

    // Carl isn't among current employees (the toast shows the search ran)
    await employeeListPage.filters.employeeId.fill(
      terminatedEmployee.employeeId,
    );
    await employeeListPage.filters.search();
    await expect(employeeListPage.noRecordsFound).toBeVisible();
    await expect(employeeListPage.table.rows).toHaveCount(0);

    // He is listed once past employees are included
    await employeeListPage.filters.include.choose('Current and Past Employees');
    await employeeListPage.filters.search();
    await expect(
      employeeListPage.row(
        terminatedEmployee.firstName,
        `${terminatedEmployee.lastName} (Past Employee)`,
      ),
    ).toBeVisible();
  });
});
