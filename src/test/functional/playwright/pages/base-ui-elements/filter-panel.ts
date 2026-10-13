import {type Locator, type Page} from '@playwright/test';
import {Form} from './form';

export class FilterPanel extends Form {
  readonly title: Locator;
  readonly toggle: Locator;

  constructor(page: Page, root?: Locator) {
    super(page, root ?? page.locator('.oxd-table-filter'));
    this.title = this.root.locator('.oxd-table-filter-header-title');
    this.toggle = this.root.locator('.oxd-table-filter-header-options button');
  }
}
