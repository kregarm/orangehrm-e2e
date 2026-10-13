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
