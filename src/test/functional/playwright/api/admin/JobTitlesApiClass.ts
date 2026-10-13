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
