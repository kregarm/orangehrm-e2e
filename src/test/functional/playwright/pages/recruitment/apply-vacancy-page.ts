import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {type TextField} from '../base-ui-elements/base-ui-elements';

/**
 * Public application form of a vacancy
 * (recruitmentApply/applyVacancy/id/{id}), no login needed
 */
export class ApplyVacancyPage {
  readonly form: Form;

  // The name inputs share the one "Full Name" label
  readonly firstName: TextField;
  readonly lastName: TextField;
  readonly email: TextField;
  readonly resume: Locator;

  readonly submitButton: Locator;
  /** "Application Received" confirmation shown after submitting */
  readonly confirmation: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.firstName = this.form.placeholder('First Name');
    this.lastName = this.form.placeholder('Last Name');
    this.email = this.form.text('Email');
    this.resume = this.form.group('Resume').locator('input[type="file"]');
    this.submitButton = this.form.button('Submit');
    this.confirmation = page.getByRole('dialog');
  }

  goto(vacancyId: number) {
    return this.page.goto(`recruitmentApply/applyVacancy/id/${vacancyId}`);
  }

  /** Submit the form; the page reloads with the confirmation dialog */
  async submit() {
    await this.submitButton.click();
    await expect(this.confirmation).toBeVisible();
  }
}
