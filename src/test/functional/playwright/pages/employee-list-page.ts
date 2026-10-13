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

import {type Page} from '@playwright/test';
import {FilterPanel} from './base-ui-elements/filter-panel';
import {Table} from './base-ui-elements/table';

export class EmployeeFilterPanel extends FilterPanel {
  readonly employeeName = this.autocomplete('Employee Name');
  readonly employeeId = this.text('Employee Id');
  readonly jobTitle = this.select('Job Title');

  readonly resetButton = this.button('Reset');
  readonly searchButton = this.button('Search');
}

/** PIM > Employee List (pim/viewEmployeeList) */
export class EmployeeListPage {
  readonly filters: EmployeeFilterPanel;
  readonly table: Table;

  constructor(readonly page: Page) {
    this.filters = new EmployeeFilterPanel(page);
    this.table = new Table(page);
  }

  /** The row showing `firstName` and `lastName` in their own columns */
  row(firstName: string, lastName: string) {
    return this.table.row(firstName, lastName);
  }

  goto() {
    return this.page.goto('pim/viewEmployeeList');
  }
}
