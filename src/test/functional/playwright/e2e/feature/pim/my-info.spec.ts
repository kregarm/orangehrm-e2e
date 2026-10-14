import {test, expect} from '../../../support/fixtures';
import {ContactDetailsPage} from '../../../pages/contact-details-page';

test.describe('PIM - My Info', () => {
  test.use({loginAs: 'john'});

  let empNumber: number;

  test.beforeAll(async ({db, api, users}) => {
    await db.reset();
    ({
      employee: {empNumber},
    } = await api.users.ensure(users.john));
  });

  test('employee updates their own contact details', async ({page, pageAs}) => {
    const contact = {
      street1: 'Slovenska cesta 1',
      city: 'Ljubljana',
      country: 'Slovenia',
      mobilePhone: '+386 40 123 456',
      workEmail: 'john.perera@example.com',
    };

    const contactDetailsPage = new ContactDetailsPage(page);
    await contactDetailsPage.goto(empNumber);
    await contactDetailsPage.street1.fill(contact.street1);
    await contactDetailsPage.city.fill(contact.city);
    await contactDetailsPage.country.choose(contact.country);
    await contactDetailsPage.mobilePhone.fill(contact.mobilePhone);
    await contactDetailsPage.workEmail.fill(contact.workEmail);
    await contactDetailsPage.save();

    // Saved for HR too: the admin sees them on John's record
    const adminView = new ContactDetailsPage(await pageAs('admin'));
    await adminView.goto(empNumber);
    await expect(adminView.street1.input).toHaveValue(contact.street1);
    await expect(adminView.city.input).toHaveValue(contact.city);
    await expect(adminView.country.root).toContainText(contact.country);
    await expect(adminView.mobilePhone.input).toHaveValue(contact.mobilePhone);
    await expect(adminView.workEmail.input).toHaveValue(contact.workEmail);
  });
});
