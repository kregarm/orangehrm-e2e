import {test, expect} from '../../../support/fixtures';
import {ApplyLeavePage} from '../../../pages/apply-leave-page';
import {
  LeaveListPage,
  MyLeaveListPage,
  leaveDates,
} from '../../../pages/leave-list-page';
import {workingDay} from '../../../data/leave';
import type {LeavePeriod} from '../../../api/leave/LeavePeriodsApiClass';
import type {LeaveType} from '../../../api/leave/LeaveTypesApiClass';

/**
 * John (ESS) has 10 days of Annual Leave per period and reports to Mike, who
 * thereby gets the Supervisor role and handles John's requests. The tests
 * share the database, so each uses its own week to keep the requests apart.
 */
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

    const applyLeavePage = new ApplyLeavePage(page);
    await applyLeavePage.goto();
    await applyLeavePage.leaveType.choose(annual.name);
    await expect(applyLeavePage.balance).toHaveText(
      `${before.balance.toFixed(2)} Day(s)`,
    );
    await applyLeavePage.dates(from, to);
    await applyLeavePage.comments.fill('Family trip');
    await applyLeavePage.apply();

    expect(await balance()).toMatchObject({
      balance: before.balance - 2,
      pending: before.pending + 2,
    });

    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto();
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(from, to));
    await expect(myLeaveListPage.status(row)).toHaveText(
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
    // Approved leave is Scheduled until its date has passed, then Taken, so
    // use the next period: always in the future, and apart from the others
    const date = workingDay(nextPeriod, 1);
    await leaveRequests.asUser('john', () =>
      leaveRequests.apply({leaveTypeId: annual.id, fromDate: date}),
    );

    const leaveListPage = new LeaveListPage(await pageAs('mike'));
    // The lists default to the current period
    await leaveListPage.goto(nextPeriod);
    const pending = leaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(leaveListPage.status(pending)).toHaveText(
      'Pending Approval (1.00)',
    );
    await leaveListPage.act(pending, 'Approve');
    // The list only shows pending requests
    await expect(pending).toHaveCount(0);

    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto(nextPeriod);
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(myLeaveListPage.status(row)).toHaveText('Scheduled (1.00)');
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
    await leaveRequests.asUser('john', () =>
      leaveRequests.apply({leaveTypeId: annual.id, fromDate: date}),
    );
    expect((await balance()).balance).toBe(before.balance - 1);

    const leaveListPage = new LeaveListPage(await pageAs('mike'));
    await leaveListPage.goto();
    const pending = leaveListPage.row(users.john.fullName, leaveDates(date));
    await leaveListPage.act(pending, 'Reject');
    await expect(pending).toHaveCount(0);

    expect(await balance()).toMatchObject({
      balance: before.balance,
      pending: before.pending,
    });

    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto();
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(myLeaveListPage.status(row)).toHaveText('Rejected (1.00)');
  });

  test('employee cancels their pending leave', async ({page, api, users}) => {
    const {leaveRequests} = api;
    const balance = () =>
      leaveRequests.asUser('john', () => leaveRequests.balance(annual.id));
    const before = await balance();
    const date = workingDay(period, 4);
    await leaveRequests.asUser('john', () =>
      leaveRequests.apply({leaveTypeId: annual.id, fromDate: date}),
    );

    const myLeaveListPage = new MyLeaveListPage(page);
    await myLeaveListPage.goto();
    const row = myLeaveListPage.row(users.john.fullName, leaveDates(date));
    await expect(myLeaveListPage.status(row)).toHaveText(
      'Pending Approval (1.00)',
    );
    await myLeaveListPage.act(row, 'Cancel');
    await expect(myLeaveListPage.status(row)).toHaveText('Cancelled (1.00)');

    expect(await balance()).toMatchObject({
      balance: before.balance,
      pending: before.pending,
    });
  });
});
