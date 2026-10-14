import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {Table} from '../base-ui-elements/table';
import {type TextField} from '../base-ui-elements/base-ui-elements';

/** An expense as entered in the Add Expense dialog */
export type Expense = {
  type: string;
  /** Y-m-d */
  date: string;
  /** e.g. "250.50" */
  amount: string;
  note?: string;
};

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
  readonly expenses: Table;
  /** e.g. "Total Amount (Euro) : 250.50" */
  readonly total: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page, page.locator('.oxd-layout-context'));
    this.referenceId = this.form.text('Reference Id');
    this.status = this.form.text('Status');
    // Expenses come before Attachments
    this.expenses = new Table(page, page.locator('.oxd-table').first());
    this.total = page.getByText(/^Total Amount/);
  }

  /** Add an expense through the Add Expense dialog */
  async addExpense({type, date, amount, note}: Expense) {
    await this.page
      .locator('.orangehrm-action-header', {hasText: 'Expenses'})
      .getByRole('button', {name: 'Add'})
      .click();

    const dialog = new Form(this.page, this.page.getByRole('dialog'));
    await dialog.select('Expense Type').choose(type);
    await dialog.text('Date').fill(date);
    await dialog.text('Amount').fill(amount);
    if (note) await dialog.text('Note').fill(note);

    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/expenses'),
    );
    await dialog.button('Save').click();
    expect((await saved).ok()).toBe(true);
    await expect(dialog.root).toBeHidden();
  }

  /** Submit the claim for approval and wait for it to save */
  async submit() {
    const saved = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().endsWith('/action'),
    );
    await this.page.getByRole('button', {name: 'Submit', exact: true}).click();
    expect((await saved).ok()).toBe(true);
  }
}
