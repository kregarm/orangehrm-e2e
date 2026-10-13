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

/** Body of POST /api/v2/admin/job-titles (JobTitleAPI::create) */
export type JobTitlePayload = {
  /** Unique among non-deleted job titles */
  title: string;
  description?: string | null;
  note?: string | null;
};

/** JobTitleModel */
export type JobTitle = {
  id: number;
  title: string;
  description: string | null;
  note: string | null;
};

/** Job titles under Admin > Job. Needs an Admin session. */
export class JobTitlesApiClass extends BaseApiClass {
  static readonly path = 'api/v2/admin/job-titles';

  async create(payload: JobTitlePayload): Promise<JobTitle> {
    const {data} = await this.post<ApiResponse<JobTitle>>(
      JobTitlesApiClass.path,
      compact(payload),
    );
    return data;
  }

  async deleteByIds(ids: number[]): Promise<number[]> {
    const {data} = await this.delete<ApiResponse<number[]>>(
      JobTitlesApiClass.path,
      {ids},
    );
    return data;
  }
}
