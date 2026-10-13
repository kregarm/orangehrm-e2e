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

import {BaseApiClass, type ApiResponse} from '../BaseApiClass';
import {EmployeesApiClass} from '../pim/EmployeesApiClass';
import type {User} from '../../data/users';

/** Body of POST /api/v2/admin/users (UserAPI::create); all fields required */
export type SystemUserPayload = {
  /** 5-40 characters, unique */
  username: string;
  /** Must satisfy the password strength rules */
  password: string;
  /** Assignable roles only: 1 Admin, 2 ESS (see User.roleId) */
  userRoleId: number;
  /** The employee this login belongs to */
  empNumber: number;
  /** true = enabled */
  status: boolean;
};

/** UserModel */
export type SystemUser = {
  id: number;
  userName: string;
  deleted: boolean;
  status: boolean;
  employee: {
    empNumber: number;
    employeeId: string | null;
    firstName: string;
    middleName: string;
    lastName: string;
    terminationId: number | null;
  };
  userRole: {id: number; name: string; displayName: string};
};

export type SystemUserFilters = {
  username?: string;
  userRoleId?: number;
  empNumber?: number;
  status?: boolean;
};

/**
 * System users (logins) under Admin > User Management. Needs an Admin
 * session.
 */
export class UsersApiClass extends BaseApiClass {
  static readonly path = 'api/v2/admin/users';

  async create(payload: SystemUserPayload): Promise<SystemUser> {
    const {data} = await this.post<ApiResponse<SystemUser>>(
      UsersApiClass.path,
      payload,
    );
    return data;
  }

  async list(filters: SystemUserFilters = {}): Promise<SystemUser[]> {
    const {data} = await this.get<ApiResponse<SystemUser[]>>(
      UsersApiClass.path,
      {limit: 0, ...filters},
    );
    return data;
  }

  async findByUsername(username: string): Promise<SystemUser | undefined> {
    const matches = await this.list({username});
    return matches.find((user) => user.userName === username);
  }

  async deleteByIds(ids: number[]): Promise<number[]> {
    const {data} = await this.delete<ApiResponse<number[]>>(
      UsersApiClass.path,
      {ids},
    );
    return data;
  }

  /**
   * Make sure `user` can log in: create its employee (from fullName) and
   * an enabled login with its role, unless the login already exists.
   */
  async ensure(user: User): Promise<SystemUser> {
    const existing = await this.findByUsername(user.username);
    if (existing) return existing;

    const employees = new EmployeesApiClass(this.session);
    const employee = await employees.create({
      firstName: user.firstName,
      lastName: user.lastName,
    });
    try {
      return await this.create({
        username: user.username,
        password: user.password,
        userRoleId: user.roleId,
        empNumber: employee.empNumber,
        status: true,
      });
    } catch (error) {
      // Don't leave an employee without the login it was created for.
      await employees.deleteByIds([employee.empNumber]);
      throw error;
    }
  }
}
