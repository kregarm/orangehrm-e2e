import {type Locator, type Page} from '@playwright/test';

/**
 * A timesheet grid, the base of the pages showing one: one row per project
 * activity, a column per day of the week, and a total. Rows read e.g.
 * "Acme - Website | Development | 08:00 ..."
 */
export class TimesheetView {
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
