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

import type {APIRequestContext} from '@playwright/test';

/**
 * Playwright counterpart of the Cypress `db:*` tasks in cypress.config.js,
 * backed by the same functional-testing plugin API
 * (tools/plugins/orangehrmFunctionalTestingPlugin).
 *
 * @param request context whose baseURL is the app's index.php URL with a
 *   trailing slash
 */
export const createDb = (request: APIRequestContext) => {
  const post = async (path: string, data?: Record<string, unknown>) => {
    const response = await request.post(`functional-testing/${path}`, {data});
    if (!response.ok()) {
      throw new Error(
        `POST functional-testing/${path} returned HTTP ${response.status()}: ${await response.text()}`,
      );
    }
    return response.json();
  };

  return {
    /** Reset the DB back to fresh install state (cy.task('db:reset')) */
    reset: () => post('database/reset'),
    /** Truncate the given tables (cy.task('db:truncate', {tables})) */
    truncate: (tables: string[]) => post('truncate-table', {tables}),
    /** Create a savepoint of DB data (cy.task('db:snapshot', {name})) */
    snapshot: (name: string) =>
      post('database/create-savepoint', {savepointName: name}),
    /** Restore the DB to a savepoint (cy.task('db:restore', {name})) */
    restore: (name: string) =>
      post('database/restore-to-savepoint', {savepointName: name}),
    /** Delete the given savepoints, or all when omitted (cy.task('db:clearSnapshots', {names})) */
    clearSnapshots: (names?: string[]) =>
      post('database/delete-savepoints', {savepointNames: names ?? []}),
  };
};

export type Db = ReturnType<typeof createDb>;
