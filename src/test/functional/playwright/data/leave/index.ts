import type {LeavePeriod} from '../../api/leave/LeavePeriodsApiClass';

/**
 * Y-m-d of a working day in `period`: the Monday of its `week`th week
 * (1-based) plus `day` days, so day 0-4 is Monday-Friday of the default work
 * week. Dates early in the period are used rather than near today, so they
 * always fall inside it; leave may be applied for past dates. For leave that
 * must be in the future, use a day of the next period.
 */
export const workingDay = (period: LeavePeriod, week: number, day = 0) =>
  mondayOnOrAfter(new Date(`${period.startDate}T00:00:00Z`), week, day);

const mondayOnOrAfter = (date: Date, week: number, day: number) => {
  const toMonday = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + toMonday + (week - 1) * 7 + day);
  return date.toISOString().slice(0, 10);
};
