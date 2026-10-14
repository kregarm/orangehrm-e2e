import {test, expect} from '../../../support/fixtures';
import {ApplyVacancyPage} from '../../../pages/recruitment/apply-vacancy-page';
import {RecruitmentPage} from '../../../pages/recruitment/recruitment-page';
import type {Vacancy} from '../../../api/recruitment/VacanciesApiClass';

test.describe('Recruitment - Public applications', () => {
  test.use({loginAs: 'admin'});

  let vacancy: Vacancy;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    const jobTitle = await api.jobTitles.create({title: 'Support Engineer'});
    vacancy = await api.vacancies.create({
      name: 'Support Engineer - Remote',
      jobTitleId: jobTitle.id,
      employeeId: await api.users.empNumberOf(users.admin),
      status: true,
      isPublished: true,
    });
  });

  test('applicant applies with a resume and becomes a candidate', async ({
    page,
    guestPage,
  }) => {
    const applicant = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada.lovelace@example.com',
    };

    // Ada applies on the public form, with her resume
    const applyVacancyPage = new ApplyVacancyPage(guestPage);
    await applyVacancyPage.goto(vacancy.id);
    await applyVacancyPage.firstName.fill(applicant.firstName);
    await applyVacancyPage.lastName.fill(applicant.lastName);
    await applyVacancyPage.email.fill(applicant.email);
    await applyVacancyPage.resume.setInputFiles({
      name: 'ada-lovelace-cv.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Ada Lovelace\nAnalytical engines'),
    });

    // She gets a confirmation
    await applyVacancyPage.submit();
    await expect(applyVacancyPage.confirmation).toContainText(
      'Application Received',
    );

    // Admin sees her as a candidate for the vacancy, Application Initiated
    const recruitmentPage = new RecruitmentPage(page);
    await recruitmentPage.goto();
    const row = recruitmentPage.row(
      `${applicant.firstName} ${applicant.lastName}`,
    );
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(vacancy.name);
    await expect(row).toContainText('Application Initiated');
  });
});
