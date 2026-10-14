import {expect} from '@playwright/test';
import {Form} from './base-ui-elements/form';
import {toast} from './base-ui-elements/toast';

/** PIM / My Info > Contact Details (pim/contactDetails/empNumber/{n}) */
export class ContactDetailsPage extends Form {
  readonly street1 = this.text('Street 1');
  readonly street2 = this.text('Street 2');
  readonly city = this.text('City');
  readonly state = this.text('State/Province');
  readonly zipCode = this.text('Zip/Postal Code');
  readonly country = this.select('Country');
  readonly homePhone = this.text('Home');
  readonly mobilePhone = this.text('Mobile');
  readonly workPhone = this.text('Work');
  readonly workEmail = this.text('Work Email');
  readonly otherEmail = this.text('Other Email');

  readonly saveButton = this.button('Save');
  readonly heading = this.page.getByRole('heading', {name: 'Contact Details'});
  readonly savedToast = toast(this.page, 'success', 'Successfully Updated');

  /** Open the page and wait for the saved details to be filled in */
  async goto(empNumber: number) {
    await this.page.goto(`pim/contactDetails/empNumber/${empNumber}`);
    // The loader shows from the first render, along with the heading
    await expect(this.heading).toBeVisible();
    await expect(this.loader).toBeHidden();
  }

  async save() {
    await this.saveButton.click();
    await expect(this.savedToast).toBeVisible();
  }
}
