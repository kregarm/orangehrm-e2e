import {BaseApiClass, compact, type ApiResponse} from '../BaseApiClass';

/**
 * Body of POST /api/v2/pim/employees (EmployeeAPI::create). firstName and
 * lastName are required; the rest is left out of the request unless given.
 */
export type EmployeePayload = {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  /** Must be unique among non-purged employees */
  employeeId?: string | null;
};

/** EmployeeModel */
export type Employee = {
  empNumber: number;
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string | null;
  terminationId: number | null;
};

let sequence = 0;

/** Unique, valid values for the required fields */
export const buildEmployee = (): Pick<
  EmployeePayload,
  'firstName' | 'lastName'
> => ({
  firstName: 'Test',
  lastName: `Employee ${Date.now().toString(36)}${(sequence++).toString(36)}`,
});

export class EmployeesApiClass extends BaseApiClass {
  static readonly path = 'api/v2/pim/employees';

  /** Create an employee; missing required fields are generated */
  async create(fields: Partial<EmployeePayload> = {}): Promise<Employee> {
    const {data} = await this.post<ApiResponse<Employee>>(
      EmployeesApiClass.path,
      compact({...buildEmployee(), ...fields}),
    );
    return data;
  }

  async getById(empNumber: number): Promise<Employee> {
    const {data} = await this.get<ApiResponse<Employee>>(
      `${EmployeesApiClass.path}/${empNumber}`,
    );
    return data;
  }

  async deleteByIds(empNumbers: number[]): Promise<number[]> {
    const {data} = await this.delete<ApiResponse<number[]>>(
      EmployeesApiClass.path,
      {ids: empNumbers},
    );
    return data;
  }

  /**
   * Make `supervisorEmpNumber` a supervisor of `empNumber` (PIM > Report-to).
   * A supervisor with a login gains the Supervisor role, e.g. approving the
   * subordinate's leave. Reporting methods: 1 Direct, 2 Indirect.
   */
  async addSupervisor(
    empNumber: number,
    supervisorEmpNumber: number,
    reportingMethodId = 1,
  ): Promise<void> {
    await this.post(`${EmployeesApiClass.path}/${empNumber}/supervisors`, {
      empNumber: supervisorEmpNumber,
      reportingMethodId,
    });
  }

  /**
   * Terminate `empNumber`, making them a past employee. Reasons are seeded
   * by the installer, e.g. 6 Resigned (see /api/v2/pim/termination-reasons).
   */
  async terminate(
    empNumber: number,
    {
      date,
      terminationReasonId = 6,
    }: {date: string; terminationReasonId?: number},
  ): Promise<void> {
    await this.post(`${EmployeesApiClass.path}/${empNumber}/terminations`, {
      terminationReasonId,
      date,
      note: null,
    });
  }
}
