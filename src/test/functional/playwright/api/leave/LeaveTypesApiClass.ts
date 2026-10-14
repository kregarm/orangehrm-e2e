import {BaseApiClass, type ApiResponse} from '../BaseApiClass';

/** Body of POST /api/v2/leave/leave-types (LeaveTypeAPI::create) */
export type LeaveTypePayload = {
  /** Unique, at most 50 characters */
  name: string;
  /** true = only usable when explicitly entitled (e.g. maternity) */
  situational?: boolean;
};

/** LeaveTypeModel */
export type LeaveType = {
  id: number;
  name: string;
  deleted: boolean;
  situational: boolean;
};

/** Leave > Configure > Leave Types. Needs an Admin session. */
export class LeaveTypesApiClass extends BaseApiClass {
  static readonly path = 'api/v2/leave/leave-types';

  async create({
    name,
    situational = false,
  }: LeaveTypePayload): Promise<LeaveType> {
    const {data} = await this.post<ApiResponse<LeaveType>>(
      LeaveTypesApiClass.path,
      {name, situational},
    );
    return data;
  }
}
