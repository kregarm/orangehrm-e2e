import {BaseApiClass, compact, type ApiResponse} from '../BaseApiClass';

/** Body of POST /api/v2/time/projects (ProjectAPI::create) */
export type ProjectPayload = {
  customerId: number;
  /** Unique per customer, at most 100 characters */
  name: string;
  description?: string;
  /** At most 5 */
  projectAdminsEmpNumbers?: number[];
};

/** ProjectModel */
export type Project = {
  id: number;
  name: string;
  customer: {id: number; name: string};
};

/** ProjectActivityModel */
export type ProjectActivity = {id: number; name: string};

/**
 * Time > Project Info > Projects. Timesheet rows show a project as
 * "Customer - Project". Needs an Admin session.
 */
export class ProjectsApiClass extends BaseApiClass {
  static readonly path = 'api/v2/time/projects';

  async create(payload: ProjectPayload): Promise<Project> {
    const {data} = await this.post<ApiResponse<Project>>(
      ProjectsApiClass.path,
      compact(payload),
    );
    return data;
  }

  /** Add an activity employees can log time against, e.g. "Development" */
  async addActivity(projectId: number, name: string): Promise<ProjectActivity> {
    const {data} = await this.post<ApiResponse<ProjectActivity>>(
      `api/v2/time/project/${projectId}/activities`,
      {name},
    );
    return data;
  }
}
