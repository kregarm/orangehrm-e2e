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
  };
};

export type Db = ReturnType<typeof createDb>;
