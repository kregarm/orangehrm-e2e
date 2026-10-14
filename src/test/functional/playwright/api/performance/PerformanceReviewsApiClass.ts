import {BaseApiClass, type ApiResponse} from '../BaseApiClass';

/** Body of POST /api/v2/performance/manage/reviews (PerformanceReviewAPI::create) */
export type ReviewPayload = {
  empNumber: number;
  /** empNumber of one of the employee's supervisors */
  reviewerEmpNumber: number;
  /** Y-m-d review period */
  startDate: string;
  endDate: string;
  /** Y-m-d, after endDate */
  dueDate: string;
};

/** PerformanceReviewModel as returned by create */
export type Review = {id: number};

/**
 * Performance reviews. `create` needs an Admin session; the evaluations act
 * as the current user, so wrap them in `asUser`, e.g.
 *
 *   api.performanceReviews.asUser('john', () =>
 *     api.performanceReviews.completeSelfEvaluation(...))
 */
export class PerformanceReviewsApiClass extends BaseApiClass {
  /** An activated review, ready for the employee's self evaluation */
  async create(payload: ReviewPayload): Promise<Review> {
    const {data} = await this.post<ApiResponse<Review>>(
      'api/v2/performance/manage/reviews',
      {...payload, activate: true},
    );
    return data;
  }

  /**
   * Complete the current user's (the employee's) self evaluation, rating
   * every KPI of the review `rating`
   */
  async completeSelfEvaluation(reviewId: number, rating = 4) {
    const path = `api/v2/performance/reviews/${reviewId}`;
    const {data: kpis} = await this.get<ApiResponse<{id: number}[]>>(
      `${path}/kpis`,
    );
    await this.put(`${path}/evaluation/employee`, {
      complete: true,
      ratings: kpis.map(({id}) => ({kpiId: id, rating, comment: ''})),
      generalComment: '',
    });
  }
}
