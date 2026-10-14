import {expect, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {type TextField} from '../base-ui-elements/base-ui-elements';
import {ClaimExpenses} from './claim-expenses';

/**
 * A claim being prepared by its employee (claim/submitClaim/id/{id}): read-
 * only details, then the expenses, then Submit.
 */
export class ClaimPage {
  /** The claim's read-only details; spans the page, not one form.oxd-form */
  readonly form: Form;

  readonly referenceId: TextField;
  /** Initiated, Submitted, Paid, ... */
  readonly status: TextField;
  readonly expenses: ClaimExpenses;

  constructor(readonly page: Page) {
    this.form = new Form(page, page.locator('.oxd-layout-context'));
    this.referenceId = this.form.text('Reference Id');
    this.status = this.form.text('Status');
    this.expenses = new ClaimExpenses(page);
  }

  /**
   * Wait for the claim to load. The Expenses section is only on this page,
   * not on Submit Claim's create form.
   */
  async loaded() {
    await expect(
      this.page.getByRole('heading', {name: 'Expenses'}),
    ).toBeVisible();
    await expect(this.page.locator('.oxd-form-loader')).toHaveCount(0);
  }

  /** Submit the claim for approval; the page reloads with it Submitted */
  async submit() {
    await this.page.getByRole('button', {name: 'Submit', exact: true}).click();
    await expect(this.status.input).toHaveValue('Submitted');
  }
}
