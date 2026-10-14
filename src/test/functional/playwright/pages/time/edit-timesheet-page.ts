import {type Locator, type Page} from '@playwright/test';
import {
  AutocompleteField,
  SelectField,
} from '../base-ui-elements/base-ui-elements';

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
    await this.page.getByRole('button', {name: 'Save', exact: true}).click();
    await this.page.waitForURL(/time\/viewMyTimesheet/);
  }
}
