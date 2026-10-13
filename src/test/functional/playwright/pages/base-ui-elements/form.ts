import {type Locator, type Page} from '@playwright/test';
import {AutocompleteField, SelectField, TextField} from './base-ui-elements';

/** An oxd-form whose fields are located by their label */
export class Form {
  readonly actions: Locator;

  constructor(
    readonly page: Page,
    readonly root: Locator,
  ) {
    this.actions = this.root.locator('.oxd-form-actions');
  }

  protected group(label: string) {
    return this.root.locator('.oxd-input-group', {
      has: this.page.locator('label', {hasText: new RegExp(`^${label}$`)}),
    });
  }

  text(label: string) {
    return new TextField(this.group(label));
  }

  select(label: string) {
    return new SelectField(this.group(label), this.page);
  }

  autocomplete(label: string) {
    return new AutocompleteField(this.group(label), this.page);
  }

  // footers differ per page; subclasses declare their own, e.g. searchButton = this.button('Search')
  button(name: string) {
    return this.actions.getByRole('button', {name, exact: true});
  }
}
