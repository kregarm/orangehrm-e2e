import {type Locator, type Page} from '@playwright/test';
import {Form} from './base-ui-elements/form';

/** A file for a file input, e.g. a resume */
export type Upload = {name: string; mimeType: string; buffer: Buffer};

/**
 * Public application form of a vacancy
 * (recruitmentApply/applyVacancy/id/{id}), no login needed
 */
export class ApplyVacancyPage extends Form {
  // The name inputs share the one "Full Name" label
  readonly firstName = this.placeholder('First Name');
  readonly middleName = this.placeholder('Middle Name');
  readonly lastName = this.placeholder('Last Name');
  readonly email = this.text('Email');
  readonly contactNumber = this.text('Contact Number');
  readonly resume: Locator;
  readonly keywords = this.text('Keywords');
  readonly notes = this.text('Notes');

  readonly submitButton = this.button('Submit');
  /** "Application Received" confirmation shown after submitting */
  readonly confirmation: Locator;

  constructor(page: Page) {
    super(page);
    this.resume = this.group('Resume').locator('input[type="file"]');
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
