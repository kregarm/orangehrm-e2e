import {type Page} from '@playwright/test';
import {SwitchField} from './base-ui-elements/base-ui-elements';
import {Form} from './base-ui-elements/form';

/** Recruitment > Vacancies > Add (recruitment/addJobVacancy) */
export class AddVacancyPage extends Form {
  readonly name = this.text('Vacancy Name');
  readonly jobTitle = this.select('Job Title');
  readonly description = this.text('Description');
  readonly hiringManager = this.autocomplete('Hiring Manager');
  readonly numOfPositions = this.text('Number of Positions');
  readonly active = this.switch('Active');
  readonly published = this.switch('Publish in RSS Feed and Web Page');

  readonly saveButton = this.button('Save');

  constructor(page: Page) {
    super(page, page.locator('form.oxd-form'));
  }

  // The switches have no oxd label, just a text next to them
  private switch(text: string) {
    return new SwitchField(
      this.root.locator('.orangerhrm-switch-wrapper', {hasText: text}),
    );
  }

  goto() {
    return this.page.goto('recruitment/addJobVacancy');
  }

  /**
   * Save and wait for the redirect to the new vacancy's edit page,
   * returning its id. (The POST body can't be read: the redirect follows
   * too quickly.)
   */
  async save(): Promise<number> {
    const editUrl = /recruitment\/addJobVacancy\/(\d+)$/;
    await this.saveButton.click();
    await this.page.waitForURL(editUrl);
    return Number(editUrl.exec(this.page.url())![1]);
  }
}
