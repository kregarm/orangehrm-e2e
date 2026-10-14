import {type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  type AutocompleteField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';

/**
 * The form confirming a candidate action, with notes
 * (recruitment/changeCandidateVacancyStatus)
 */
export class CandidateActionForm {
  readonly form: Form;

  readonly notes: TextField;

  // Schedule Interview only
  readonly interviewTitle: TextField;
  readonly interviewer: AutocompleteField;
  readonly date: TextField;
  readonly time: TextField;

  readonly saveButton: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.notes = this.form.text('Notes');
    this.interviewTitle = this.form.text('Interview Title');
    this.interviewer = this.form.autocomplete('Interviewer');
    this.date = this.form.text('Date');
    this.time = this.form.text('Time');
    this.saveButton = this.form.button('Save');
  }

  /** Save and wait for the redirect back to the candidate */
  async save() {
    await this.saveButton.click();
    await this.page.waitForURL(/recruitment\/addCandidate\/\d+$/);
  }
}
