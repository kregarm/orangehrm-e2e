import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {Table} from '../base-ui-elements/table';

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
 * The Expenses section of a claim (ClaimExpenses.vue), on both the
 * employee's and the approver's claim page
 */
export class ClaimExpenses {
  readonly addButton: Locator;
  readonly table: Table;
  /** e.g. "Total Amount (Euro) : 250.50" */
  readonly total: Locator;

  constructor(readonly page: Page) {
    // Attachments has its own header and table, so pick the Expenses ones
    const header = page.locator('.orangehrm-action-header', {
      hasText: 'Expenses',
    });
    this.addButton = header.getByRole('button', {name: 'Add'});

    const expenseTypeColumn = page.getByRole('columnheader', {
      name: 'Expense Type',
    });
    this.table = new Table(
      page,
      page.locator('.oxd-table', {has: expenseTypeColumn}),
    );

    this.total = page.locator('.orangehrm-bottom-container');
  }

  /** Add an expense through the Add Expense dialog */
  async add({type, date, amount, note}: Expense) {
    await this.addButton.click();

    const dialog = new Form(this.page, this.page.getByRole('dialog'));
    await dialog.select('Expense Type').choose(type);
    await dialog.text('Date').fill(date);
    await dialog.text('Amount').fill(amount);
    if (note) await dialog.text('Note').fill(note);

    // The dialog closes once the expense is saved
    await dialog.button('Save').click();
    await expect(dialog.root).toBeHidden();
  }
}
