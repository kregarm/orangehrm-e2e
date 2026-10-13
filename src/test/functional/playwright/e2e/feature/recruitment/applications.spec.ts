import {test, expect} from '../../../support/fixtures';
import {ApplyVacancyPage} from '../../../pages/apply-vacancy-page';
import {RecruitmentPage} from '../../../pages/recruitment-page';
import type {Vacancy} from '../../../api/recruitment/VacanciesApiClass';

test.describe('Recruitment - Public applications', () => {
  test.use({loginAs: 'admin'});

  let vacancy: Vacancy;

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    const jobTitle = await api.jobTitles.create({title: 'Support Engineer'});
    const admin = await api.users.findByUsername('Admin');
    vacancy = await api.vacancies.create({
      name: 'Support Engineer - Remote',
      jobTitleId: jobTitle.id,
      employeeId: admin!.employee.empNumber,
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
    await applyVacancyPage.submit();
    await expect(applyVacancyPage.confirmation).toContainText(
      'Application Received',
    );

    const recruitment = new RecruitmentPage(page);
    await recruitment.goto();
    const row = recruitment.row(`${applicant.firstName} ${applicant.lastName}`);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(vacancy.name);
    await expect(row).toContainText('Application Initiated');
  });
});
