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

/** Body of POST /api/v2/leave/leave-entitlements for a single employee */
export type LeaveEntitlementPayload = {
  empNumber: number;
  leaveTypeId: number;
  /** Y-m-d, before toDate; normally a leave period's bounds */
  fromDate: string;
  toDate: string;
  /** Days */
  entitlement: number;
};

/** LeaveEntitlementModel */
export type LeaveEntitlement = {
  id: number;
  entitlement: number;
  daysUsed: number;
  fromDate: string;
  toDate: string;
  leaveType: {id: number; name: string};
};

/** Leave > Entitlements > Add Entitlements. Needs an Admin session. */
export class LeaveEntitlementsApiClass extends BaseApiClass {
  static readonly path = 'api/v2/leave/leave-entitlements';

  /** Adds to an existing entitlement of the same type and dates, if any */
  async add(payload: LeaveEntitlementPayload): Promise<LeaveEntitlement> {
    const {data} = await this.post<ApiResponse<LeaveEntitlement>>(
      LeaveEntitlementsApiClass.path,
      payload,
    );
    return data;
  }
}
