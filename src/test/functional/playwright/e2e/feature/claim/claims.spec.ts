import {test, expect} from '../../../support/fixtures';
import {ClaimsListPage, SubmitClaimPage} from '../../../pages/claim-pages';

test.describe('Claim - Claims', () => {
  test.use({loginAs: 'john'});

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    await api.claimConfig.createEvent('Conference');
    await api.claimConfig.createExpenseType('Travel');
    await api.claimConfig.createExpenseType('Accommodation');
    await api.users.ensure(users.john);
  });

  test('employee submits a claim and the admin approves it', async ({
    page,
    pageAs,
    users,
  }) => {
    const submitClaimPage = new SubmitClaimPage(page);
    await submitClaimPage.goto();
    await submitClaimPage.event.choose('Conference');
    await submitClaimPage.currency.choose('Euro');
    await submitClaimPage.remarks.fill('PHP conference in Berlin');
    const claimPage = await submitClaimPage.create();
    await expect(claimPage.status.input).toHaveValue('Initiated');
    const referenceId = await claimPage.referenceId.input.inputValue();

    await claimPage.addExpense({
      type: 'Travel',
      date: '2026-10-05',
      amount: '250.50',
      note: 'Train tickets',
    });
    await claimPage.addExpense({
      type: 'Accommodation',
      date: '2026-10-06',
      amount: '180.00',
    });
    await expect(claimPage.expenses.rows).toHaveCount(2);
    await expect(claimPage.total).toHaveText('Total Amount (Euro) : 430.50');
    await claimPage.submit();

    const employeeClaimsPage = new ClaimsListPage(
      await pageAs('admin'),
      'claim/viewAssignClaim',
    );
    await employeeClaimsPage.goto();
    await expect(employeeClaimsPage.row(referenceId)).toContainText(
      users.john.fullName,
    );
    const reviewClaimPage = await employeeClaimsPage.view(referenceId);
    await expect(reviewClaimPage.status.input).toHaveValue('Submitted');
    await expect(reviewClaimPage.total).toHaveText(
      'Total Amount (Euro) : 430.50',
    );
    await reviewClaimPage.act('Approve');
    await expect(reviewClaimPage.status.input).toHaveValue('Paid');

    const myClaimsPage = new ClaimsListPage(page, 'claim/viewClaim');
    await myClaimsPage.goto();
    const row = myClaimsPage.row(referenceId);
    await expect(row).toContainText('Paid');
    await expect(row).toContainText('430.50');
  });
});
