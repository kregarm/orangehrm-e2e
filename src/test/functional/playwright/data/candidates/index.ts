import type {CandidatePayload} from '../../api/recruitment/CandidatesApiClass';

/** Name as the candidates list shows it: "First Middle Last" */
export const fullName = ({firstName, middleName, lastName}: CandidatePayload) =>
  [firstName, middleName, lastName].filter(Boolean).join(' ');
