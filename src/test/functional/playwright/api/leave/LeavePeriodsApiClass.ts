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

import {BaseApiClass, type ApiResponse} from '../BaseApiClass';

/** Y-m-d bounds of a leave period */
export type LeavePeriod = {startDate: string; endDate: string};

type LeavePeriodMeta = {
  leavePeriodDefined: boolean;
  currentLeavePeriod: LeavePeriod | null;
};

/**
 * Leave > Configure > Leave Period. A fresh install has none, and the Leave
 * module only works once it is defined. Needs an Admin session.
 */
export class LeavePeriodsApiClass extends BaseApiClass {
  static readonly path = 'api/v2/leave/leave-period';

  /**
   * Define the leave period (there is no create: the PUT defines it on first
   * use) and return the generated periods: the current one first, e.g.
   * 2026-01-01 - 2026-12-31, then the next one.
   */
  async define({startMonth = 1, startDay = 1} = {}): Promise<LeavePeriod[]> {
    await this.put(LeavePeriodsApiClass.path, {startMonth, startDay});
    const {data, meta} = await this.get<
      ApiResponse<LeavePeriod[], LeavePeriodMeta>
    >('api/v2/leave/leave-periods');
    const current = meta.currentLeavePeriod!;
    return [
      current,
      ...data.filter(({startDate}) => startDate > current.startDate),
    ];
  }
}
