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
}
