/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type {LeavePeriod} from '../../api/leave/LeavePeriodsApiClass';

/**
 * Y-m-d of a working day in `period`: the Monday of its `week`th week
 * (1-based) plus `day` days, so day 0-4 is Monday-Friday of the default work
 * week. Dates early in the period are used rather than near today, so they
 * always fall inside it; leave may be applied for past dates.
 */
export const workingDay = (period: LeavePeriod, week: number, day = 0) =>
  mondayOnOrAfter(new Date(`${period.startDate}T00:00:00Z`), week, day);

/**
 * Y-m-d of an upcoming working day: the Monday of the `week`th week after
 * today's (1 = next week) plus `day` days. For leave whose status depends on
 * being in the future, e.g. approved leave is Scheduled, but Taken once past.
 * It may fall into the next leave period.
 */
export const upcomingWorkingDay = (week: number, day = 0) => {
  const today = new Date();
  const date = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1),
  );
  return mondayOnOrAfter(date, week, day);
};

const mondayOnOrAfter = (date: Date, week: number, day: number) => {
  const toMonday = (8 - date.getUTCDay()) % 7;
  date.setUTCDate(date.getUTCDate() + toMonday + (week - 1) * 7 + day);
  return date.toISOString().slice(0, 10);
};
