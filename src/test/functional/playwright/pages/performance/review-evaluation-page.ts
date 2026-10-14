import {expect, type Locator, type Page} from '@playwright/test';
import {TextField} from '../base-ui-elements/base-ui-elements';

/**
 * Evaluating a review (performance/reviewEvaluate/id/{id} for the employee,
 * reviewEvaluateByAdmin/{id} for the reviewer). Only the user's own
 * evaluation is editable; the other one is collapsed and read-only.
 */
export class ReviewEvaluationPage {
  readonly heading: Locator;
  // The summary and the evaluation are separate forms, each with a loader
  private readonly loaders: Locator;
  // The KPI grids of the editable evaluation
  private readonly grids: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Performance Review',
      exact: true,
    });
    this.loaders = page.locator('.oxd-form-loader');
    this.grids = page
      .locator('.orangehrm-evaluation-grid')
      .filter({visible: true})
      .filter({has: page.locator('input:not([disabled]), textarea')});
  }

  /** Wait for the review to load; the loader shows from the first render */
  async loaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.loaders).toHaveCount(0);
  }

  /**
   * The rating and comment of a KPI, by its title. All KPIs share one grid
   * as a flat run of cells: title, rating, comment.
   */
  kpi(title: string) {
    const titleCell = `.oxd-grid-item:has(p[title=${JSON.stringify(title)}])`;
    const ratingCell = `${titleCell} + .oxd-grid-item`;
    return {
      rating: new TextField(this.grids.locator(ratingCell)),
      comment: new TextField(
        this.grids.locator(`${ratingCell} + .oxd-grid-item`),
      ),
    };
  }

  get generalComment() {
    return new TextField(this.grids.filter({hasText: 'General Comment'}));
  }

  /** Review Finalization, for the reviewer only */
  finalization(
    field: 'Date of Completion' | 'Final Rating' | 'Final Comments',
  ) {
    return new TextField(
      this.page.locator('.oxd-grid-item', {
        has: this.page.getByText(field, {exact: true}),
      }),
    );
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
