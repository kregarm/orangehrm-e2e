import './support/hosts';
import {request, type FullConfig} from '@playwright/test';
import {createDb} from './support/db';

/**
 * Clear savepoints left over from earlier runs, like Cypress' `before:run`.
 */
export default async (config: FullConfig) => {
  const context = await request.newContext({
    baseURL: config.projects[0].use.baseURL,
  });
  try {
    await createDb(context).clearSnapshots();
  } finally {
    await context.dispose();
  }
};
