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
import type {CandidatePayload} from '../../api/recruitment/CandidatesApiClass';

/**
 * Candidates known to the functional tests. None exist after db.reset();
 * create them with `api.candidates.create(candidates.jane)`.
 */
export const candidates = {
  jane: {
    firstName: 'Jane',
    middleName: 'Marie',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    contactNumber: '+1 555 0100',
    keywords: 'php, vue, testing',
    comment: 'Referred by an employee',
    dateOfApplication: '2026-10-01',
    consentToKeepData: true,
  },
} as const satisfies Record<string, CandidatePayload>;

/** Name as the candidates list shows it: "First Middle Last" */
export const fullName = ({firstName, middleName, lastName}: CandidatePayload) =>
  [firstName, middleName, lastName].filter(Boolean).join(' ');
