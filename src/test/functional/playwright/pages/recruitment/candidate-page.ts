import {type Locator, type Page} from '@playwright/test';
import {CandidateActionForm} from './candidate-action-form';

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
