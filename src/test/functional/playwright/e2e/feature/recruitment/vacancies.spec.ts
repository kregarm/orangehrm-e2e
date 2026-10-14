import {test, expect} from '../../../support/fixtures';
import {AddVacancyPage} from '../../../pages/recruitment/add-vacancy-page';
import {PublicJobsPage} from '../../../pages/recruitment/public-jobs-page';
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
  }) => {
    const vacancy = {
      name: 'Senior QA Engineer',
      description: 'Own the end-to-end test suite.',
    };

    // Admin adds an active vacancy, published on the job board
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
    await addVacancyPage.save();

    // A visitor sees it on the job board, with its description and Apply
    const publicJobsPage = new PublicJobsPage(guestPage);
    await publicJobsPage.goto();

    const card = publicJobsPage.card(vacancy.name);
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(vacancy.description);
    await expect(card.getByRole('button', {name: 'Apply'})).toBeVisible();
  });

  test('unpublished vacancy is not on the public job board', async ({
    guestPage,
    api,
  }) => {
    // Two active vacancies, only one of them published
    const admin = await api.users.findByUsername('Admin');
    const vacancy = {
      jobTitleId: jobTitle.id,
      employeeId: admin!.employee.empNumber,
      status: true,
    };
    const published = await api.vacancies.create({
      ...vacancy,
      name: 'Public QA Engineer',
      isPublished: true,
    });
    const unpublished = await api.vacancies.create({
      ...vacancy,
      name: 'Internal QA Engineer',
      isPublished: false,
    });

    // A visitor sees only the published one; checking it first makes sure
    // the cards have rendered
    const publicJobsPage = new PublicJobsPage(guestPage);
    await publicJobsPage.goto();
    await expect(publicJobsPage.card(published.name)).toHaveCount(1);
    await expect(publicJobsPage.card(unpublished.name)).toHaveCount(0);
  });
});
