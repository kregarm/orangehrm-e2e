import {type Locator, type Page} from '@playwright/test';

/** Public job board (recruitmentApply/jobs.html), no login needed */
export class PublicJobsPage {
  readonly cards: Locator;

  constructor(readonly page: Page) {
    this.cards = page.locator('.orangehrm-card-container');
  }

  /**
   * The vacancy card titled `name`. The cards render after the page loads,
   * so before asserting a card is absent, wait for one that should be there.
   */
  card(name: string) {
    return this.cards.filter({
      has: this.page
        .locator('.orangehrm-vacancy-card-header')
        .getByText(name, {exact: true}),
    });
  }

  goto() {
    return this.page.goto('recruitmentApply/jobs.html');
  }
}
