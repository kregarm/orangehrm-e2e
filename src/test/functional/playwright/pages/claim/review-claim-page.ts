import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {type TextField} from '../base-ui-elements/base-ui-elements';
import {ClaimExpenses} from './claim-expenses';

/** A submitted claim as an approver sees it (claim/assignClaim/id/{id}) */
export class ReviewClaimPage {
  readonly heading: Locator;
  /** The claim's read-only details; spans the page, not one form.oxd-form */
  readonly form: Form;

  /** Submitted, Paid, Rejected, ... */
  readonly status: TextField;
  readonly expenses: ClaimExpenses;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Assign Claim'});
    this.form = new Form(page, page.locator('.oxd-layout-context'));
    this.status = this.form.text('Status');
    this.expenses = new ClaimExpenses(page);
  }

  /** Wait for the claim to load; the loader shows from the first render */
  async loaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.form.loader).toBeHidden();
  }

  /**
   * Approve (which also marks it Paid) or Reject; the page reloads with the
   * new status
   */
  async act(action: 'Approve' | 'Reject') {
    await this.page.getByRole('button', {name: action, exact: true}).click();
    const status = {Approve: 'Paid', Reject: 'Rejected'}[action];
    await expect(this.status.input).toHaveValue(status);
  }
}
