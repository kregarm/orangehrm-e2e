import {type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  type SelectField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';
import {ClaimPage} from './claim-page';

/** Claim > Submit Claim (claim/submitClaim): starts a new claim */
export class SubmitClaimPage {
  readonly form: Form;

  readonly event: SelectField;
  readonly currency: SelectField;
  readonly remarks: TextField;

  readonly createButton: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.event = this.form.select('Event');
    this.currency = this.form.select('Currency');
    this.remarks = this.form.text('Remarks');
    this.createButton = this.form.button('Create');
  }

  goto() {
    return this.page.goto('claim/submitClaim');
  }

  /** Create the claim (status Initiated) and open it to add expenses */
  async create(): Promise<ClaimPage> {
    await this.createButton.click();
    const claimPage = new ClaimPage(this.page);
    await claimPage.loaded();
    return claimPage;
  }
}
