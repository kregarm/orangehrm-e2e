import {test} from '../../../support/fixtures';
import {RecruitmentPage} from '../../../pages/recruitment-page';
import {candidates} from '../../../data/candidates';

test.describe('Recruitment - Inspect', () => {
  // Interactive only: page.pause() needs a visible browser, so CI (headless) skips it.
  test.skip(({headless}) => headless, 'run with --headed or --debug');

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    // Seed one candidate so the candidates list isn't empty.
    await api.candidates.create(candidates.jane);
  });

  test('pause on the candidates page', async ({page, users}) => {
    test.setTimeout(0);

    await page.goto('auth/login');
    await page.getByPlaceholder('Username').fill(users.admin.username);
    await page.getByPlaceholder('Password').fill(users.admin.password);
    await page.getByRole('button', {name: 'Login'}).click();
    await page.waitForURL(/dashboard\/index/);

    const recruitment = new RecruitmentPage(page);
    await recruitment.goto();
    await recruitment.filters.root.waitFor();

    // Opens the Playwright Inspector; press Resume (or close the browser) when done.
    await page.pause();
  });
});
