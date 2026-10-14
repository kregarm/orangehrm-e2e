import {type Locator, type Page} from '@playwright/test';
import {
  CandidateActionForm,
  type CandidateAction,
} from './candidate-action-form';

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

  private action(name: CandidateAction) {
    return this.stage.getByRole('button', {name, exact: true});
  }

  /** Start `name`, which opens its form (recruitment/changeCandidateVacancyStatus) */
  async start(name: CandidateAction): Promise<CandidateActionForm> {
    await this.action(name).click();
    const candidateActionForm = new CandidateActionForm(this.page, name);
    await candidateActionForm.loaded();
    return candidateActionForm;
  }
}
