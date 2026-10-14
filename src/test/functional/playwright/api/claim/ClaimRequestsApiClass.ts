import {BaseApiClass, type ApiResponse} from '../BaseApiClass';

/** Body of POST /api/v2/claim/requests (MyClaimRequestAPI::create) */
export type ClaimRequestPayload = {
  claimEventId: number;
  /** ISO 4217 code, e.g. "EUR" */
  currencyId: string;
  remarks?: string | null;
};

/** Body of POST /api/v2/claim/requests/{id}/expenses (ClaimExpenseAPI::create) */
export type ClaimExpensePayload = {
  expenseTypeId: number;
  /** Y-m-d */
  date: string;
  /** e.g. "250.50" */
  amount: string;
  note?: string | null;
};

/** MyClaimRequestModel as returned by create */
export type ClaimRequest = {
  id: number;
  referenceId: string;
  /** INITIATED, SUBMITTED, PAID, ... */
  status: string;
};

/**
 * Claim > Submit Claim: everything here acts as the current user, so wrap
 * calls in `asUser`, e.g.
 *
 *   api.claimRequests.asUser('john', () => api.claimRequests.create(...))
 */
export class ClaimRequestsApiClass extends BaseApiClass {
  static readonly path = 'api/v2/claim/requests';

  /** A new claim, status Initiated */
  async create(payload: ClaimRequestPayload): Promise<ClaimRequest> {
    const {data} = await this.post<ApiResponse<ClaimRequest>>(
      ClaimRequestsApiClass.path,
      payload,
    );
    return data;
  }

  async addExpense(requestId: number, payload: ClaimExpensePayload) {
    await this.post(
      `${ClaimRequestsApiClass.path}/${requestId}/expenses`,
      payload,
    );
  }

  /** Submit an Initiated claim for approval */
  async submit(requestId: number) {
    await this.put(`${ClaimRequestsApiClass.path}/${requestId}/action`, {
      action: 'SUBMIT',
    });
  }
}
