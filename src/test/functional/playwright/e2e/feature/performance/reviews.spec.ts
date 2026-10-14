import {test, expect} from '../../../support/fixtures';
import {AddReviewPage, ReviewListPage} from '../../../pages/performance-pages';

/**
 * The admin activates a review of John (QA Engineer, rated on the job
 * title's KPIs), John evaluates himself, then his supervisor Mike completes
 * the review with a final rating.
 */
test.describe('Performance - Reviews', () => {
  test.use({loginAs: 'admin'});

  const kpis = ['Test coverage', 'Defects found before release'];
  // The review lists default to the current year, so review in it
  const year = new Date().getFullYear();
  const period = {startDate: `${year}-01-01`, endDate: `${year}-06-30`};
  const periodText = `${period.startDate} - ${period.endDate}`;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    const jobTitle = await api.jobTitles.create({title: 'QA Engineer'});
    for (const title of kpis) {
      await api.kpis.create({title, jobTitleId: jobTitle.id});
    }

    const john = await api.users.ensure(users.john);
    const mike = await api.users.ensure(users.mike);
    await api.employees.setJobTitle(john.employee.empNumber, jobTitle.id);
    await api.employees.addSupervisor(
      john.employee.empNumber,
      mike.employee.empNumber,
    );
  });

  test('review goes from activation through self evaluation to completion', async ({
    page,
    pageAs,
    users,
  }) => {
    const addReviewPage = new AddReviewPage(page);
    await addReviewPage.goto();
    await addReviewPage.employee.pick(
      users.john.firstName,
      users.john.fullName,
    );
    await addReviewPage.reviewer.pick(
      users.mike.firstName,
      users.mike.fullName,
    );
    await addReviewPage.startDate.fill(period.startDate);
    await addReviewPage.endDate.fill(period.endDate);
    await addReviewPage.dueDate.fill(`${year}-12-31`);
    await addReviewPage.activate();

    const myReviews = new ReviewListPage(
      await pageAs('john'),
      'performance/myPerformanceReview',
    );
    await myReviews.goto();
    const myReview = myReviews.row(periodText);
    await expect(myReview).toContainText('Activated');
    const selfEvaluation = await myReviews.open(myReview);
    await selfEvaluation.kpi(kpis[0]).rating.fill('4');
    await selfEvaluation.kpi(kpis[0]).comment.fill('Wrote the e2e suite');
    await selfEvaluation.kpi(kpis[1]).rating.fill('3');
    await selfEvaluation.generalComment.fill('A productive half year');
    await selfEvaluation.complete();

    const employeeReviews = new ReviewListPage(
      await pageAs('mike'),
      'performance/searchEvaluatePerformanceReview',
    );
    await employeeReviews.goto();
    const johnsReview = employeeReviews.row(users.john.fullName, periodText);
    await expect(johnsReview).toContainText('In Progress');
    const evaluation = await employeeReviews.open(johnsReview);
    await evaluation.kpi(kpis[0]).rating.fill('5');
    await evaluation.kpi(kpis[1]).rating.fill('4');
    await evaluation.generalComment.fill('Raised the bar for quality');
    await evaluation.finalization('Date of Completion').fill(`${year}-07-15`);
    await evaluation.finalization('Final Rating').fill('4.5');
    await evaluation
      .finalization('Final Comments')
      .fill('Exceeds expectations');
    await evaluation.complete();

    await employeeReviews.goto();
    await expect(johnsReview).toContainText('Completed');
    await myReviews.goto();
    await expect(myReview).toContainText('Completed');
  });
});
