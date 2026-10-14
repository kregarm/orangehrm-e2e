import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from './base-ui-elements/form';
import {
  type SelectField,
  type TextField,
} from './base-ui-elements/base-ui-elements';

/** Admin > User Management > Users > Edit (admin/saveSystemUser/{id}) */
export class EditSystemUserPage {
  readonly heading: Locator;
  readonly form: Form;

  readonly userRole: SelectField;
  readonly status: SelectField;
  readonly username: TextField;

  readonly saveButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Edit User'});
    this.form = new Form(page);
    this.userRole = this.form.select('User Role');
    this.status = this.form.select('Status');
    this.username = this.form.text('Username');
    this.saveButton = this.form.button('Save');
  }

  /**
   * Wait for the user's details to load into the form; edits made before
   * that would be overwritten. The loader shows from the first render.
   */
  async loaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.form.loader).toBeHidden();
  }

  /** Save and wait for the redirect back to the list */
  async save() {
    await this.saveButton.click();
    await this.page.waitForURL('**/admin/viewSystemUsers');
  }
}
