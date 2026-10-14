import {test, expect} from '../../../support/fixtures';
import {ClaimsListPage} from '../../../pages/claim/claims-list-page';
import {SubmitClaimPage} from '../../../pages/claim/submit-claim-page';
import type {
  ClaimEvent,
  ExpenseType,
} from '../../../api/claim/ClaimConfigApiClass';

test.describe('Claim - Claims', () => {
  test.use({loginAs: 'john'});

  let conference: ClaimEvent;
  let travel: ExpenseType;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    conference = await api.claimConfig.createEvent('Conference');
    travel = await api.claimConfig.createExpenseType('Travel');
    await api.claimConfig.createExpenseType('Accommodation');
    await api.users.ensure(users.john);
  });

  test('employee submits a claim', async ({page}) => {
    // Employee creates a claim, which starts out Initiated
    const submitClaimPage = new SubmitClaimPage(page);
    await submitClaimPage.goto();
    await submitClaimPage.event.choose(conference.name);
    await submitClaimPage.currency.choose('Euro');
    await submitClaimPage.remarks.fill('PHP conference in Berlin');
    const claimPage = await submitClaimPage.create();
    await expect(claimPage.status.input).toHaveValue('Initiated');
    const referenceId = await claimPage.referenceId.input.inputValue();

    // Employee adds two expenses, which add up to the total
    await claimPage.addExpense({
      type: travel.name,
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

    // Employee submits the claim
    await claimPage.submit();

    // Employee sees the claim as Submitted in My Claims
    const myClaimsPage = new ClaimsListPage(page, 'claim/viewClaim');
    await myClaimsPage.goto();
    const row = myClaimsPage.row(referenceId);
    await expect(row).toContainText('Submitted');
    await expect(row).toContainText('430.50');
  });

  test('admin approves a submitted claim', async ({
    page,
    pageAs,
    api,
    users,
  }) => {
    // John has submitted a claim with one expense
    const {claimRequests} = api;
    const {referenceId} = await claimRequests.asUser('john', async () => {
      const claim = await claimRequests.create({
        claimEventId: conference.id,
        currencyId: 'EUR',
        remarks: 'Client visit',
      });
      await claimRequests.addExpense(claim.id, {
        expenseTypeId: travel.id,
        date: '2026-10-05',
        amount: '120.00',
      });
      await claimRequests.submit(claim.id);
      return claim;
    });

    // Admin finds John's claim in Employee Claims
    const employeeClaimsPage = new ClaimsListPage(
      await pageAs('admin'),
      'claim/viewAssignClaim',
    );
    await employeeClaimsPage.goto();
    await expect(employeeClaimsPage.row(referenceId)).toContainText(
      users.john.fullName,
    );

    // Admin opens it: Submitted, with the expense's total
    const reviewClaimPage = await employeeClaimsPage.view(referenceId);
    await expect(reviewClaimPage.status.input).toHaveValue('Submitted');
    await expect(reviewClaimPage.total).toHaveText(
      'Total Amount (Euro) : 120.00',
    );

    // Admin approves it, which marks it Paid
    await reviewClaimPage.act('Approve');
    await expect(reviewClaimPage.status.input).toHaveValue('Paid');

    // Employee sees the claim as Paid in My Claims
    const myClaimsPage = new ClaimsListPage(page, 'claim/viewClaim');
    await myClaimsPage.goto();
    await expect(myClaimsPage.row(referenceId)).toContainText('Paid');
  });
});
