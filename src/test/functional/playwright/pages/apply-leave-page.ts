import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from './base-ui-elements/form';

/** Leave > Apply (leave/applyLeave), for the logged-in user */
export class ApplyLeavePage extends Form {
  readonly leaveType = this.select('Leave Type');
  readonly fromDate = this.text('From Date');
  readonly toDate = this.text('To Date');
  readonly comments = this.text('Comments');
  /** e.g. "10.00 Day(s)"; loads after a leave type is chosen */
  readonly balance: Locator;

  readonly applyButton = this.button('Apply');

  constructor(page: Page) {
    super(page);
    this.balance = this.root.locator('.orangehrm-leave-balance-text');
  }

  goto() {
    return this.page.goto('leave/applyLeave');
  }

  /**
   * Leaving From Date copies it into To Date, so wait for that before
   * filling To Date or the two values get concatenated.
   */
  async dates(from: string, to = from) {
    await this.fromDate.fill(from);
    await this.fromDate.root.locator('input').blur();
    await expect(this.toDate.root.locator('input')).toHaveValue(from);
    if (to !== from) {
      await this.toDate.fill(to);
      await this.toDate.root.locator('input').blur();
    }
  }

  /** Apply and return the new leave request's id */
  async apply(): Promise<number> {
    const created = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/api/v2/leave/leave-requests'),
    );
    await this.applyButton.click();
    const response = await created;
    expect(response.ok()).toBe(true);
    return ((await response.json()) as {data: {id: number}}).data.id;
  }
}
