import {test, expect} from '../../../support/fixtures';
import {RecruitmentPage} from '../../../pages/recruitment-page';
import {candidates, fullName} from '../../../data/candidates';
import type {Candidate} from '../../../api/recruitment/CandidatesApiClass';
import type {Vacancy} from '../../../api/recruitment/VacanciesApiClass';

test.describe('Recruitment - Candidates', () => {
  test.use({loginAs: 'admin'});

  let backend: Vacancy;
  let shortlisted: Candidate;
  let applied: Candidate;
  let frontendApplicant: Candidate;

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    await api.candidates.create(candidates.jane);

    const jobTitle = await api.jobTitles.create({title: 'Software Engineer'});
    const admin = await api.users.findByUsername('Admin');
    const vacancy = (name: string) =>
      api.vacancies.create({
        name,
        jobTitleId: jobTitle.id,
        employeeId: admin!.employee.empNumber,
        status: true,
        isPublished: true,
      });
    backend = await vacancy('Backend Engineer');
    const frontend = await vacancy('Frontend Engineer');

    shortlisted = await api.candidates.create({vacancyId: backend.id});
    await api.candidates.shortlist(shortlisted.id);
    applied = await api.candidates.create({vacancyId: backend.id});
    frontendApplicant = await api.candidates.create({vacancyId: frontend.id});
  });

  test('candidate created via the API is listed', async ({page}) => {
    const recruitment = new RecruitmentPage(page);
    await recruitment.goto();

    const row = recruitment.row(fullName(candidates.jane));
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(candidates.jane.dateOfApplication);
  });

  test('candidates can be filtered by vacancy and status', async ({page}) => {
    const recruitment = new RecruitmentPage(page);
    await recruitment.goto();
    await expect(recruitment.rows).toHaveCount(4);

    await recruitment.filters.vacancy.choose(backend.name);
    await recruitment.filters.search();
    await expect(recruitment.rows).toHaveCount(2);
    await expect(recruitment.row(fullName(shortlisted))).toHaveCount(1);
    await expect(recruitment.row(fullName(applied))).toHaveCount(1);
    await expect(recruitment.row(fullName(frontendApplicant))).toHaveCount(0);

    await recruitment.filters.status.choose('Shortlisted');
    await recruitment.filters.search();
    await expect(recruitment.rows).toHaveCount(1);
    await expect(recruitment.row(fullName(shortlisted))).toContainText(
      'Shortlisted',
    );
  });
});
