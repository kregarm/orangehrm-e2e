import {expect} from '@playwright/test';
import {TimesheetView} from './timesheet-view';
import {EditTimesheetPage} from './edit-timesheet-page';

/** Time > Timesheets > My Timesheets (time/viewMyTimesheet), this week's */
export class MyTimesheetPage extends TimesheetView {
  goto() {
    return this.page.goto('time/viewMyTimesheet');
  }

  async edit(): Promise<EditTimesheetPage> {
    await this.page.getByRole('button', {name: 'Edit', exact: true}).click();
    await this.page.waitForURL(/time\/editTimesheet\/\d+$/);
    return new EditTimesheetPage(this.page);
  }

  /** Submit the timesheet for approval and wait for its status to change */
  async submit() {
    await this.page.getByRole('button', {name: 'Submit', exact: true}).click();
    await expect(this.status).toHaveText('Status: Submitted');
  }
}
