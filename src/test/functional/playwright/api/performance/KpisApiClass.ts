import {BaseApiClass, type ApiResponse} from '../BaseApiClass';

/** Body of POST /api/v2/performance/kpis (KpiAPI::create) */
export type KpiPayload = {
  title: string;
  /** Reviews of employees with this job title are rated on the KPI */
  jobTitleId: number;
  minRating?: number;
  maxRating?: number;
  /** true = also used for job titles added later */
  isDefault?: boolean;
};

/** KpiModel */
export type Kpi = {
  id: number;
  title: string;
  minRating: number;
  maxRating: number;
  jobTitle: {id: number; name: string};
};

/**
 * Performance > Configure > KPIs. A review can only be created for an
 * employee whose job title has KPIs. Needs an Admin session.
 */
export class KpisApiClass extends BaseApiClass {
  static readonly path = 'api/v2/performance/kpis';

  async create({
    minRating = 1,
    maxRating = 5,
    isDefault = false,
    ...payload
  }: KpiPayload): Promise<Kpi> {
    const {data} = await this.post<ApiResponse<Kpi>>(KpisApiClass.path, {
      ...payload,
      minRating,
      maxRating,
      isDefault,
    });
    return data;
  }
}
