/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */

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
