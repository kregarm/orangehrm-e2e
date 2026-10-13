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
