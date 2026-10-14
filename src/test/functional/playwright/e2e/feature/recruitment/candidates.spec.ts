import {test, expect} from '../../../support/fixtures';
import {RecruitmentPage} from '../../../pages/recruitment/recruitment-page';
import {fullName} from '../../../data/candidates';
import type {Candidate} from '../../../api/recruitment/CandidatesApiClass';
import type {Vacancy} from '../../../api/recruitment/VacanciesApiClass';

test.describe('Recruitment - Candidates', () => {
  test.use({loginAs: 'admin'});

  let backendVacancy: Vacancy;
  // Applied to Backend Engineer and shortlisted
  let shortlistedBackendApplicant: Candidate;
  // Applied to Backend Engineer, not yet reviewed
  let newBackendApplicant: Candidate;
  // Applied to Frontend Engineer
  let frontendApplicant: Candidate;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();

    // Two vacancies with applicants: two for Backend, one for Frontend
    const jobTitle = await api.jobTitles.create({title: 'Software Engineer'});
    const adminEmpNumber = await api.users.empNumberOf(users.admin);
    const createVacancy = (name: string) =>
      api.vacancies.create({
        name,
        jobTitleId: jobTitle.id,
        employeeId: adminEmpNumber,
        status: true,
        isPublished: true,
      });
    backendVacancy = await createVacancy('Backend Engineer');
    const frontendVacancy = await createVacancy('Frontend Engineer');

    shortlistedBackendApplicant = await api.candidates.create({
      vacancyId: backendVacancy.id,
    });
    await api.candidates.shortlist(shortlistedBackendApplicant.id);
    newBackendApplicant = await api.candidates.create({
      vacancyId: backendVacancy.id,
    });
    frontendApplicant = await api.candidates.create({
      vacancyId: frontendVacancy.id,
    });
  });

  test('candidates can be filtered by vacancy and status', async ({page}) => {
    // Unfiltered: all three applicants
    const recruitmentPage = new RecruitmentPage(page);
    await recruitmentPage.goto();
    await expect(recruitmentPage.table.rows).toHaveCount(3);

    // Filtering by Backend Engineer leaves its two applicants
    await recruitmentPage.filters.vacancy.choose(backendVacancy.name);
    await recruitmentPage.filters.search();
    await expect(recruitmentPage.table.rows).toHaveCount(2);
    await expect(
      recruitmentPage.row(fullName(shortlistedBackendApplicant)),
    ).toBeVisible();
    await expect(
      recruitmentPage.row(fullName(newBackendApplicant)),
    ).toBeVisible();
    await expect(recruitmentPage.row(fullName(frontendApplicant))).toHaveCount(
      0,
    );

    // Also filtering by Shortlisted leaves just the shortlisted one
    await recruitmentPage.filters.status.choose('Shortlisted');
    await recruitmentPage.filters.search();
    await expect(recruitmentPage.table.rows).toHaveCount(1);
    await expect(
      recruitmentPage.row(fullName(shortlistedBackendApplicant)),
    ).toContainText('Shortlisted');
  });
});
