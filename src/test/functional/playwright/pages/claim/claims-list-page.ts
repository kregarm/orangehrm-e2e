import {type Page} from '@playwright/test';
import {Table} from '../base-ui-elements/table';
import {ReviewClaimPage} from './review-claim-page';

/**
 * Claim > Employee Claims (claim/viewAssignClaim) or, for the employee,
 * My Claims (claim/viewClaim). Rows are found by reference id.
 */
export class ClaimsListPage {
  readonly table: Table;

  constructor(
    readonly page: Page,
    private readonly url: 'claim/viewAssignClaim' | 'claim/viewClaim',
  ) {
    this.table = new Table(page);
  }

  goto() {
    return this.page.goto(this.url);
  }

  row(referenceId: string) {
    return this.table.row(referenceId);
  }

  /** Open a claim (View Details) to act on it */
  async view(referenceId: string): Promise<ReviewClaimPage> {
    await this.row(referenceId)
      .getByRole('button', {name: 'View Details'})
      .click();
    const reviewClaimPage = new ReviewClaimPage(this.page);
    await reviewClaimPage.loaded();
    return reviewClaimPage;
  }
}
