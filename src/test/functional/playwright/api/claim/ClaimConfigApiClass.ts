import {BaseApiClass, type ApiResponse} from '../BaseApiClass';

/** ClaimEventModel / ExpenseTypeModel */
export type ClaimEvent = {
  id: number;
  name: string;
  description: string | null;
  status: boolean;
};
export type ExpenseType = ClaimEvent;

/**
 * Claim > Configuration: the events employees claim for and the types of
 * their expenses. A fresh install has neither. Needs an Admin session.
 */
export class ClaimConfigApiClass extends BaseApiClass {
  /** An active event, e.g. "Conference" */
  async createEvent(name: string): Promise<ClaimEvent> {
    const {data} = await this.post<ApiResponse<ClaimEvent>>(
      'api/v2/claim/events',
      {name, status: true},
    );
    return data;
  }

  /** An active expense type, e.g. "Travel" */
  async createExpenseType(name: string): Promise<ExpenseType> {
    const {data} = await this.post<ApiResponse<ExpenseType>>(
      'api/v2/claim/expenses/types',
      {name, status: true},
    );
    return data;
  }
}
