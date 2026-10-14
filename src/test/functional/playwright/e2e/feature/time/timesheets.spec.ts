import {test, expect} from '../../../support/fixtures';
import {EmployeeTimesheetsPage} from '../../../pages/time/employee-timesheets-page';
import {MyTimesheetPage} from '../../../pages/time/my-timesheet-page';

/**
 * John (ESS) logs a week on the Acme Website project and his supervisor
 * Mike approves it. Timesheets are per week; the current one is created on
 * first visit.
 */
test.describe('Time - Timesheets', () => {
  test.use({loginAs: 'john'});

  const project = 'Acme - Website';
  const activity = 'Development';

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.timesheetPeriod.define();
    const customer = await api.customers.create({name: 'Acme'});
    const {id} = await api.projects.create({
      customerId: customer.id,
      name: 'Website',
    });
    await api.projects.addActivity(id, activity);

    const john = await api.users.ensure(users.john);
    const mike = await api.users.ensure(users.mike);
    await api.employees.addSupervisor(
      john.employee.empNumber,
      mike.employee.empNumber,
    );
  });

  test('employee submits a timesheet and the supervisor approves it', async ({
    page,
    pageAs,
    users,
  }) => {
    const myTimesheetPage = new MyTimesheetPage(page);
    await myTimesheetPage.goto();
    await expect(myTimesheetPage.status).toHaveText('Status: Not Submitted');

    const editTimesheetPage = await myTimesheetPage.edit();
    const row = editTimesheetPage.row(0);
    await row.project.pick('Website', project);
    await row.activity.choose(activity);
    for (let day = 0; day < 5; day++) await row.hours(day).fill('8');
    await editTimesheetPage.save();

    const logged = myTimesheetPage.row(project, activity);
    await expect(myTimesheetPage.total(logged)).toHaveText('40:00');
    await myTimesheetPage.submit();
    await expect(myTimesheetPage.status).toHaveText('Status: Submitted');

    const employeeTimesheetsPage = new EmployeeTimesheetsPage(
      await pageAs('mike'),
    );
    await employeeTimesheetsPage.goto();
    const employeeTimesheetPage = await employeeTimesheetsPage.view(
      users.john.fullName,
    );
    await expect(employeeTimesheetPage.status).toHaveText('Status: Submitted');
    await expect(
      employeeTimesheetPage.total(employeeTimesheetPage.row(project, activity)),
    ).toHaveText('40:00');
    await employeeTimesheetPage.act('Approve', 'Looks good');
    await expect(employeeTimesheetPage.status).toHaveText('Status: Approved');

    await myTimesheetPage.goto();
    await expect(myTimesheetPage.status).toHaveText('Status: Approved');
  });
});
