// Guest satisfaction survey, filled by the receptionist when the guest checks out.
// Not in the API contract yet: these names are the proposal for the backend (same style as the contract: snake_case).

export type SurveyStatus = 'COMPLETED' | 'PENDING_REVIEW';

/** The eight star questions, in the order of the design */
export const RATING_QUESTIONS = [
  'cleanliness',
  'staff',
  'speed',
  'room_quality',
  'check_in',
  'check_out',
  'stay_again',
  'recommend',
] as const;

export type RatingQuestion = (typeof RATING_QUESTIONS)[number];

/** 1 to 5 stars per question */
export type SurveyRatings = Record<RatingQuestion, number>;

/** GET /guest-surveys item */
export interface ApiGuestSurvey {
  survey_id: string;
  reservation_id: string | null;
  guest_name: string;
  room_number: string;
  room_type: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
  ratings: SurveyRatings;
  had_problem: boolean;
  problem_details: string | null;
  suggestions: string | null;
  overall_rating: number;
  status: SurveyStatus;
  created_at: string;
}

/** GET /guest-surveys/departing-stays item: guests checking out who have no survey yet */
export interface ApiDepartingStay {
  reservation_id: string;
  guest_name: string;
  room_number: string;
  room_type: string | null;
  check_in_date: string | null;
  check_out_date: string | null;
}

export interface ApiList<T> {
  data: T[];
}

/** Survey as the page uses it */
export interface GuestSurvey {
  id: string;
  reservationId: string | null;
  guestName: string;
  roomNumber: string;
  roomType: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  ratings: SurveyRatings;
  hadProblem: boolean;
  problemDetails: string;
  suggestions: string;
  overallRating: number;
  status: SurveyStatus;
  createdAt: string;
}

export interface DepartingStay {
  reservationId: string;
  guestName: string;
  roomNumber: string;
  roomType: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
}

/** POST /guest-surveys */
export interface GuestSurveyCreate {
  reservation_id: string;
  ratings: SurveyRatings;
  had_problem: boolean;
  problem_details?: string;
  suggestions?: string;
  overall_rating: number;
  status: SurveyStatus;
}
