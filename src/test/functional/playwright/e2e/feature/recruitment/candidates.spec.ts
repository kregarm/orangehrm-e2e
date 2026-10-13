import {test, expect} from '../../../support/fixtures';
import {RecruitmentPage} from '../../../pages/recruitment-page';
import {candidates, fullName} from '../../../data/candidates';

test.describe('Recruitment - Candidates', () => {
  test.use({loginAs: 'admin'});

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    await api.candidates.create(candidates.jane);
  });

  test('candidate created via the API is listed', async ({page}) => {
    const recruitment = new RecruitmentPage(page);
    await recruitment.goto();

    const row = recruitment.row(fullName(candidates.jane));
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(candidates.jane.dateOfApplication);
  });
});
