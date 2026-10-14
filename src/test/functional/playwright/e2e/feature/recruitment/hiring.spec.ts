import {test, expect} from '../../../support/fixtures';
import {CandidatePage} from '../../../pages/recruitment/candidate-page';
import {EmployeeListPage} from '../../../pages/pim/employee-list-page';
import type {JobTitle} from '../../../api/admin/JobTitlesApiClass';
import type {Vacancy} from '../../../api/recruitment/VacanciesApiClass';

test.describe('Recruitment - Hiring', () => {
  test.use({loginAs: 'admin'});

  let jobTitle: JobTitle;
  let vacancy: Vacancy;
  // The admin is the vacancy's hiring manager and the interviewer
  let adminEmpNumber: number;

  const interview = {
    interviewName: 'Technical interview',
    interviewDate: '2026-11-02',
  };

  test.beforeAll(async ({db, api}) => {
    await db.reset();
    jobTitle = await api.jobTitles.create({title: 'Data Analyst'});
    const admin = await api.users.findByUsername('Admin');
    adminEmpNumber = admin!.employee.empNumber;
    vacancy = await api.vacancies.create({
      name: 'Data Analyst - Ljubljana',
      jobTitleId: jobTitle.id,
      employeeId: adminEmpNumber,
      status: true,
      isPublished: true,
    });
  });

  test('candidate moves through the pipeline to a job offer', async ({
    page,
    api,
  }) => {
    // A new applicant for the vacancy, with a generated name
    const candidate = await api.candidates.create({vacancyId: vacancy.id});
    const candidatePage = new CandidatePage(page, candidate.id);
    await candidatePage.goto();
    await expect(candidatePage.status).toHaveText(
      'Status: Application Initiated',
    );

    // Admin shortlists them
    await (await candidatePage.start('Shortlist')).save();
    await expect(candidatePage.status).toHaveText('Status: Shortlisted');

    // They have an interview (scheduling has its own test)
    await api.candidates.scheduleInterview(candidate.id, {
      ...interview,
      interviewerEmpNumbers: [adminEmpNumber],
    });
    await candidatePage.goto();
    await expect(candidatePage.status).toHaveText(
      'Status: Interview Scheduled',
    );

    // Admin marks the interview passed and offers the job
    await (await candidatePage.start('Mark Interview Passed')).save();
    await expect(candidatePage.status).toHaveText('Status: Interview Passed');
    await (await candidatePage.start('Offer Job')).save();
    await expect(candidatePage.status).toHaveText('Status: Job Offered');
  });

  test('admin schedules an interview', async ({page, api, users}) => {
    // A shortlisted applicant
    const candidate = await api.candidates.create({vacancyId: vacancy.id});
    await api.candidates.shortlist(candidate.id);

    // Admin schedules an interview with themselves as interviewer
    const candidatePage = new CandidatePage(page, candidate.id);
    await candidatePage.goto();
    const interviewForm = await candidatePage.start('Schedule Interview');
    await interviewForm.interviewTitle.fill(interview.interviewName);
    await interviewForm.interviewer.pick(
      users.admin.firstName,
      users.admin.fullName,
    );
    await interviewForm.date.fill(interview.interviewDate);
    await interviewForm.save();
    await expect(candidatePage.status).toHaveText(
      'Status: Interview Scheduled',
    );
  });

  test('hired candidate becomes an employee', async ({page, api}) => {
    // An applicant who passed the interview and was offered the job
    const candidate = await api.candidates.create({vacancyId: vacancy.id});
    await api.candidates.shortlist(candidate.id);
    const {id: interviewId} = await api.candidates.scheduleInterview(
      candidate.id,
      {
        ...interview,
        interviewerEmpNumbers: [adminEmpNumber],
      },
    );
    await api.candidates.passInterview(candidate.id, interviewId);
    await api.candidates.offerJob(candidate.id);

    // Admin hires them, which ends the pipeline
    const candidatePage = new CandidatePage(page, candidate.id);
    await candidatePage.goto();
    await expect(candidatePage.status).toHaveText('Status: Job Offered');
    await (await candidatePage.start('Hire')).save();
    await expect(candidatePage.status).toHaveText('Status: Hired');
    await expect(candidatePage.stage.getByRole('button')).toHaveCount(0);

    // They are now an employee with the vacancy's job title
    const employeeListPage = new EmployeeListPage(page);
    await employeeListPage.goto();
    await expect(
      employeeListPage.row(candidate.firstName, candidate.lastName),
    ).toContainText(jobTitle.title);
  });

  test('rejected candidate has no further actions', async ({page, api}) => {
    // A shortlisted applicant
    const candidate = await api.candidates.create({vacancyId: vacancy.id});
    await api.candidates.shortlist(candidate.id);

    const candidatePage = new CandidatePage(page, candidate.id);
    await candidatePage.goto();
    await expect(candidatePage.status).toHaveText('Status: Shortlisted');

    // Admin rejects them, which ends the pipeline
    const reject = await candidatePage.start('Reject');
    await reject.notes.fill('Not enough experience with SQL');
    await reject.save();
    await expect(candidatePage.status).toHaveText('Status: Rejected');
    await expect(candidatePage.stage.getByRole('button')).toHaveCount(0);
  });
});
