import {test, expect} from '../../../support/fixtures';
import {AddReviewPage} from '../../../pages/performance/add-review-page';
import {ReviewListPage} from '../../../pages/performance/review-list-page';

// John (QA Engineer, rated on its KPIs) is reviewed by his supervisor Mike.
// Each test uses its own review period.
test.describe('Performance - Reviews', () => {
  test.use({loginAs: 'admin'});

  // The review lists default to the current year, so review in it
  const year = new Date().getFullYear();
  const period = (from: string, to: string) => ({
    startDate: `${year}-${from}`,
    endDate: `${year}-${to}`,
    dueDate: `${year}-12-31`,
  });
  const periodText = ({
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }) => `${startDate} - ${endDate}`;

  // The QA Engineer job title's KPIs
  const testCoverage = 'Test coverage';
  const defectsFound = 'Defects found before release';

  let johnEmpNumber: number;
  let mikeEmpNumber: number;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    const jobTitle = await api.jobTitles.create({title: 'QA Engineer'});
    for (const title of [testCoverage, defectsFound]) {
      await api.kpis.create({title, jobTitleId: jobTitle.id});
    }

    const john = await api.users.ensure(users.john);
    const mike = await api.users.ensure(users.mike);
    johnEmpNumber = john.employee.empNumber;
    mikeEmpNumber = mike.employee.empNumber;
    await api.employees.setJobTitle(johnEmpNumber, jobTitle.id);
    await api.employees.addSupervisor(johnEmpNumber, mikeEmpNumber);
  });

  test('admin activates a review', async ({page, pageAs, users}) => {
    const review = period('01-01', '02-28');

    // Admin activates a review of John, with Mike as reviewer
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
    await addReviewPage.startDate.fill(review.startDate);
    await addReviewPage.endDate.fill(review.endDate);
    await addReviewPage.dueDate.fill(review.dueDate);
    await addReviewPage.activate();

    // John finds it Activated in My Reviews
    const myReviews = new ReviewListPage(
      await pageAs('john'),
      'performance/myPerformanceReview',
    );
    await myReviews.goto();
    await expect(myReviews.row(periodText(review))).toContainText('Activated');
  });

  test('employee completes their self evaluation', async ({
    pageAs,
    api,
    users,
  }) => {
    // John has an activated review
    const review = period('03-01', '04-30');
    await api.performanceReviews.create({
      ...review,
      empNumber: johnEmpNumber,
      reviewerEmpNumber: mikeEmpNumber,
    });

    // John rates himself and completes his self evaluation
    const myReviews = new ReviewListPage(
      await pageAs('john'),
      'performance/myPerformanceReview',
    );
    await myReviews.goto();
    const selfEvaluation = await myReviews.open(
      myReviews.row(periodText(review)),
    );
    await selfEvaluation.kpi(testCoverage).rating.fill('4');
    await selfEvaluation.kpi(testCoverage).comment.fill('Wrote the e2e suite');
    await selfEvaluation.kpi(defectsFound).rating.fill('3');
    await selfEvaluation.generalComment.fill('A productive period');
    await selfEvaluation.complete();

    // Mike finds it In Progress, waiting for his evaluation
    const employeeReviews = new ReviewListPage(
      await pageAs('mike'),
      'performance/searchEvaluatePerformanceReview',
    );
    await employeeReviews.goto();
    await expect(
      employeeReviews.row(users.john.fullName, periodText(review)),
    ).toContainText('In Progress');
  });

  test('supervisor completes the review', async ({pageAs, api, users}) => {
    // John has completed his self evaluation of an activated review
    const review = period('05-01', '06-30');
    const {performanceReviews} = api;
    const {id} = await performanceReviews.create({
      ...review,
      empNumber: johnEmpNumber,
      reviewerEmpNumber: mikeEmpNumber,
    });
    await performanceReviews.asUser('john', () =>
      performanceReviews.completeSelfEvaluation(id),
    );

    // Mike rates John, adds the final rating and completes the review
    const employeeReviews = new ReviewListPage(
      await pageAs('mike'),
      'performance/searchEvaluatePerformanceReview',
    );
    await employeeReviews.goto();
    const johnsReview = employeeReviews.row(
      users.john.fullName,
      periodText(review),
    );
    await expect(johnsReview).toContainText('In Progress');
    const evaluation = await employeeReviews.open(johnsReview);
    await evaluation.kpi(testCoverage).rating.fill('5');
    await evaluation.kpi(defectsFound).rating.fill('4');
    await evaluation.generalComment.fill('Raised the bar for quality');
    await evaluation.finalization('Date of Completion').fill(`${year}-07-15`);
    await evaluation.finalization('Final Rating').fill('4.5');
    await evaluation
      .finalization('Final Comments')
      .fill('Exceeds expectations');
    await evaluation.complete();

    // Both Mike and John see it as Completed
    await employeeReviews.goto();
    await expect(johnsReview).toContainText('Completed');
    const myReviews = new ReviewListPage(
      await pageAs('john'),
      'performance/myPerformanceReview',
    );
    await myReviews.goto();
    await expect(myReviews.row(periodText(review))).toContainText('Completed');
  });
});
