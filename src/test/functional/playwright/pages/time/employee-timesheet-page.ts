import {expect} from '@playwright/test';
import {TimesheetView} from './timesheet-view';

/** An employee's timesheet, as their supervisor sees it */
export class EmployeeTimesheetPage extends TimesheetView {
  /**
   * Approve or Reject, optionally with a comment, and wait for the status
   * to change
   */
  async act(action: 'Approve' | 'Reject', comment?: string) {
    if (comment) {
      await this.page.getByPlaceholder('Type here ...').fill(comment);
    }
    await this.page.getByRole('button', {name: action, exact: true}).click();
    const status = {Approve: 'Approved', Reject: 'Rejected'}[action];
    await expect(this.status).toHaveText(`Status: ${status}`);
  }
}
