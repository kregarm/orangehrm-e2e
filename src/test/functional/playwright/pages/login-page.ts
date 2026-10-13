/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */

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
