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
