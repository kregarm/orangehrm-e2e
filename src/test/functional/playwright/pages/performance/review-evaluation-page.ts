import {expect, type Locator, type Page} from '@playwright/test';

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
