import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  type SelectField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';
import {toast} from '../base-ui-elements/toast';

/** PIM / My Info > Contact Details (pim/contactDetails/empNumber/{n}) */
export class ContactDetailsPage {
  readonly heading: Locator;
  readonly form: Form;

  readonly street1: TextField;
  readonly city: TextField;
  readonly country: SelectField;
  readonly mobilePhone: TextField;
  readonly workEmail: TextField;

  readonly saveButton: Locator;
  readonly savedToast: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Contact Details'});
    this.form = new Form(page);
    this.street1 = this.form.text('Street 1');
    this.city = this.form.text('City');
    this.country = this.form.select('Country');
    this.mobilePhone = this.form.text('Mobile');
    this.workEmail = this.form.text('Work Email');
    this.saveButton = this.form.button('Save');
    this.savedToast = toast(page, 'success', 'Successfully Updated');
  }

  /** Open the page and wait for the saved details to be filled in */
  async goto(empNumber: number) {
    await this.page.goto(`pim/contactDetails/empNumber/${empNumber}`);
    // The loader shows from the first render, along with the heading
    await expect(this.heading).toBeVisible();
    await expect(this.form.loader).toBeHidden();
  }

  async save() {
    await this.saveButton.click();
    await expect(this.savedToast).toBeVisible();
  }
}
