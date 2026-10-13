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

/** The actions the Application Stage offers, depending on the status */
export type CandidateAction =
  | 'Shortlist'
  | 'Reject'
  | 'Schedule Interview'
  | 'Mark Interview Passed'
  | 'Mark Interview Failed'
  | 'Offer Job'
  | 'Offer Declined'
  | 'Hire';

/**
 * Recruitment > Candidates > a candidate (recruitment/addCandidate/{id}).
 * Its Application Stage card shows the status and the next actions.
 */
export class CandidatePage {
  readonly stage: Locator;
  /** e.g. "Status: Shortlisted" */
  readonly status: Locator;

  constructor(
    readonly page: Page,
    readonly candidateId: number,
  ) {
    this.stage = page.locator('.orangehrm-card-container', {
      has: page.getByRole('heading', {name: 'Application Stage'}),
    });
    this.status = this.stage.locator('.orangehrm-recruitment-status');
  }

  goto() {
    return this.page.goto(`recruitment/addCandidate/${this.candidateId}`);
  }

  action(name: CandidateAction) {
    return this.stage.getByRole('button', {name, exact: true});
  }

  /** Start `name`, which opens its form (recruitment/changeCandidateVacancyStatus) */
  async start(name: CandidateAction): Promise<CandidateActionForm> {
    await this.action(name).click();
    await this.page.waitForURL(/recruitment\/changeCandidateVacancyStatus/);
    return new CandidateActionForm(this.page);
  }
}

/** The form confirming a candidate action, with notes */
export class CandidateActionForm extends Form {
  readonly notes = this.text('Notes');

  // Schedule Interview only
  readonly interviewTitle = this.text('Interview Title');
  readonly interviewer = this.autocomplete('Interviewer');
  readonly date = this.text('Date');
  readonly time = this.text('Time');

  readonly saveButton = this.button('Save');

  constructor(page: Page) {
    super(page, page.locator('form.oxd-form'));
  }

  /** Save and wait for the redirect back to the candidate */
  async save() {
    await this.saveButton.click();
    await this.page.waitForURL(/recruitment\/addCandidate\/\d+$/);
  }
}
