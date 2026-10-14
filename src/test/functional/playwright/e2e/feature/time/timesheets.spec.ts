import {test, expect} from '../../../support/fixtures';
import {EmployeeTimesheetsPage} from '../../../pages/time/employee-timesheets-page';
import {MyTimesheetPage} from '../../../pages/time/my-timesheet-page';
import type {TimesheetActivity} from '../../../api/time/TimesheetsApiClass';

// John logs time on Acme's Website project; his supervisor Mike approves it.
// The submit test uses this week's timesheet, the approve test last week's.
test.describe('Time - Timesheets', () => {
  test.use({loginAs: 'john'});

  const project = 'Acme - Website';
  const activity = 'Development';
  let development: TimesheetActivity;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.timesheetPeriod.define();
    const customer = await api.customers.create({name: 'Acme'});
    const {id: projectId} = await api.projects.create({
      customerId: customer.id,
      name: 'Website',
    });
    const {id: activityId} = await api.projects.addActivity(
      projectId,
      activity,
    );
    development = {projectId, activityId};

    const john = await api.users.ensure(users.john);
    const mike = await api.users.ensure(users.mike);
    await api.employees.addSupervisor(
      john.employee.empNumber,
      mike.employee.empNumber,
    );
  });

  test('employee submits their timesheet', async ({page}) => {
    // John's timesheet for this week starts out Not Submitted
    const myTimesheetPage = new MyTimesheetPage(page);
    await myTimesheetPage.goto();
    await expect(myTimesheetPage.status).toHaveText('Status: Not Submitted');

    // He logs 8 hours a day, Monday to Friday
    const editTimesheetPage = await myTimesheetPage.edit();
    const row = editTimesheetPage.row(0);
    await row.project.pick('Website', project);
    await row.activity.choose(activity);
    for (let day = 0; day < 5; day++) await row.hours(day).fill('8');
    await editTimesheetPage.save();

    // The week totals 40 hours, and he submits it
    const logged = myTimesheetPage.row(project, activity);
    await expect(myTimesheetPage.total(logged)).toHaveText('40:00');
    await myTimesheetPage.submit();
  });

  test('supervisor approves a submitted timesheet', async ({
    page,
    pageAs,
    api,
    users,
  }) => {
    // John has submitted last week's timesheet, 8 hours a day
    const {timesheets} = api;
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const timesheet = await timesheets.asUser('john', async () => {
      const created = await timesheets.create(
        lastWeek.toISOString().slice(0, 10),
      );
      await timesheets.logWorkWeek(created, development);
      await timesheets.submit(created.id);
      return created;
    });

    // Mike opens it from Employee Timesheets and approves it
    const employeeTimesheetsPage = new EmployeeTimesheetsPage(
      await pageAs('mike'),
    );
    await employeeTimesheetsPage.goto();
    const employeeTimesheetPage = await employeeTimesheetsPage.view(
      users.john.fullName,
      timesheet,
    );
    await expect(employeeTimesheetPage.status).toHaveText('Status: Submitted');
    await expect(
      employeeTimesheetPage.total(employeeTimesheetPage.row(project, activity)),
    ).toHaveText('40:00');
    await employeeTimesheetPage.act('Approve', 'Looks good');

    // John sees it as Approved
    const myTimesheetPage = new MyTimesheetPage(page);
    await myTimesheetPage.goto(timesheet.startDate);
    await expect(myTimesheetPage.status).toHaveText('Status: Approved');
  });
});
