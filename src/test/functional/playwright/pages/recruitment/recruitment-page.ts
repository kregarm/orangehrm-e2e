import {type Page} from '@playwright/test';
import {Table} from '../base-ui-elements/table';
import {CandidatesFilterPanel} from './candidates-filter-panel';

/** Recruitment > Candidates (recruitment/viewCandidates) */
export class RecruitmentPage {
  readonly filters: CandidatesFilterPanel;
  readonly table: Table;

  constructor(readonly page: Page) {
    this.filters = new CandidatesFilterPanel(page);
    this.table = new Table(page);
  }

  /** The candidates-list row whose Candidate column shows `name` */
  row(name: string) {
    return this.table.row(name);
  }

  goto() {
    return this.page.goto('recruitment/viewCandidates');
  }
}
