import {type Locator, type Page} from '@playwright/test';
import {CandidatesFilterPanel} from './candidates-filter-panel';

/** Recruitment > Candidates (recruitment/viewCandidates) */
export class RecruitmentPage {
  readonly filters: CandidatesFilterPanel;

  readonly rows: Locator;

  constructor(readonly page: Page) {
    this.filters = new CandidatesFilterPanel(page);
    this.rows = page.locator('.oxd-table-body .oxd-table-card');
  }

  /** The candidates-list row whose Candidate column shows `name` */
  row(name: string) {
    return this.rows.filter({
      has: this.page.getByRole('cell', {name, exact: true}),
    });
  }

  goto() {
    return this.page.goto('recruitment/viewCandidates');
  }
}
