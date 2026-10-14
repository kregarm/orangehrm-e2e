import {expect, type Page} from '@playwright/test';
import {Table} from '../base-ui-elements/table';
import {EmployeeTimesheetPage} from './employee-timesheet-page';

/**
 * Time > Timesheets > Employee Timesheets (time/viewEmployeeTimesheet): the
 * timesheets submitted by the employees the user supervises
 */
export class EmployeeTimesheetsPage {
  readonly pending: Table;

  constructor(readonly page: Page) {
    this.pending = new Table(page);
  }

  goto() {
    return this.page.goto('time/viewEmployeeTimesheet');
  }

  /**
   * Open the pending timesheet of `employee` (full name), for the week of
   * `timesheet` when they have more than one
   */
  async view(
    employee: string,
    timesheet?: {startDate: string; endDate: string},
  ): Promise<EmployeeTimesheetPage> {
    const period = timesheet
      ? [`${timesheet.startDate} - ${timesheet.endDate}`]
      : [];
    await this.pending
      .row(employee, ...period)
      .getByRole('button', {name: 'View', exact: true})
      .click();
    await expect(
      this.page.getByRole('heading', {name: `Timesheet for ${employee}`}),
    ).toBeVisible();
    return new EmployeeTimesheetPage(this.page);
  }
}
