import {type Locator, type Page} from '@playwright/test';

/** An oxd list table (.oxd-table), as on most list pages */
export class Table {
  readonly rows: Locator;

  constructor(
    readonly page: Page,
    readonly root: Locator = page.locator('.oxd-table'),
  ) {
    this.rows = root.locator('.oxd-table-body .oxd-table-card');
  }

  /** The rows having a cell for each of `cells`, matched exactly */
  row(...cells: string[]) {
    return cells.reduce(
      (rows, name) =>
        rows.filter({has: this.page.getByRole('cell', {name, exact: true})}),
      this.rows,
    );
  }
}
