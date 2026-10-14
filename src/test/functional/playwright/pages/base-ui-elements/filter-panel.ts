import {type Locator, type Page} from '@playwright/test';
import {Form} from './form';

/** The filters above a list (.oxd-table-filter) */
export class FilterPanel extends Form {
  constructor(page: Page, root?: Locator) {
    super(page, root ?? page.locator('.oxd-table-filter'));
  }
}
