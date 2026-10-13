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
import {AddVacancyPage} from '../../../pages/add-vacancy-page';
import {PublicJobsPage} from '../../../pages/public-jobs-page';
import type {JobTitle} from '../../../api/admin/JobTitlesApiClass';

test.describe('Recruitment - Vacancies', () => {
  test.use({loginAs: 'admin'});

  let jobTitle: JobTitle;

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    jobTitle = await api.jobTitles.create({title: 'QA Engineer'});
  });

  test('published vacancy appears on the public job board', async ({
    page,
    guestPage,
    users,
    api,
  }) => {
    const vacancy = {
      name: 'Senior QA Engineer',
      description: 'Own the end-to-end test suite.',
    };

    const addVacancyPage = new AddVacancyPage(page);
    await addVacancyPage.goto();
    await addVacancyPage.name.fill(vacancy.name);
    await addVacancyPage.jobTitle.choose(jobTitle.title);
    await addVacancyPage.description.fill(vacancy.description);
    await addVacancyPage.hiringManager.pick(
      users.admin.firstName,
      users.admin.fullName,
    );
    await addVacancyPage.numOfPositions.fill('2');
    await addVacancyPage.active.set(true);
    await addVacancyPage.published.set(true);
    const id = await addVacancyPage.save();

    const saved = await api.vacancies.getById(id);
    expect(saved).toMatchObject({
      name: vacancy.name,
      status: true,
      isPublished: true,
    });

    const publicJobsPage = new PublicJobsPage(guestPage);
    await publicJobsPage.goto();
    await expect(guestPage).toHaveURL(/recruitmentApply\/jobs\.html/);

    const card = publicJobsPage.card(vacancy.name);
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(vacancy.description);
    await expect(card.getByRole('button', {name: 'Apply'})).toBeVisible();
  });

  test('unpublished vacancy is not on the public job board', async ({
    guestPage,
    api,
  }) => {
    const admin = await api.users.findByUsername('Admin');
    const vacancy = await api.vacancies.create({
      name: 'Internal QA Engineer',
      jobTitleId: jobTitle.id,
      employeeId: admin!.employee.empNumber,
      status: true,
      isPublished: false,
    });

    const publicJobsPage = new PublicJobsPage(guestPage);
    await publicJobsPage.goto();
    await expect(publicJobsPage.card(vacancy.name)).toHaveCount(0);
  });
});
