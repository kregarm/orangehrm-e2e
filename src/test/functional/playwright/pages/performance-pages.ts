import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from './base-ui-elements/form';
import {Table} from './base-ui-elements/table';
import {toast} from './base-ui-elements/toast';

/** Performance > Manage Reviews > Add (performance/saveReview) */
export class AddReviewPage extends Form {
  readonly employee = this.autocomplete('Employee Name');
  /** Must be one of the employee's supervisors */
  readonly reviewer = this.autocomplete('Supervisor Reviewer');
  readonly startDate = this.text('Review Period Start Date');
  readonly endDate = this.text('Review Period End Date');
  readonly dueDate = this.text('Due Date');

  goto() {
    return this.page.goto('performance/saveReview');
  }

  /** Create the review activated (rather than saved as inactive) */
  async activate() {
    await this.button('Activate').click();
    await expect(
      toast(this.page, 'success', 'Successfully Activated'),
    ).toBeVisible();
  }
}

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

  /** Open a review to evaluate it (its first action) */
  async open(row: Locator): Promise<ReviewEvaluationPage> {
    await row.getByRole('button').first().click();
    await this.page.waitForURL(/performance\/reviewEvaluate(ByAdmin)?\//);
    return new ReviewEvaluationPage(this.page);
  }
}

/**
 * Evaluating a review (performance/reviewEvaluate/id/{id} for the employee,
 * reviewEvaluateByAdmin/{id} for the reviewer). Only the user's own
 * evaluation is editable; the other one is collapsed and read-only.
 */
export class ReviewEvaluationPage {
  // The KPI grids of the editable evaluation
  private readonly grids: Locator;

  constructor(readonly page: Page) {
    this.grids = page
      .locator('.orangehrm-evaluation-grid')
      .filter({visible: true})
      .filter({has: page.locator('input:not([disabled]), textarea')});
  }

  /**
   * The rating and comment of a KPI, by its title. All KPIs share one grid
   * as a flat run of cells: title, rating, comment.
   */
  kpi(title: string) {
    const titleCell = `.oxd-grid-item:has(p[title=${JSON.stringify(title)}])`;
    return {
      rating: this.grids.locator(`${titleCell} + .oxd-grid-item input`),
      comment: this.grids.locator(
        `${titleCell} + .oxd-grid-item + .oxd-grid-item textarea`,
      ),
    };
  }

  get generalComment() {
    return this.grids.filter({hasText: 'General Comment'}).locator('textarea');
  }

  /** Review Finalization, for the reviewer only */
  finalization(
    field: 'Date of Completion' | 'Final Rating' | 'Final Comments',
  ) {
    return this.page
      .locator('.oxd-grid-item', {
        has: this.page.getByText(field, {exact: true}),
      })
      .locator('input, textarea');
  }

  /**
   * Complete the evaluation, confirming in the dialog. The page then reloads
   * read-only, without the Complete button.
   */
  async complete() {
    const completeButton = this.page.getByRole('button', {
      name: 'Complete',
      exact: true,
    });
    await completeButton.click();
    await this.page
      .getByRole('dialog')
      .getByRole('button', {name: 'Ok', exact: true})
      .click();
    await expect(completeButton).toBeHidden();
  }
}
