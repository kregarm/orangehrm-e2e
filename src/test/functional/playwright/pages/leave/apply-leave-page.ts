import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  type SelectField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';
import {toast} from '../base-ui-elements/toast';

/** Leave > Apply (leave/applyLeave), for the logged-in user */
export class ApplyLeavePage {
  readonly form: Form;

  readonly leaveType: SelectField;
  readonly fromDate: TextField;
  readonly toDate: TextField;
  readonly comments: TextField;
  /** e.g. "10.00 Day(s)"; loads after a leave type is chosen */
  readonly balance: Locator;

  readonly applyButton: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.leaveType = this.form.select('Leave Type');
    this.fromDate = this.form.text('From Date');
    this.toDate = this.form.text('To Date');
    this.comments = this.form.text('Comments');
    this.balance = this.form.root.locator('.orangehrm-leave-balance-text');
    this.applyButton = this.form.button('Apply');
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
    await this.fromDate.input.blur();
    await expect(this.toDate.input).toHaveValue(from);
    if (to !== from) {
      await this.toDate.fill(to);
      await this.toDate.input.blur();
    }
  }

  /** Apply and wait for the confirmation */
  async apply() {
    await this.applyButton.click();
    await expect(
      toast(this.page, 'success', 'Successfully Saved'),
    ).toBeVisible();
  }
}
