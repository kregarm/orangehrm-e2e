import {type Page} from '@playwright/test';
import {SwitchField} from './base-ui-elements/base-ui-elements';
import {Form} from './base-ui-elements/form';

/** PIM > Add Employee (pim/addEmployee) */
export class AddEmployeePage extends Form {
  // The name inputs share the one "Employee Full Name" label
  readonly firstName = this.placeholder('First Name');
  readonly middleName = this.placeholder('Middle Name');
  readonly lastName = this.placeholder('Last Name');
  readonly employeeId = this.text('Employee Id');
  readonly createLoginDetails = new SwitchField(
    this.root.locator('.user-form-header', {hasText: 'Create Login Details'}),
  );

  // Shown once createLoginDetails is on
  readonly username = this.text('Username');
  readonly password = this.text('Password');
  readonly confirmPassword = this.text('Confirm Password');

  readonly saveButton = this.button('Save');

  constructor(page: Page) {
    super(page, page.locator('form.oxd-form'));
  }

  /** Enabled or Disabled login */
  status(status: 'Enabled' | 'Disabled') {
    return this.root.getByText(status, {exact: true}).click();
  }

  goto() {
    return this.page.goto('pim/addEmployee');
  }

  /**
   * Save and wait for the redirect to the new employee's personal details,
   * returning their empNumber.
   */
  async save(): Promise<number> {
    const detailsUrl = /pim\/viewPersonalDetails\/empNumber\/(\d+)$/;
    await this.saveButton.click();
    await this.page.waitForURL(detailsUrl);
    return Number(detailsUrl.exec(this.page.url())![1]);
  }
}
