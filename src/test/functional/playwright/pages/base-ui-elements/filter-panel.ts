import { type Locator, type Page } from '@playwright/test';
import { AutocompleteField, SelectField, TextField } from './base-ui-elements';

export class FilterPanel {
  readonly root: Locator;
  readonly title: Locator;
  readonly toggle: Locator;
  readonly actions: Locator;

  constructor(readonly page: Page, root?: Locator) {
    this.root = root ?? page.locator('.oxd-table-filter');
    this.title = this.root.locator('.oxd-table-filter-header-title');
    this.toggle = this.root.locator('.oxd-table-filter-header-options button');
    this.actions = this.root.locator('.oxd-form-actions');
  }

  private group(label: string) {
    return this.root.locator('.oxd-input-group', {
      has: this.page.locator('label', { hasText: new RegExp(`^${label}$`) }),
    });
  }

  text(label: string)         { return new TextField(this.group(label)); }
  select(label: string)       { return new SelectField(this.group(label), this.page); }
  autocomplete(label: string) { return new AutocompleteField(this.group(label), this.page); }

  // footers differ per page; subclasses declare their own, e.g. searchButton = this.button('Search')
  button(name: string) { return this.actions.getByRole('button', { name, exact: true }); }
}