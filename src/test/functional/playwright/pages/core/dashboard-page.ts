import {type Locator, type Page} from '@playwright/test';
import {TopBar} from './top-bar';

/** The dashboard (dashboard/index), where a successful login lands */
export class DashboardPage {
  readonly heading: Locator;
  readonly topBar: TopBar;
  /** The main menu on the side, listing the modules the user may open */
  readonly menu: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Dashboard'});
    this.topBar = new TopBar(page);
    this.menu = page.getByRole('navigation');
  }
}
