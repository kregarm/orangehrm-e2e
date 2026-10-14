import {BaseApiClass, type ApiResponse} from '../BaseApiClass';

/** TimesheetModel */
export type Timesheet = {
  id: number;
  /** Y-m-d, the first day of the timesheet week */
  startDate: string;
  endDate: string;
  status: {id: string; name: string};
};

/** The project activity a timesheet row logs time against */
export type TimesheetActivity = {projectId: number; activityId: number};

/**
 * Time > My Timesheets: everything here acts as the current user, so wrap
 * calls in `asUser`, e.g.
 *
 *   api.timesheets.asUser('john', () => api.timesheets.create('2026-10-05'))
 */
export class TimesheetsApiClass extends BaseApiClass {
  static readonly path = 'api/v2/time/timesheets';

  /** The current user's timesheet for the week of `date` (Y-m-d) */
  async create(date: string): Promise<Timesheet> {
    const {data} = await this.post<ApiResponse<Timesheet>>(
      TimesheetsApiClass.path,
      {date},
    );
    return data;
  }

  /**
   * Log `hoursPerDay` against `activity` on the first five days of the week,
   * Monday to Friday for the default timesheet period
   */
  async logWorkWeek(
    timesheet: Timesheet,
    {projectId, activityId}: TimesheetActivity,
    hoursPerDay = 8,
  ) {
    const start = new Date(`${timesheet.startDate}T00:00:00Z`);
    const dates = Array.from({length: 5}, (_, day) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + day);
      return date.toISOString().slice(0, 10);
    });
    const duration = `${String(hoursPerDay).padStart(2, '0')}:00`;
    await this.put(`${TimesheetsApiClass.path}/${timesheet.id}/entries`, {
      entries: [
        {
          projectId,
          activityId,
          dates: Object.fromEntries(dates.map((date) => [date, {duration}])),
        },
      ],
      deletedEntries: [],
    });
  }

  /** Submit a timesheet for the supervisor's approval */
  async submit(timesheetId: number) {
    await this.put(`${TimesheetsApiClass.path}/${timesheetId}`, {
      action: 'SUBMIT',
    });
  }
}
