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
import {test, expect} from '../../../support/fixtures';
import {RecruitmentPage} from '../../../pages/recruitment-page';
import {candidates, fullName} from '../../../data/candidates';

test.describe('Recruitment - Candidates', () => {
  test.beforeAll(async ({db, api}) => {
    await db.reset();
    await api.candidates.create(candidates.jane);
  });

  test.beforeEach(async ({page, users}) => {
    await page.goto('auth/login');
    await page.getByPlaceholder('Username').fill(users.admin.username);
    await page.getByPlaceholder('Password').fill(users.admin.password);
    await page.getByRole('button', {name: 'Login'}).click();
    await page.waitForURL(/dashboard\/index/);
  });

  test('candidate created via the API is listed', async ({page}) => {
    const recruitment = new RecruitmentPage(page);
    await recruitment.goto();

    const row = recruitment.row(fullName(candidates.jane));
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(candidates.jane.dateOfApplication);
  });
});
