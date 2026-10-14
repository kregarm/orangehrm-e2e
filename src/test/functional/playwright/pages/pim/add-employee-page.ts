import {type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  SwitchField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';

/** PIM > Add Employee (pim/addEmployee) */
export class AddEmployeePage {
  readonly form: Form;

  // The name inputs share the one "Employee Full Name" label
  readonly firstName: TextField;
  readonly middleName: TextField;
  readonly lastName: TextField;
  readonly employeeId: TextField;
  readonly createLoginDetails: SwitchField;

  // Shown once createLoginDetails is on
  readonly username: TextField;
  readonly password: TextField;
  readonly confirmPassword: TextField;

  readonly saveButton: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.firstName = this.form.placeholder('First Name');
    this.middleName = this.form.placeholder('Middle Name');
    this.lastName = this.form.placeholder('Last Name');
    this.employeeId = this.form.text('Employee Id');
    this.createLoginDetails = new SwitchField(
      this.form.root.locator('.user-form-header', {
        hasText: 'Create Login Details',
      }),
    );
    this.username = this.form.text('Username');
    this.password = this.form.text('Password');
    this.confirmPassword = this.form.text('Confirm Password');
    this.saveButton = this.form.button('Save');
  }

  /** Enabled or Disabled login */
  status(status: 'Enabled' | 'Disabled') {
    return this.form.root.getByText(status, {exact: true}).click();
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
