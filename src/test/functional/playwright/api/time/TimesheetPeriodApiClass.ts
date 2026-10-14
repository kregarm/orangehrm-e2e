import {BaseApiClass} from '../BaseApiClass';

/**
 * Time > Configuration > Timesheet Period. A fresh install has none: every
 * Time screen and endpoint is forbidden (403) until it is defined. Needs an
 * Admin session.
 */
export class TimesheetPeriodApiClass extends BaseApiClass {
  static readonly path = 'api/v2/time/time-sheet-period';

  /**
   * Define the first day of the timesheet week, 1 (Monday) - 7 (Sunday).
   * Only possible once per database (until db.reset()).
   */
  async define(startDay = 1): Promise<void> {
    await this.put(TimesheetPeriodApiClass.path, {startDay: String(startDay)});
  }
}
