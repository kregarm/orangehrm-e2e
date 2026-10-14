import {type Page} from '@playwright/test';
import {ClaimsListPage} from './claims-list-page';
import {ReviewClaimPage} from './review-claim-page';

/** Claim > Employee Claims (claim/viewAssignClaim), for approvers */
export class EmployeeClaimsPage extends ClaimsListPage {
  constructor(page: Page) {
    super(page, 'claim/viewAssignClaim');
  }

  /** Open a claim to act on it (claim/assignClaim/id/{id}) */
  async view(referenceId: string): Promise<ReviewClaimPage> {
    await this.viewDetails(referenceId);
    const reviewClaimPage = new ReviewClaimPage(this.page);
    await reviewClaimPage.loaded();
    return reviewClaimPage;
  }
}
