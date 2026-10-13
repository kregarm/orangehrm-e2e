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

import {test as base, expect} from '@playwright/test';
import {createDb, type Db} from './db';
import {ApiSession} from '../api/BaseApiClass';
import {CandidatesApiClass} from '../api/recruitment/CandidatesApiClass';
import {EmployeesApiClass} from '../api/pim/EmployeesApiClass';
import {UsersApiClass} from '../api/admin/UsersApiClass';
import {users} from '../data/users';

/**
 * Specs import {test, expect} from here instead of @playwright/test.
 *
 * - `db`    worker-scoped functional-testing DB helpers, usable in
 *           beforeAll like Cypress' `before(() => cy.task('db:reset'))`
 * - `users` the known test users (data/users)
 * - `api`   worker-scoped REST clients for test setup, logged in as admin.
 *           They share one session, so `api.session.loginAs('john')` (or
 *           `api.candidates.asUser('john', () => ...)`) switches all of them.
 */
type Api = {
  session: ApiSession;
  candidates: CandidatesApiClass;
  employees: EmployeesApiClass;
  users: UsersApiClass;
};

export const test = base.extend<
  object,
  {db: Db; users: typeof users; api: Api}
>({
  users: [users, {scope: 'worker'}],
  db: [
    async ({playwright}, use, workerInfo) => {
      const request = await playwright.request.newContext({
        baseURL: workerInfo.project.use.baseURL,
      });
      await use(createDb(request));
      await request.dispose();
    },
    {scope: 'worker'},
  ],
  api: [
    async ({playwright}, use, workerInfo) => {
      const session = new ApiSession(
        playwright.request,
        workerInfo.project.use.baseURL!,
      );
      await session.loginAs('admin');
      await use({
        session,
        candidates: new CandidatesApiClass(session),
        employees: new EmployeesApiClass(session),
        users: new UsersApiClass(session),
      });
      await session.logout();
    },
    {scope: 'worker'},
  ],
});

export {expect};
