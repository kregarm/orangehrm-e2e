import {test, expect} from '../../../support/fixtures';
import {ApplyLeavePage} from '../../../pages/leave/apply-leave-page';
import {LeaveListPage, leaveDates} from '../../../pages/leave/leave-list-page';
import {MyLeaveListPage} from '../../../pages/leave/my-leave-list-page';
import {workingDay} from '../../../data/leave';
import type {LeavePeriod} from '../../../api/leave/LeavePeriodsApiClass';
import type {LeaveType} from '../../../api/leave/LeaveTypesApiClass';

// John: 10 days Annual Leave, supervised by Mike. Each test books its own week.
test.describe('Leave - Leave requests', () => {
  test.use({loginAs: 'john'});

  let period: LeavePeriod;
  let nextPeriod: LeavePeriod;
  let annual: LeaveType;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    const periods = await api.leavePeriods.define();
    [period, nextPeriod] = periods;
    annual = await api.leaveTypes.create({name: 'Annual Leave'});

    const john = await api.users.ensure(users.john);
    const mike = await api.users.ensure(users.mike);
    await api.employees.addSupervisor(
      john.employee.empNumber,
      mike.employee.empNumber,
    );
    // The next period's too, for the leave that must be in the future
    for (const {startDate, endDate} of periods) {
      await api.leaveEntitlements.add({
        empNumber: john.employee.empNumber,
        leaveTypeId: annual.id,
        fromDate: startDate,
        toDate: endDate,
        entitlement: 10,
      });
    }
  });

  test('employee applies for leave and it is pending approval', async ({
    page,
    api,
    users,
  }) => {
    const {leaveRequests} = api;
    const balance = () =>
      leaveRequests.asUser('john', () => leaveRequests.balance(annual.id));
    const before = await balance();
    const from = workingDay(period, 1, 0);
    const to = workingDay(period, 1, 1);

    // John applies for two days
    const applyLeavePage = new ApplyLeavePage(page);
    await applyLeavePage.goto();
    await applyLeavePage.leaveType.choose(annual.name);
    await expect(applyLeavePage.balance).toHaveText(
      `${before.balance.toFixed(2)} Day(s)`,
    );
    await applyLeavePage.dates(from, to);
    await applyLeavePage.comments.fill('Family trip');
    await applyLeavePage.apply();

    // The two days move from the balance to pending
    expect(await balance()).toMatchObject({
      balance: before.balance - 2,
      pending: before.pending + 2,
    });

    // My Leave shows the request pending approval
    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto();
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(from, to));
    await expect(await myLeaveListPage.status(row)).toHaveText(
      'Pending Approval (2.00)',
    );
  });

  test('supervisor approves leave and it is scheduled', async ({
    page,
    pageAs,
    api,
    users,
  }) => {
    const {leaveRequests} = api;
    // Next period: always in the future, so approved leave stays Scheduled
    const date = workingDay(nextPeriod, 1);

    // John has a pending request
    await leaveRequests.asUser('john', () =>
      leaveRequests.apply({leaveTypeId: annual.id, fromDate: date}),
    );

    // Mike approves it, and it leaves his pending list
    const leaveListPage = new LeaveListPage(await pageAs('mike'));
    await leaveListPage.goto(nextPeriod);
    const pending = leaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(await leaveListPage.status(pending)).toHaveText(
      'Pending Approval (1.00)',
    );
    await leaveListPage.act(pending, 'Approve');
    await expect(pending).toHaveCount(0);

    // John sees it as Scheduled
    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto(nextPeriod);
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(await myLeaveListPage.status(row)).toHaveText(
      'Scheduled (1.00)',
    );
  });

  test('supervisor rejects leave and the days return to the balance', async ({
    page,
    pageAs,
    api,
    users,
  }) => {
    const {leaveRequests} = api;
    const balance = () =>
      leaveRequests.asUser('john', () => leaveRequests.balance(annual.id));
    const before = await balance();
    const date = workingDay(period, 3);

    // John has a pending request, taking a day off the balance
    await leaveRequests.asUser('john', () =>
      leaveRequests.apply({leaveTypeId: annual.id, fromDate: date}),
    );
    expect((await balance()).balance).toBe(before.balance - 1);

    // Mike rejects it
    const leaveListPage = new LeaveListPage(await pageAs('mike'));
    await leaveListPage.goto();
    const pending = leaveListPage.row(users.john.fullName, leaveDates(date));
    await leaveListPage.act(pending, 'Reject');
    await expect(pending).toHaveCount(0);

    // The day returns to the balance
    expect(await balance()).toMatchObject({
      balance: before.balance,
      pending: before.pending,
    });

    // John sees it as Rejected
    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto();
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(await myLeaveListPage.status(row)).toHaveText(
      'Rejected (1.00)',
    );
  });

  test('employee cancels their pending leave', async ({page, api, users}) => {
    const {leaveRequests} = api;
    const balance = () =>
      leaveRequests.asUser('john', () => leaveRequests.balance(annual.id));
    const before = await balance();
    const date = workingDay(period, 4);

    // John has a pending request
    await leaveRequests.asUser('john', () =>
      leaveRequests.apply({leaveTypeId: annual.id, fromDate: date}),
    );

    // He cancels it in My Leave
    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto();
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(await myLeaveListPage.status(row)).toHaveText(
      'Pending Approval (1.00)',
    );
    await myLeaveListPage.act(row, 'Cancel');
    await expect(await myLeaveListPage.status(row)).toHaveText(
      'Cancelled (1.00)',
    );

    // The day returns to the balance
    expect(await balance()).toMatchObject({
      balance: before.balance,
      pending: before.pending,
    });
  });
});
