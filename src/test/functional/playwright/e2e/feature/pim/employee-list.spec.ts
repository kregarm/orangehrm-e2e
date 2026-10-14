import {test, expect} from '../../../support/fixtures';
import {EmployeeListPage} from '../../../pages/employee-list-page';

const current = [
  {firstName: 'Alice', lastName: 'Brown', employeeId: 'E2E-0201'},
  {firstName: 'Bob', lastName: 'Carter', employeeId: 'E2E-0202'},
];
const past = {firstName: 'Carl', lastName: 'Dunn', employeeId: 'E2E-0203'};

test.describe('PIM - Employee List', () => {
  test.use({loginAs: 'admin'});

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    for (const employee of current) await api.employees.create(employee);
    const {empNumber} = await api.employees.create(past);
    await api.employees.terminate(empNumber, {date: '2026-01-15'});
  });

  test('employees can be found by name and by id', async ({page}) => {
    const [alice, bob] = current;
    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();

    await employeeListPage.filters.employeeName.pick(
      alice.firstName,
      `${alice.firstName} ${alice.lastName}`,
    );
    await employeeListPage.search();
    await expect(employeeListPage.table.rows).toHaveCount(1);
    await expect(
      employeeListPage.row(alice.firstName, alice.lastName),
    ).toContainText(alice.employeeId);

    await employeeListPage.filters.resetButton.click();
    await employeeListPage.filters.employeeId.fill(bob.employeeId);
    await employeeListPage.search();
    await expect(employeeListPage.table.rows).toHaveCount(1);
    await expect(employeeListPage.row(bob.firstName, bob.lastName)).toHaveCount(
      1,
    );
  });

  test('terminated employee is only listed with past employees', async ({
    page,
  }) => {
    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();
    await employeeListPage.filters.employeeId.fill(past.employeeId);
    await employeeListPage.search();
    await expect(employeeListPage.table.rows).toHaveCount(0);

    await employeeListPage.filters.include.choose('Current and Past Employees');
    await employeeListPage.search();
    await expect(
      employeeListPage.row(past.firstName, `${past.lastName} (Past Employee)`),
    ).toContainText(past.employeeId);
  });
});
