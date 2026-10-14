import {expect} from '@playwright/test';
import {TimesheetView} from './timesheet-view';
import {EditTimesheetPage} from './edit-timesheet-page';

/** Time > Timesheets > My Timesheets (time/viewMyTimesheet) */
export class MyTimesheetPage extends TimesheetView {
  /** This week's timesheet, or the week starting `startDate` (Y-m-d) */
  goto(startDate?: string) {
    const query = startDate ? `?${new URLSearchParams({startDate})}` : '';
    return this.page.goto(`time/viewMyTimesheet${query}`);
  }

  async edit(): Promise<EditTimesheetPage> {
    await this.page.getByRole('button', {name: 'Edit', exact: true}).click();
    const editTimesheetPage = new EditTimesheetPage(this.page);
    await expect(editTimesheetPage.heading).toBeVisible();
    return editTimesheetPage;
  }

  /** Submit the timesheet for approval and wait for its status to change */
  async submit() {
    await this.page.getByRole('button', {name: 'Submit', exact: true}).click();
    await expect(this.status).toHaveText('Status: Submitted');
  }
}
