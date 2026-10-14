import {type Locator, type Page} from '@playwright/test';

/** The top bar of every page once logged in */
export class TopBar {
  /** The user dropdown, showing the logged-in user's name */
  readonly userDropdown: Locator;

  constructor(readonly page: Page) {
    this.userDropdown = page.locator('.oxd-userdropdown-tab');
  }

  /** Log out through the user dropdown; the app returns to the login form */
  async logout() {
    await this.userDropdown.click();
    await this.page.getByRole('menuitem', {name: 'Logout'}).click();
  }
}
