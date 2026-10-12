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

require('./support/hosts');
const {request} = require('@playwright/test');
const {createDb} = require('./support/db');

/**
 * Clear savepoints left over from earlier runs, like Cypress' `before:run`.
 * @param {import('@playwright/test').FullConfig} config
 */
module.exports = async (config) => {
  const context = await request.newContext({
    baseURL: config.projects[0].use.baseURL,
  });
  try {
    await createDb(context).clearSnapshots();
  } finally {
    await context.dispose();
  }
};
