import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from './base-ui-elements/form';
import {Table} from './base-ui-elements/table';

/** An expense as entered in the Add Expense dialog */
export type Expense = {
  type: string;
  /** Y-m-d */
  date: string;
  /** e.g. "250.50" */
  amount: string;
  note?: string;
};

/** Claim > Submit Claim (claim/submitClaim): starts a new claim */
export class SubmitClaimPage extends Form {
  readonly event = this.select('Event');
  readonly currency = this.select('Currency');
  readonly remarks = this.text('Remarks');

  readonly createButton = this.button('Create');

  constructor(page: Page) {
    super(page, page.locator('form.oxd-form'));
  }

  goto() {
    return this.page.goto('claim/submitClaim');
  }

  /** Create the claim (status Initiated) and open it to add expenses */
  async create(): Promise<ClaimPage> {
    await this.createButton.click();
    await this.page.waitForURL(/claim\/submitClaim\/id\/\d+$/);
    return new ClaimPage(this.page);
  }
}

/**
 * A claim being prepared by its employee (claim/submitClaim/id/{id}): read-
 * only details, then the expenses, then Submit.
 */
export class ClaimPage extends Form {
  readonly referenceId = this.text('Reference Id');
  /** Initiated, Submitted, Paid, ... */
  readonly status = this.text('Status');
  readonly expenses: Table;
  /** e.g. "Total Amount (Euro) : 250.50" */
  readonly total: Locator;

  constructor(page: Page) {
    super(page, page.locator('.oxd-layout-context'));
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
    await this.page.waitForURL(/claim\/(assignClaim|submitClaim)\/id\/\d+$/);
    return new ReviewClaimPage(this.page);
  }
}

/** A submitted claim as an approver sees it (claim/assignClaim/id/{id}) */
export class ReviewClaimPage extends Form {
  readonly status = this.text('Status');
  readonly total: Locator;

  constructor(page: Page) {
    super(page, page.locator('.oxd-layout-context'));
    this.total = page.getByText(/^Total Amount/);
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
