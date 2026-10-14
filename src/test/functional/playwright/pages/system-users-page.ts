import {type Locator, type Page} from '@playwright/test';
import {Form} from './base-ui-elements/form';
import {Table} from './base-ui-elements/table';

/** Admin > User Management > Users (admin/viewSystemUsers) */
export class SystemUsersPage {
  readonly table: Table;

  constructor(readonly page: Page) {
    this.table = new Table(page);
  }

  goto() {
    return this.page.goto('admin/viewSystemUsers');
  }

  /** The row of the login `username` */
  row(username: string) {
    return this.table.row(username);
  }

  /** The Status cell: Enabled or Disabled */
  status(row: Locator) {
    return row.getByRole('cell').nth(4);
  }

  /** Open the user's edit form (the pencil action) */
  async edit(row: Locator): Promise<EditSystemUserPage> {
    await row.locator('.bi-pencil-fill').click();
    await this.page.waitForURL(/admin\/saveSystemUser\/\d+$/);
    return new EditSystemUserPage(this.page);
  }
}

/** Admin > User Management > Users > Edit (admin/saveSystemUser/{id}) */
export class EditSystemUserPage extends Form {
  readonly userRole = this.select('User Role');
  readonly status = this.select('Status');
  readonly username = this.text('Username');

  readonly saveButton = this.button('Save');

  constructor(page: Page) {
    super(page, page.locator('form.oxd-form'));
  }

  /** Save and wait for the redirect back to the users list */
  async save() {
    await this.saveButton.click();
    await this.page.waitForURL(/admin\/viewSystemUsers$/);
  }
}
