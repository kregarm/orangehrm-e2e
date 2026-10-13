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
 * Body of POST /api/v2/recruitment/vacancies (VacancyAPI::create). The
 * job title must be active and the hiring manager a current employee.
 */
export type VacancyPayload = {
  /** Unique, at most 100 characters */
  name: string;
  jobTitleId: number;
  /** empNumber of the hiring manager */
  employeeId: number;
  /** true = active; only active vacancies are listed publicly */
  status: boolean;
  /** true = shown on the public job board and RSS feed */
  isPublished: boolean;
  description?: string | null;
  numOfPositions?: number | null;
};

/** VacancyDetailedModel */
export type Vacancy = {
  id: number;
  name: string;
  description: string | null;
  numOfPositions: number | null;
  status: boolean;
  isPublished: boolean;
  jobTitle: {id: number; title: string; isDeleted: boolean};
  hiringManager: {
    id: number;
    firstName: string;
    middleName: string;
    lastName: string;
    terminationId: number | null;
  };
};

export class VacanciesApiClass extends BaseApiClass {
  static readonly path = 'api/v2/recruitment/vacancies';

  async create(payload: VacancyPayload): Promise<Vacancy> {
    const {data} = await this.post<ApiResponse<Vacancy>>(
      VacanciesApiClass.path,
      compact(payload),
    );
    return data;
  }

  async getById(id: number): Promise<Vacancy> {
    const {data} = await this.get<ApiResponse<Vacancy>>(
      `${VacanciesApiClass.path}/${id}`,
    );
    return data;
  }

  async deleteByIds(ids: number[]): Promise<number[]> {
    const {data} = await this.delete<ApiResponse<number[]>>(
      VacanciesApiClass.path,
      {ids},
    );
    return data;
  }
}
