import {BaseApiClass, compact, type ApiResponse} from '../BaseApiClass';

/**
 * Body of POST /api/v2/time/customers (CustomerAPI::create). Leave out an
 * empty description rather than sending null, which fails with HTTP 500.
 */
export type CustomerPayload = {
  /** Unique, at most 50 characters */
  name: string;
  description?: string;
};

/** CustomerModel */
export type Customer = {
  id: number;
  name: string;
  description: string;
  deleted: boolean;
};

/** Time > Project Info > Customers. Needs an Admin session. */
export class CustomersApiClass extends BaseApiClass {
  static readonly path = 'api/v2/time/customers';

  async create(payload: CustomerPayload): Promise<Customer> {
    const {data} = await this.post<ApiResponse<Customer>>(
      CustomersApiClass.path,
      compact(payload),
    );
    return data;
  }
}
