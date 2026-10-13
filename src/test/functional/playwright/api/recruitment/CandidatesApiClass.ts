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

import {BaseApiClass, compact, type ApiResponse} from '../BaseApiClass';

/**
 * Body of POST /api/v2/recruitment/candidates (CandidateAPI::create).
 * firstName, lastName and email are required by the API; the rest is
 * optional and left out of the request unless given.
 */
export type CandidatePayload = {
  firstName: string;
  lastName: string;
  email: string;
  middleName?: string | null;
  contactNumber?: string | null;
  vacancyId?: number | null;
  keywords?: string | null;
  comment?: string | null;
  /** Y-m-d; the server defaults to today */
  dateOfApplication?: string | null;
  consentToKeepData?: boolean;
};

/** CandidateModel */
export type Candidate = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
};

let sequence = 0;

/** Unique, valid values for the required fields */
export const buildCandidate = (): Pick<
  CandidatePayload,
  'firstName' | 'lastName' | 'email'
> => {
  const id = `${Date.now().toString(36)}${(sequence++).toString(36)}`;
  return {
    firstName: 'Test',
    lastName: `Candidate ${id}`,
    email: `candidate.${id}@example.com`,
  };
};

export class CandidatesApiClass extends BaseApiClass {
  static readonly path = 'api/v2/recruitment/candidates';

  /**
   * Create a candidate. Any field not given is either generated (required
   * ones) or omitted (optional ones), e.g.
   *
   *   create()                                       // all generated
   *   create({firstName: 'Jane', email: 'j@x.com'})  // lastName generated
   *   create({...all, vacancyId: 1, comment: 'hi'})  // full payload
   */
  async create(fields: Partial<CandidatePayload> = {}): Promise<Candidate> {
    const {data} = await this.post<ApiResponse<Candidate>>(
      CandidatesApiClass.path,
      compact({...buildCandidate(), ...fields}),
    );
    return data;
  }

  async getById(id: number): Promise<Candidate> {
    const {data} = await this.get<ApiResponse<Candidate>>(
      `${CandidatesApiClass.path}/${id}`,
    );
    return data;
  }

  async deleteByIds(ids: number[]): Promise<number[]> {
    const {data} = await this.delete<ApiResponse<number[]>>(
      CandidatesApiClass.path,
      {ids},
    );
    return data;
  }
}
