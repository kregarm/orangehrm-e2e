import {type Page} from '@playwright/test';
import {Table} from '../base-ui-elements/table';

/**
 * A list of claims, found by reference id: the base of My Claims and
 * Employee Claims, which open a claim on different pages
 */
export class ClaimsListPage {
  readonly table: Table;

  constructor(
    readonly page: Page,
    private readonly url: string,
  ) {
    this.table = new Table(page);
  }

  goto() {
    return this.page.goto(this.url);
  }

  row(referenceId: string) {
    return this.table.row(referenceId);
  }

  /** Click the claim's View Details; subclasses wait for the page it opens */
  protected viewDetails(referenceId: string) {
    return this.row(referenceId)
      .getByRole('button', {name: 'View Details'})
      .click();
  }
}
