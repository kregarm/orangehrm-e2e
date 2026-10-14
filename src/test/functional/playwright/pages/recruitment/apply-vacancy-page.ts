import {type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {type TextField} from '../base-ui-elements/base-ui-elements';

/** A file for a file input, e.g. a resume */
export type Upload = {name: string; mimeType: string; buffer: Buffer};

/**
 * Public application form of a vacancy
 * (recruitmentApply/applyVacancy/id/{id}), no login needed
 */
export class ApplyVacancyPage {
  readonly form: Form;

  // The name inputs share the one "Full Name" label
  readonly firstName: TextField;
  readonly middleName: TextField;
  readonly lastName: TextField;
  readonly email: TextField;
  readonly contactNumber: TextField;
  readonly resume: Locator;
  readonly keywords: TextField;
  readonly notes: TextField;

  readonly submitButton: Locator;
  /** "Application Received" confirmation shown after submitting */
  readonly confirmation: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.firstName = this.form.placeholder('First Name');
    this.middleName = this.form.placeholder('Middle Name');
    this.lastName = this.form.placeholder('Last Name');
    this.email = this.form.text('Email');
    this.contactNumber = this.form.text('Contact Number');
    this.resume = this.form.group('Resume').locator('input[type="file"]');
    this.keywords = this.form.text('Keywords');
    this.notes = this.form.text('Notes');
    this.submitButton = this.form.button('Submit');
    this.confirmation = page.getByRole('dialog');
  }

  goto(vacancyId: number) {
    return this.page.goto(`recruitmentApply/applyVacancy/id/${vacancyId}`);
  }

  /** Submit the form (a full page POST that redirects back with ?success) */
  async submit() {
    await this.submitButton.click();
    await this.page.waitForURL(/[?&]success=true/);
  }
}
