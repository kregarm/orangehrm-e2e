import {type Locator, type Page} from '@playwright/test';

/** Public job board (recruitmentApply/jobs.html), no login needed */
export class PublicJobsPage {
  readonly cards: Locator;

  constructor(readonly page: Page) {
    this.cards = page.locator('.orangehrm-card-container');
  }

  /** The vacancy card titled `name` */
  card(name: string) {
    return this.cards.filter({
      has: this.page.locator('.orangehrm-vacancy-card-header', {
        hasText: new RegExp(`^${name}`),
      }),
    });
  }

  /** Wait for the vacancy list request so an absent card is meaningful */
  async goto() {
    const loaded = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/v2/recruitment/public/vacancies') &&
        response.ok(),
    );
    await this.page.goto('recruitmentApply/jobs.html');
    await loaded;
  }
}
