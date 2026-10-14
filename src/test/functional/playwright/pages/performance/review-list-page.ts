import {type Locator, type Page} from '@playwright/test';
import {Table} from '../base-ui-elements/table';
import {ReviewEvaluationPage} from './review-evaluation-page';

/**
 * A list of reviews: Manage Reviews (admin), My Reviews (the employee) or
 * Employee Reviews (the reviewer). Each row has a Status column; My Reviews
 * also has the Self Evaluation Status.
 */
export class ReviewListPage {
  readonly table: Table;

  constructor(
    readonly page: Page,
    private readonly url:
      | 'performance/searchPerformanceReview'
      | 'performance/myPerformanceReview'
      | 'performance/searchEvaluatePerformanceReview',
  ) {
    this.table = new Table(page);
  }

  goto() {
    return this.page.goto(this.url);
  }

  /** The row with these cells, e.g. the period "2026-01-01 - 2026-06-30" */
  row(...cells: string[]) {
    return this.table.row(...cells);
  }

  /** Open a review: its one action, Evaluate (or View once completed) */
  async open(row: Locator): Promise<ReviewEvaluationPage> {
    const actions = await this.table.cell(row, 'Actions');
    await actions.getByRole('button').click();
    const reviewEvaluationPage = new ReviewEvaluationPage(this.page);
    await reviewEvaluationPage.loaded();
    return reviewEvaluationPage;
  }
}
