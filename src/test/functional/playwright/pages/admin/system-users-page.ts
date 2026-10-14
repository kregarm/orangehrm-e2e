import {type Locator, type Page} from '@playwright/test';
import {Table} from '../base-ui-elements/table';
import {EditSystemUserPage} from './edit-system-user-page';

/** Admin > User Management > Users (admin/viewSystemUsers) */
export class SystemUsersPage {
  readonly table: Table;
  /** A row's edit action (the pencil), to look up within a row */
  readonly editButton: Locator;

  constructor(readonly page: Page) {
    this.table = new Table(page);
    this.editButton = page.locator('button:has(.bi-pencil-fill)');
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
    return this.table.cell(row, 'Status');
  }

  /** Open the user's edit form (the pencil action) */
  async edit(row: Locator): Promise<EditSystemUserPage> {
    await row.locator(this.editButton).click();
    const editSystemUserPage = new EditSystemUserPage(this.page);
    await editSystemUserPage.loaded();
    return editSystemUserPage;
  }
}
