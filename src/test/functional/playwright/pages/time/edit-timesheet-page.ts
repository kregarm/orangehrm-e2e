import {expect, type Locator, type Page} from '@playwright/test';
import {
  AutocompleteField,
  SelectField,
} from '../base-ui-elements/base-ui-elements';
import {timesheetCell, type Weekday} from './timesheet-view';

/** Time > My Timesheets > Edit (time/editTimesheet/{id}) */
export class EditTimesheetPage {
  readonly heading: Locator;
  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Edit Timesheet'});
    this.rows = page.locator(
      '.orangehrm-timesheet-table-body-row:has(.--duration-input)',
    );
  }

  /**
   * The editable row `index` (0-based); "Add Row" adds more. Rows are only
   * told apart by position until a project is picked.
   */
  row(index: number) {
    const row = this.rows.nth(index);
    return {
      /** Pick by "Customer - Project" */
      project: new AutocompleteField(
        row
          .getByRole('cell')
          .filter({has: this.page.locator('.oxd-autocomplete-wrapper')}),
        this.page,
      ),
      activity: new SelectField(
        row
          .getByRole('cell')
          .filter({has: this.page.locator('.oxd-select-wrapper')}),
        this.page,
      ),
      /** The day's duration input, e.g. filled with "8" */
      hours: async (day: Weekday) =>
        (await timesheetCell(this.page, row, day)).locator('input'),
    };
  }

  /** Save and wait to be back on My Timesheet */
  async save() {
    await this.page.getByRole('button', {name: 'Save', exact: true}).click();
    await expect(
      this.page.getByRole('heading', {name: 'My Timesheet'}),
    ).toBeVisible();
  }
}
