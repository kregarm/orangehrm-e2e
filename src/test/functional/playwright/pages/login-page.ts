import {type Page} from '@playwright/test';
import {Form} from './base-ui-elements/form';
import type {Credentials} from '../api/BaseApiClass';

/** The login page (auth/login) */
export class LoginPage extends Form {
  readonly username = this.text('Username');
  readonly password = this.text('Password');

  readonly loginButton = this.button('Login');

  constructor(page: Page) {
    super(page, page.locator('form.oxd-form'));
  }

  goto() {
    return this.page.goto('auth/login');
  }

  /** Fill in the form and submit it; the result is up to the caller */
  async login({username, password}: Credentials) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}
