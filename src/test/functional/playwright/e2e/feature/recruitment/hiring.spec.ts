import {test, expect} from '../../../support/fixtures';
import {CandidatePage} from '../../../pages/recruitment/candidate-page';
import {EmployeeListPage} from '../../../pages/pim/employee-list-page';
import type {JobTitle} from '../../../api/admin/JobTitlesApiClass';
import type {Vacancy} from '../../../api/recruitment/VacanciesApiClass';

test.describe('Recruitment - Hiring', () => {
  test.use({loginAs: 'admin'});

  let jobTitle: JobTitle;
  let vacancy: Vacancy;

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    jobTitle = await api.jobTitles.create({title: 'Data Analyst'});
    const admin = await api.users.findByUsername('Admin');
    vacancy = await api.vacancies.create({
      name: 'Data Analyst - Ljubljana',
      jobTitleId: jobTitle.id,
      employeeId: admin!.employee.empNumber,
      status: true,
      isPublished: true,
    });
  });

  test('candidate goes through the pipeline and is hired as an employee', async ({
    page,
    api,
    users,
  }) => {
    const candidate = await api.candidates.create({vacancyId: vacancy.id});
    const candidatePage = new CandidatePage(page, candidate.id);
    await candidatePage.goto();
    await expect(candidatePage.status).toHaveText(
      'Status: Application Initiated',
    );

    await (await candidatePage.start('Shortlist')).save();
    await expect(candidatePage.status).toHaveText('Status: Shortlisted');

    const interview = await candidatePage.start('Schedule Interview');
    await interview.interviewTitle.fill('Technical interview');
    await interview.interviewer.pick(
      users.admin.firstName,
      users.admin.fullName,
    );
    await interview.date.fill('2026-11-02');
    await interview.save();
    await expect(candidatePage.status).toHaveText(
      'Status: Interview Scheduled',
    );

    await (await candidatePage.start('Mark Interview Passed')).save();
    await expect(candidatePage.status).toHaveText('Status: Interview Passed');

    await (await candidatePage.start('Offer Job')).save();
    await expect(candidatePage.status).toHaveText('Status: Job Offered');

    await (await candidatePage.start('Hire')).save();
    await expect(candidatePage.status).toHaveText('Status: Hired');
    await expect(candidatePage.stage.getByRole('button')).toHaveCount(0);

    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();
    await expect(
      employeeListPage.row(candidate.firstName, candidate.lastName),
    ).toContainText(jobTitle.title);
  });

  test('rejected candidate has no further actions', async ({page, api}) => {
    const candidate = await api.candidates.create({vacancyId: vacancy.id});
    await api.candidates.shortlist(candidate.id);

    const candidatePage = new CandidatePage(page, candidate.id);
    await candidatePage.goto();
    await expect(candidatePage.status).toHaveText('Status: Shortlisted');

    const reject = await candidatePage.start('Reject');
    await reject.notes.fill('Not enough experience with SQL');
    await reject.save();
    await expect(candidatePage.status).toHaveText('Status: Rejected');
    await expect(candidatePage.stage.getByRole('button')).toHaveCount(0);
  });
});
