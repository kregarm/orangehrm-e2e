import {type Locator, type Page} from '@playwright/test';

/** A timesheet day column, by its header's weekday (headed e.g. "13 Mon") */
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

/**
 * The cell of `row` in the timesheet column headed `column`: "Project",
 * "Activity", "Total" or a Weekday. The grid is a plain table, not an oxd
 * Table, and the day headers also show the date.
 */
export const timesheetCell = async (
  page: Page,
  row: Locator,
  column: string,
) => {
  const headers = page
    .locator('.orangehrm-timesheet-table-header-row')
    .getByRole('columnheader');
  await headers.first().waitFor();
  const index = (await headers.allInnerTexts()).findIndex(
    (text) => text.trim().split(/\s+/).pop() === column,
  );
  if (index < 0) throw new Error(`The timesheet has no "${column}" column`);
  return row.getByRole('cell').nth(index);
};

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
    return timesheetCell(this.page, row, 'Total');
  }
}
