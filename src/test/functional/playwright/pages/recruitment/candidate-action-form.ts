import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  type AutocompleteField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';

/** The actions the Application Stage offers, depending on the status */
export type CandidateAction = keyof typeof headings;

/** Each action's form heading */
const headings = {
  Shortlist: 'Shortlist Candidate',
  Reject: 'Reject Candidate',
  'Schedule Interview': 'Schedule Interview',
  'Mark Interview Passed': 'Mark Interview Passed',
  'Mark Interview Failed': 'Mark Interview Failed',
  'Offer Job': 'Offer Job',
  'Offer Declined': 'Decline Offer',
  Hire: 'Hire Candidate',
};

/**
 * The form confirming a candidate action, with notes
 * (recruitment/changeCandidateVacancyStatus)
 */
export class CandidateActionForm {
  readonly heading: Locator;
  readonly form: Form;

  readonly notes: TextField;

  // Schedule Interview only
  readonly interviewTitle: TextField;
  readonly interviewer: AutocompleteField;
  readonly date: TextField;

  readonly saveButton: Locator;

  constructor(
    readonly page: Page,
    action: CandidateAction,
  ) {
    this.heading = page.getByRole('heading', {name: headings[action]});
    this.form = new Form(page);
    this.notes = this.form.text('Notes');
    this.interviewTitle = this.form.text('Interview Title');
    this.interviewer = this.form.autocomplete('Interviewer');
    this.date = this.form.text('Date');
    this.saveButton = this.form.button('Save');
  }

  /** Wait for the form to load; the loader shows from the first render */
  async loaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.form.loader).toBeHidden();
  }

  /** Save and wait to be back on the candidate's loaded Application Stage */
  async save() {
    await this.saveButton.click();
    await expect(
      this.page.getByRole('heading', {name: 'Application Stage'}),
    ).toBeVisible();
    await expect(this.page.locator('.oxd-form-loader')).toHaveCount(0);
  }
}
