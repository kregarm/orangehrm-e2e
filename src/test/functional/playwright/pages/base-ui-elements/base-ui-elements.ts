import { expect, type Locator, type Page } from '@playwright/test';

export class TextField {
  constructor(readonly root: Locator) {}
  fill(value: string) {
    return this.root.locator('input').fill(value);
  }
}

export class SelectField {
  constructor(readonly root: Locator, private page: Page) {}
  async choose(option: string) {
    await this.root.locator('.oxd-select-text').click();

    await this.page.getByRole('listbox').getByRole('option', { name: option, exact: true }).click();
    await expect(this.root.locator('.oxd-select-text-input')).toHaveText(option);
  }
}

export class AutocompleteField {
  constructor(readonly root: Locator, private page: Page) {}

  async pick(text: string, option = text) {
    await this.root.locator('input').fill(text);
    await this.page.getByRole('listbox').getByRole('option', { name: option, exact: true }).click();
  }
}
