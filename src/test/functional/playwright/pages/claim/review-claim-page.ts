import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {type TextField} from '../base-ui-elements/base-ui-elements';

/** A submitted claim as an approver sees it (claim/assignClaim/id/{id}) */
export class ReviewClaimPage {
  readonly heading: Locator;
  /** The claim's read-only details; spans the page, not one form.oxd-form */
  readonly form: Form;

  /** Submitted, Paid, Rejected, ... */
  readonly status: TextField;
  /** e.g. "Total Amount (Euro) : 250.50" */
  readonly total: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Assign Claim'});
    this.form = new Form(page, page.locator('.oxd-layout-context'));
    this.status = this.form.text('Status');
    this.total = page.getByText(/^Total Amount/);
  }

  /** Wait for the claim to load; the loader shows from the first render */
  async loaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.form.loader).toBeHidden();
  }

  /** Approve (which also marks it Paid) or Reject, and wait for it to save */
  async act(action: 'Approve' | 'Reject') {
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().endsWith('/action'),
    );
    await this.page.getByRole('button', {name: action, exact: true}).click();
    expect((await saved).ok()).toBe(true);
  }
}
