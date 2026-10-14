import {expect, type Locator, type Page} from '@playwright/test';
import {Table} from './base-ui-elements/table';
import {toast} from './base-ui-elements/toast';
import type {LeavePeriod} from '../api/leave/LeavePeriodsApiClass';

/**
 * Leave > Leave List (leave/viewLeaveList): the leave of the employees the
 * user may manage. By default it lists the current leave period's requests
 * pending approval.
 */
export class LeaveListPage {
  readonly table: Table;

  constructor(
    readonly page: Page,
    private readonly url = 'leave/viewLeaveList',
  ) {
    this.table = new Table(page);
  }

  /** `range` replaces the default current leave period, e.g. with the next one */
  async goto(range?: LeavePeriod) {
    const query = range
      ? `?${new URLSearchParams({fromDate: range.startDate, toDate: range.endDate})}`
      : '';
    await this.page.goto(`${this.url}${query}`);
  }

  /** The row of `employee`'s request over `dates`, as the Date column shows them */
  row(employee: string, dates: string) {
    return this.table.row(dates, employee);
  }

  /** The Status cell, e.g. "Pending Approval (2.00)" */
  status(row: Locator) {
    return row.getByRole('cell').nth(6);
  }

  /** Click a row action (Approve, Reject, Cancel) and wait for the confirmation */
  async act(row: Locator, action: 'Approve' | 'Reject' | 'Cancel') {
    await row.getByRole('button', {name: action, exact: true}).click();
    await expect(
      toast(this.page, 'success', 'Successfully Updated'),
    ).toBeVisible();
  }
}

/** Leave > My Leave (leave/viewMyLeaveList): the user's own requests */
export class MyLeaveListPage extends LeaveListPage {
  constructor(page: Page) {
    super(page, 'leave/viewMyLeaveList');
  }
}

/** The Date column of a request: "2026-01-05" or "2026-01-05 to 2026-01-06" */
export const leaveDates = (from: string, to = from) =>
  from === to ? from : `${from} to ${to}`;
