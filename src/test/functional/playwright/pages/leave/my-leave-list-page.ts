import {type Page} from '@playwright/test';
import {LeaveListPage} from './leave-list-page';

/** Leave > My Leave (leave/viewMyLeaveList): the user's own requests */
export class MyLeaveListPage extends LeaveListPage {
  constructor(page: Page) {
    super(page, 'leave/viewMyLeaveList');
  }
}
