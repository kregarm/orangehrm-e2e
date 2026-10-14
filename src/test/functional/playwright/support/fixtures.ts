import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import {createDb, type Db} from './db';
import {ApiSession} from '../api/BaseApiClass';
import {CandidatesApiClass} from '../api/recruitment/CandidatesApiClass';
import {VacanciesApiClass} from '../api/recruitment/VacanciesApiClass';
import {EmployeesApiClass} from '../api/pim/EmployeesApiClass';
import {JobTitlesApiClass} from '../api/admin/JobTitlesApiClass';
import {UsersApiClass} from '../api/admin/UsersApiClass';
import {LeavePeriodsApiClass} from '../api/leave/LeavePeriodsApiClass';
import {LeaveTypesApiClass} from '../api/leave/LeaveTypesApiClass';
import {LeaveEntitlementsApiClass} from '../api/leave/LeaveEntitlementsApiClass';
import {LeaveRequestsApiClass} from '../api/leave/LeaveRequestsApiClass';
import {TimesheetPeriodApiClass} from '../api/time/TimesheetPeriodApiClass';
import {CustomersApiClass} from '../api/time/CustomersApiClass';
import {ProjectsApiClass} from '../api/time/ProjectsApiClass';
import {ClaimConfigApiClass} from '../api/claim/ClaimConfigApiClass';
import {KpisApiClass} from '../api/performance/KpisApiClass';
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
 * - `pageAs` opens a page in its own browser context logged in as the given
 *           user, for flows between users (e.g. an employee applies for
 *           leave, their supervisor approves it). The user must exist.
 */
type Api = {
  session: ApiSession;
  candidates: CandidatesApiClass;
  vacancies: VacanciesApiClass;
  employees: EmployeesApiClass;
  jobTitles: JobTitlesApiClass;
  users: UsersApiClass;
  leavePeriods: LeavePeriodsApiClass;
  leaveTypes: LeaveTypesApiClass;
  leaveEntitlements: LeaveEntitlementsApiClass;
  leaveRequests: LeaveRequestsApiClass;
  timesheetPeriod: TimesheetPeriodApiClass;
  customers: CustomersApiClass;
  projects: ProjectsApiClass;
  claimConfig: ClaimConfigApiClass;
  kpis: KpisApiClass;
};

export const test = base.extend<
  {
    loginAs: UserKey | null;
    guestPage: Page;
    pageAs: (user: UserKey) => Promise<Page>;
  },
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
  pageAs: async ({browser, api}, use) => {
    const contexts: BrowserContext[] = [];
    await use(async (user) => {
      const context = await browser.newContext({
        storageState: await api.session.storageState(user),
      });
      contexts.push(context);
      return context.newPage();
    });
    await Promise.all(contexts.map((context) => context.close()));
  },
  // Not done by overriding `storageState`: that is also resolved for hooks,
  // so it would log in before a beforeAll has created (or reset) the user.
  context: async ({context, loginAs, api}, use) => {
    if (loginAs) {
      const {cookies} = await api.session.storageState(loginAs);
      await context.addCookies(cookies);
    }
    await use(context);
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
        leavePeriods: new LeavePeriodsApiClass(session),
        leaveTypes: new LeaveTypesApiClass(session),
        leaveEntitlements: new LeaveEntitlementsApiClass(session),
        leaveRequests: new LeaveRequestsApiClass(session),
        timesheetPeriod: new TimesheetPeriodApiClass(session),
        customers: new CustomersApiClass(session),
        projects: new ProjectsApiClass(session),
        claimConfig: new ClaimConfigApiClass(session),
        kpis: new KpisApiClass(session),
      });
      await session.logout();
    },
    {scope: 'worker'},
  ],
});

export {expect};
