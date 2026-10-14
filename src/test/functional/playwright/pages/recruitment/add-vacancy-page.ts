import {expect, type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {
  type AutocompleteField,
  type SelectField,
  SwitchField,
  type TextField,
} from '../base-ui-elements/base-ui-elements';

/** Recruitment > Vacancies > Add (recruitment/addJobVacancy) */
export class AddVacancyPage {
  readonly form: Form;

  readonly name: TextField;
  readonly jobTitle: SelectField;
  readonly description: TextField;
  readonly hiringManager: AutocompleteField;
  readonly numOfPositions: TextField;
  readonly active: SwitchField;
  readonly published: SwitchField;

  readonly saveButton: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.name = this.form.text('Vacancy Name');
    this.jobTitle = this.form.select('Job Title');
    this.description = this.form.text('Description');
    this.hiringManager = this.form.autocomplete('Hiring Manager');
    this.numOfPositions = this.form.text('Number of Positions');
    this.active = this.switch('Active');
    this.published = this.switch('Publish in RSS Feed and Web Page');
    this.saveButton = this.form.button('Save');
  }

  // The switches have no oxd label, just a text next to them
  private switch(text: string) {
    return new SwitchField(
      this.form.root.locator('.orangerhrm-switch-wrapper', {hasText: text}),
    );
  }

  goto() {
    return this.page.goto('recruitment/addJobVacancy');
  }

  /** Save and wait for the new vacancy's loaded edit page */
  async save() {
    await this.saveButton.click();
    await expect(
      this.page.getByRole('heading', {name: 'Edit Vacancy'}),
    ).toBeVisible();
    await expect(this.page.locator('.oxd-form-loader')).toHaveCount(0);
  }
}
