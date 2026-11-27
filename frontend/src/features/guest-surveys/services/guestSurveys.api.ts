import { request } from '../../../core/api/apiClient';
import type {
  ApiDepartingStay,
  ApiGuestSurvey,
  ApiList,
  DepartingStay,
  GuestSurvey,
  GuestSurveyCreate,
} from '../types/guestSurveys.types';

// Not in the API contract yet (proposal for the backend)
const BASE = '/guest-surveys';

function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response ? (response as { data: T }).data : response as T;
}

export function toGuestSurvey(api: ApiGuestSurvey): GuestSurvey {
  return {
    id: String(api.survey_id),
    reservationId: api.reservation_id ?? null,
    guestName: api.guest_name ?? '',
    roomNumber: String(api.room_number ?? ''),
    roomType: api.room_type ?? null,
    checkInDate: api.check_in_date ?? null,
    checkOutDate: api.check_out_date ?? null,
    ratings: api.ratings,
    hadProblem: Boolean(api.had_problem),
    problemDetails: api.problem_details ?? '',
    suggestions: api.suggestions ?? '',
    overallRating: api.overall_rating ?? 0,
    status: api.status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'COMPLETED',
    createdAt: api.created_at,
  };
}

/** GET /guest-surveys */
export async function getGuestSurveys(): Promise<GuestSurvey[]> {
  const response = await request<ApiList<ApiGuestSurvey>>(BASE, { params: { limit: 100 } });
  return (response.data ?? []).map(toGuestSurvey);
}

/** GET /guest-surveys/departing-stays */
export async function getDepartingStays(): Promise<DepartingStay[]> {
  const response = await request<ApiList<ApiDepartingStay>>(`${BASE}/departing-stays`);
  return (response.data ?? []).map((stay) => ({
    reservationId: String(stay.reservation_id),
    guestName: stay.guest_name ?? '',
    roomNumber: String(stay.room_number ?? ''),
    roomType: stay.room_type ?? null,
    checkInDate: stay.check_in_date ?? null,
    checkOutDate: stay.check_out_date ?? null,
  }));
}

/** POST /guest-surveys */
export async function createGuestSurvey(body: GuestSurveyCreate): Promise<GuestSurvey> {
  const response = await request<ApiGuestSurvey | { data: ApiGuestSurvey }>(BASE, { method: 'POST', body });
  return toGuestSurvey(unwrap(response));
}
