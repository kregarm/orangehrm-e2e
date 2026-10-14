import {type Locator, type Page} from '@playwright/test';
import {Form} from '../base-ui-elements/form';
import {type TextField} from '../base-ui-elements/base-ui-elements';
import type {Credentials} from '../../api/BaseApiClass';

/** The login page (auth/login) */
export class LoginPage {
  readonly form: Form;

  readonly username: TextField;
  readonly password: TextField;

  readonly loginButton: Locator;
  /** The error above the form, e.g. "Invalid credentials" */
  readonly alert: Locator;

  constructor(readonly page: Page) {
    this.form = new Form(page);
    this.username = this.form.text('Username');
    this.password = this.form.text('Password');
    this.loginButton = this.form.button('Login');
    this.alert = page.getByRole('alert');
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
