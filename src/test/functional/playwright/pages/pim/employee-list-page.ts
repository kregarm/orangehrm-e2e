import {type Locator, type Page} from '@playwright/test';
import {Table} from '../base-ui-elements/table';
import {toast} from '../base-ui-elements/toast';
import {EmployeeFilterPanel} from './employee-filter-panel';

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
}
