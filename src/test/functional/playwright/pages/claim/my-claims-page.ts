import {type Page} from '@playwright/test';
import {ClaimsListPage} from './claims-list-page';
import {ClaimPage} from './claim-page';

/** Claim > My Claims (claim/viewClaim): the employee's own claims */
export class MyClaimsPage extends ClaimsListPage {
  constructor(page: Page) {
    super(page, 'claim/viewClaim');
  }

  /** Open one of the employee's claims (claim/submitClaim/id/{id}) */
  async view(referenceId: string): Promise<ClaimPage> {
    await this.viewDetails(referenceId);
    const claimPage = new ClaimPage(this.page);
    await claimPage.loaded();
    return claimPage;
  }
}
