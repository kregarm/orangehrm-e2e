import {FilterPanel} from '../base-ui-elements/filter-panel';

/** The filters of Recruitment > Candidates */
export class CandidatesFilterPanel extends FilterPanel {
  readonly vacancy = this.select('Vacancy');
  readonly status = this.select('Status');

  readonly searchButton = this.button('Search');

  search() {
    return this.searchButton.click();
  }
}
