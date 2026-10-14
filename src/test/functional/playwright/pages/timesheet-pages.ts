import {expect, type Locator, type Page} from '@playwright/test';
import {
  AutocompleteField,
  SelectField,
} from './base-ui-elements/base-ui-elements';
import {Table} from './base-ui-elements/table';

/**
 * A timesheet grid: one row per project activity, a column per day of the
 * week, and a total. Rows read e.g. "Acme - Website | Development | 08:00 ..."
 */
class TimesheetView {
  readonly rows: Locator;
  /** e.g. "Status: Submitted" */
  readonly status: Locator;

  constructor(readonly page: Page) {
    this.rows = page.locator('.orangehrm-timesheet-table-body-row');
    this.status = page.getByText(/^Status: /);
  }

  /** The row of `project` (as "Customer - Project") and `activity` */
  row(project: string, activity: string) {
    return this.rows
      .filter({has: this.page.getByRole('cell', {name: project, exact: true})})
      .filter({
        has: this.page.getByRole('cell', {name: activity, exact: true}),
      });
  }

  /** The Total cell of a row */
  total(row: Locator) {
    return row.getByRole('cell').last();
  }
}

/** Time > Timesheets > My Timesheets (time/viewMyTimesheet), this week's */
export class MyTimesheetPage extends TimesheetView {
  goto() {
    return this.page.goto('time/viewMyTimesheet');
  }

  async edit(): Promise<EditTimesheetPage> {
    await this.page.getByRole('button', {name: 'Edit', exact: true}).click();
    await this.page.waitForURL(/time\/editTimesheet\/\d+$/);
    return new EditTimesheetPage(this.page);
  }

  /** Submit the timesheet for approval and wait for it to save */
  async submit() {
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        /\/api\/v2\/time\/timesheets\/\d+$/.test(response.url()),
    );
    await this.page.getByRole('button', {name: 'Submit', exact: true}).click();
    expect((await saved).ok()).toBe(true);
  }
}

/** Time > My Timesheets > Edit (time/editTimesheet/{id}) */
export class EditTimesheetPage {
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.rows = page.locator(
      '.orangehrm-timesheet-table-body-row:has(.--duration-input)',
    );
  }

  /** The editable row `index` (0-based); "Add Row" adds more */
  row(index: number) {
    const row = this.rows.nth(index);
    const cell = (column: number) => row.getByRole('cell').nth(column);
    return {
      /** Pick by "Customer - Project" */
      project: new AutocompleteField(cell(0), this.page),
      activity: new SelectField(cell(1), this.page),
      /** Duration per day, Monday-first for the default period, e.g. "8" */
      hours: (day: number) => cell(2 + day).locator('input'),
    };
  }

  /** Save and wait for the redirect back to the timesheet */
  async save() {
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().endsWith('/entries'),
    );
    await this.page.getByRole('button', {name: 'Save', exact: true}).click();
    expect((await saved).ok()).toBe(true);
    await this.page.waitForURL(/time\/viewMyTimesheet/);
  }
}

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

/** An employee's timesheet, as their supervisor sees it */
export class EmployeeTimesheetPage extends TimesheetView {
  /** Approve or Reject, optionally with a comment, and wait for it to save */
  async act(action: 'Approve' | 'Reject', comment?: string) {
    if (comment) {
      await this.page.getByPlaceholder('Type here ...').fill(comment);
    }
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        /\/api\/v2\/time\/employees\/\d+\/timesheets\/\d+$/.test(
          response.url(),
        ),
    );
    await this.page.getByRole('button', {name: action, exact: true}).click();
    expect((await saved).ok()).toBe(true);
  }
}
