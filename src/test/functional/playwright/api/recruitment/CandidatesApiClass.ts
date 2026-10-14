import {BaseApiClass, compact, type ApiResponse} from '../BaseApiClass';

/**
 * Body of POST /api/v2/recruitment/candidates (CandidateAPI::create).
 * firstName, lastName and email are required by the API; the rest is
 * optional and left out of the request unless given.
 */
export type CandidatePayload = {
  firstName: string;
  lastName: string;
  email: string;
  middleName?: string | null;
  contactNumber?: string | null;
  vacancyId?: number | null;
  keywords?: string | null;
  comment?: string | null;
  /** Y-m-d; the server defaults to today */
  dateOfApplication?: string | null;
  consentToKeepData?: boolean;
};

/** CandidateModel */
export type Candidate = {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
};

let sequence = 0;

/** Unique, valid values for the required fields */
const buildCandidate = (): Pick<
  CandidatePayload,
  'firstName' | 'lastName' | 'email'
> => {
  const id = `${Date.now().toString(36)}${(sequence++).toString(36)}`;
  return {
    firstName: 'Test',
    lastName: `Candidate ${id}`,
    email: `candidate.${id}@example.com`,
  };
};

/**
 * Body of POST /api/v2/recruitment/candidates/{id}/shedule-interview
 * (CandidateInterviewSchedulingAPI::create)
 */
export type InterviewPayload = {
  interviewName: string;
  /** Y-m-d */
  interviewDate: string;
  /** H:i */
  interviewTime?: string | null;
  interviewerEmpNumbers: number[];
  note?: string | null;
};

/** CandidateInterviewModel as returned by create */
export type Interview = {id: number; interviewName: string};

export class CandidatesApiClass extends BaseApiClass {
  static readonly path = 'api/v2/recruitment/candidates';

  /**
   * Create a candidate. Any field not given is either generated (required
   * ones) or omitted (optional ones), e.g.
   *
   *   create()                                       // all generated
   *   create({firstName: 'Jane', email: 'j@x.com'})  // lastName generated
   *   create({...all, vacancyId: 1, comment: 'hi'})  // full payload
   */
  async create(fields: Partial<CandidatePayload> = {}): Promise<Candidate> {
    const {data} = await this.post<ApiResponse<Candidate>>(
      CandidatesApiClass.path,
      compact({...buildCandidate(), ...fields}),
    );
    return data;
  }

  /** Move a candidate from Application Initiated to Shortlisted */
  async shortlist(id: number, note: string | null = null): Promise<void> {
    await this.put(`${CandidatesApiClass.path}/${id}/shortlist`, {note});
  }

  /** Schedule an interview for a Shortlisted candidate */
  async scheduleInterview(
    id: number,
    interview: InterviewPayload,
  ): Promise<Interview> {
    // "shedule" is the endpoint's own spelling
    const {data} = await this.post<ApiResponse<Interview>>(
      `${CandidatesApiClass.path}/${id}/shedule-interview`,
      {interviewTime: null, note: null, ...interview},
    );
    return data;
  }

  async passInterview(
    id: number,
    interviewId: number,
    note: string | null = null,
  ): Promise<void> {
    await this.put(
      `${CandidatesApiClass.path}/${id}/interviews/${interviewId}/pass`,
      {note},
    );
  }

  /** Offer the job to a candidate who passed an interview */
  async offerJob(id: number, note: string | null = null): Promise<void> {
    await this.put(`${CandidatesApiClass.path}/${id}/job/offer`, {note});
  }
}
