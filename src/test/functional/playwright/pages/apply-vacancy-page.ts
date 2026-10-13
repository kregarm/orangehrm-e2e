/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */

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
    super(page, page.locator('form.oxd-form'));
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
