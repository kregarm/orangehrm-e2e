import {type Page} from '@playwright/test';
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

  /** Open the pending timesheet of `employee` (full name) */
  async view(employee: string): Promise<EmployeeTimesheetPage> {
    await this.pending
      .row(employee)
      .getByRole('button', {name: 'View', exact: true})
      .click();
    await this.page.waitForURL(/time\/viewTimesheet\/employeeId\/\d+/);
    return new EmployeeTimesheetPage(this.page);
  }
}
