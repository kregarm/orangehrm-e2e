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

import {test as base, expect, type Page} from '@playwright/test';
import {createDb, type Db} from './db';
import {ApiSession} from '../api/BaseApiClass';
import {CandidatesApiClass} from '../api/recruitment/CandidatesApiClass';
import {VacanciesApiClass} from '../api/recruitment/VacanciesApiClass';
import {EmployeesApiClass} from '../api/pim/EmployeesApiClass';
import {JobTitlesApiClass} from '../api/admin/JobTitlesApiClass';
import {UsersApiClass} from '../api/admin/UsersApiClass';
import {users, type UserKey} from '../data/users';

/**
 * Specs import {test, expect} from here instead of @playwright/test.
 *
 * - `db`    worker-scoped functional-testing DB helpers, usable in
 *           beforeAll like Cypress' `before(() => cy.task('db:reset'))`
 * - `users` the known test users (data/users)
 * - `api`   worker-scoped REST clients for test setup, logged in as admin.
 *           They share one session, so `api.session.loginAs('john')` (or
 *           `api.candidates.asUser('john', () => ...)`) switches all of them.
 * - `loginAs` option: `test.use({loginAs: 'admin'})` starts every test's
 *           browser already logged in as that user, reusing the API session's
 *           cookies instead of filling in the login form. Defaults to null
 *           (logged out), so the login page itself stays testable.
 * - `guestPage` a page in its own logged-out browser context, for public
 *           pages (e.g. the job board) next to a logged-in `page`.
 */
type Api = {
  session: ApiSession;
  candidates: CandidatesApiClass;
  vacancies: VacanciesApiClass;
  employees: EmployeesApiClass;
  jobTitles: JobTitlesApiClass;
  users: UsersApiClass;
};

export const test = base.extend<
  {loginAs: UserKey | null; guestPage: Page},
  {db: Db; users: typeof users; api: Api}
>({
  loginAs: [null, {option: true}],
  guestPage: async ({browser}, use) => {
    // Config `use` options (baseURL, ...) still apply; only the cookies are dropped.
    const context = await browser.newContext({
      storageState: {cookies: [], origins: []},
    });
    await use(await context.newPage());
    await context.close();
  },
  storageState: async ({loginAs, api, storageState}, use) => {
    await use(loginAs ? await api.session.storageState(loginAs) : storageState);
  },
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
        vacancies: new VacanciesApiClass(session),
        employees: new EmployeesApiClass(session),
        jobTitles: new JobTitlesApiClass(session),
        users: new UsersApiClass(session),
      });
      await session.logout();
    },
    {scope: 'worker'},
  ],
});

export {expect};
