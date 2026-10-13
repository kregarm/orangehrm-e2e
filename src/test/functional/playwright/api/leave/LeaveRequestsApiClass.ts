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

/** Body of POST /api/v2/leave/leave-requests (MyLeaveRequestAPI::create) */
export type LeaveRequestPayload = {
  leaveTypeId: number;
  /** Y-m-d; past dates are allowed */
  fromDate: string;
  /** Y-m-d; defaults to fromDate */
  toDate?: string;
  comment?: string | null;
};

/** LeaveRequestModel as returned by create */
export type LeaveRequest = {
  id: number;
  leaveType: {id: number; name: string};
  dateApplied: string;
};

/** LeaveBalance of /api/v2/leave/leave-balance/leave-type/{id}, in days */
export type LeaveBalance = {
  entitled: number;
  used: number;
  scheduled: number;
  pending: number;
  taken: number;
  /** entitled - used, where used counts pending, scheduled and taken */
  balance: number;
};

/**
 * Leave > Apply and My Leave: everything here acts as the current user, so
 * wrap calls in `asUser`, e.g.
 *
 *   api.leaveRequests.asUser('john', () => api.leaveRequests.apply(...))
 */
export class LeaveRequestsApiClass extends BaseApiClass {
  static readonly path = 'api/v2/leave/leave-requests';

  async apply({
    toDate,
    ...payload
  }: LeaveRequestPayload): Promise<LeaveRequest> {
    const {data} = await this.post<ApiResponse<LeaveRequest>>(
      LeaveRequestsApiClass.path,
      {...payload, toDate: toDate ?? payload.fromDate},
    );
    return data;
  }

  /** The current user's balance of `leaveTypeId` as of today */
  async balance(leaveTypeId: number): Promise<LeaveBalance> {
    const {data} = await this.get<ApiResponse<{balance: LeaveBalance}>>(
      `api/v2/leave/leave-balance/leave-type/${leaveTypeId}`,
    );
    return data.balance;
  }
}
