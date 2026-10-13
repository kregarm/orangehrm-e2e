import {type Locator, type Page} from '@playwright/test';
import {TextField} from './base-ui-elements/base-ui-elements';
import {FilterPanel} from './base-ui-elements/filter-panel';

export class CandidatesFilterPanel extends FilterPanel {
  readonly jobTitle = this.select('Job Title');
  readonly vacancy = this.select('Vacancy');
  readonly hiringManager = this.select('Hiring Manager');
  readonly status = this.select('Status');
  readonly candidateName = this.autocomplete('Candidate Name');
  readonly keywords = this.text('Keywords');
  // "To" has a blank (&nbsp;) label, so both date inputs are located by placeholder
  readonly fromDate = this.date('From');
  readonly toDate = this.date('To');
  readonly methodOfApplication = this.select('Method of Application');

  readonly resetButton = this.button('Reset');
  readonly searchButton = this.button('Search');

  private date(placeholder: string) {
    return new TextField(
      this.root.locator('.oxd-date-input', {
        has: this.page.getByPlaceholder(placeholder, {exact: true}),
      }),
    );
  }

  search() {
    return this.searchButton.click();
  }

  reset() {
    return this.resetButton.click();
  }
}

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
