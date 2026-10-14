import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  type AutocompleteField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';
import {toast} from '../base-ui-elements/toast';

/** Performance > Manage Reviews > Add (performance/saveReview) */
export class AddReviewPage {
  readonly form: Form;

  readonly employee: AutocompleteField;
  /** Must be one of the employee's supervisors */
  readonly reviewer: AutocompleteField;
  readonly startDate: TextField;
  readonly endDate: TextField;
  readonly dueDate: TextField;

  readonly activateButton: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.employee = this.form.autocomplete('Employee Name');
    this.reviewer = this.form.autocomplete('Supervisor Reviewer');
    this.startDate = this.form.text('Review Period Start Date');
    this.endDate = this.form.text('Review Period End Date');
    this.dueDate = this.form.text('Due Date');
    this.activateButton = this.form.button('Activate');
  }

  goto() {
    return this.page.goto('performance/saveReview');
  }

  /** Create the review activated (rather than saved as inactive) */
  async activate() {
    await this.activateButton.click();
    await expect(
      toast(this.page, 'success', 'Successfully Activated'),
    ).toBeVisible();
  }
}
