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
    const myReviewListPage = new ReviewListPage(
      await pageAs('john'),
      'performance/myPerformanceReview',
    );
    await myReviewListPage.goto();
    await expect(myReviewListPage.row(periodText(review))).toContainText(
      'Activated',
    );
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
    const myReviewListPage = new ReviewListPage(
      await pageAs('john'),
      'performance/myPerformanceReview',
    );
    await myReviewListPage.goto();
    const reviewEvaluationPage = await myReviewListPage.open(
      myReviewListPage.row(periodText(review)),
    );
    await reviewEvaluationPage.kpi(testCoverage).rating.fill('4');
    await reviewEvaluationPage
      .kpi(testCoverage)
      .comment.fill('Wrote the e2e suite');
    await reviewEvaluationPage.kpi(defectsFound).rating.fill('3');
    await reviewEvaluationPage.generalComment.fill('A productive period');
    await reviewEvaluationPage.complete();

    // Mike finds it In Progress, waiting for his evaluation
    const employeeReviewListPage = new ReviewListPage(
      await pageAs('mike'),
      'performance/searchEvaluatePerformanceReview',
    );
    await employeeReviewListPage.goto();
    await expect(
      employeeReviewListPage.row(users.john.fullName, periodText(review)),
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
    const employeeReviewListPage = new ReviewListPage(
      await pageAs('mike'),
      'performance/searchEvaluatePerformanceReview',
    );
    await employeeReviewListPage.goto();
    const johnsReview = employeeReviewListPage.row(
      users.john.fullName,
      periodText(review),
    );
    await expect(johnsReview).toContainText('In Progress');
    const reviewEvaluationPage = await employeeReviewListPage.open(johnsReview);
    await reviewEvaluationPage.kpi(testCoverage).rating.fill('5');
    await reviewEvaluationPage.kpi(defectsFound).rating.fill('4');
    await reviewEvaluationPage.generalComment.fill(
      'Raised the bar for quality',
    );
    await reviewEvaluationPage
      .finalization('Date of Completion')
      .fill(`${year}-07-15`);
    await reviewEvaluationPage.finalization('Final Rating').fill('4.5');
    await reviewEvaluationPage
      .finalization('Final Comments')
      .fill('Exceeds expectations');
    await reviewEvaluationPage.complete();

    // Both Mike and John see it as Completed
    await employeeReviewListPage.goto();
    await expect(johnsReview).toContainText('Completed');
    const myReviewListPage = new ReviewListPage(
      await pageAs('john'),
      'performance/myPerformanceReview',
    );
    await myReviewListPage.goto();
    await expect(myReviewListPage.row(periodText(review))).toContainText(
      'Completed',
    );
  });
});
