import {type Locator, type Page} from '@playwright/test';
import {FilterPanel} from './base-ui-elements/filter-panel';
import {Table} from './base-ui-elements/table';
import {toast} from './base-ui-elements/toast';

export class EmployeeFilterPanel extends FilterPanel {
  readonly employeeName = this.autocomplete('Employee Name');
  readonly employeeId = this.text('Employee Id');
  readonly jobTitle = this.select('Job Title');
  /** Current Employees Only (default), Current and Past Employees, Past Employees Only */
  readonly include = this.select('Include');

  readonly resetButton = this.button('Reset');
  readonly searchButton = this.button('Search');
}

/** PIM > Employee List (pim/viewEmployeeList) */
export class EmployeeListPage {
  readonly filters: EmployeeFilterPanel;
  readonly table: Table;
  /** "No Records Found", shown when a search finds nobody */
  readonly noRecordsFound: Locator;

  constructor(readonly page: Page) {
    this.filters = new EmployeeFilterPanel(page);
    this.table = new Table(page);
    this.noRecordsFound = toast(page, 'info', 'No Records Found');
  }

  /** The row showing `firstName` and `lastName` in their own columns */
  row(firstName: string, lastName: string) {
    return this.table.row(firstName, lastName);
  }

  goto() {
    return this.page.goto('pim/viewEmployeeList');
  }

  /**
   * Search with the filters. The rows update once the results arrive, so
   * assert on expected rows, or on `noRecordsFound` for an empty result.
   */
  search() {
    return this.filters.searchButton.click();
  }
}
