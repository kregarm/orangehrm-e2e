import {type Locator, type Page} from '@playwright/test';
import {Form} from './form';

/** The filters above a list (.oxd-table-filter) */
export class FilterPanel extends Form {
  readonly searchButton: Locator;

  constructor(page: Page, root?: Locator) {
    super(page, root ?? page.locator('.oxd-table-filter'));
    this.searchButton = this.button('Search');
  }

  /**
   * Search with the filters. The rows update once the results arrive, so
   * assert on the expected rows (or the "No Records Found" toast).
   */
  search() {
    return this.searchButton.click();
  }
}
