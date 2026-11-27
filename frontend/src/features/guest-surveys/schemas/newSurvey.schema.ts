import { normalizeDigits } from '../../../utils/digits';
import { TEXT_MAX_LENGTH } from '../constants/guestSurveys.constants';
import {
  RATING_QUESTIONS,
  type DepartingStay,
  type GuestSurveyCreate,
  type SurveyRatings,
  type SurveyStatus,
} from '../types/guestSurveys.types';

export interface NewSurveyValues {
  roomNumber: string;
  ratings: SurveyRatings;
  hadProblem: 'yes' | 'no';
  problemDetails: string;
  suggestions: string;
  overallRating: number;
  status: SurveyStatus;
}

export type NewSurveyField = 'roomNumber' | 'ratings' | 'problemDetails' | 'suggestions' | 'overallRating';
export type NewSurveyErrors = Partial<Record<NewSurveyField, string>>;

/** Order used to focus the first field that needs fixing */
export const NEW_SURVEY_FIELD_ORDER: NewSurveyField[] = ['roomNumber', 'ratings', 'problemDetails', 'suggestions', 'overallRating'];

const EMPTY_RATINGS = Object.fromEntries(RATING_QUESTIONS.map((question) => [question, 0])) as SurveyRatings;

export const EMPTY_NEW_SURVEY: NewSurveyValues = {
  roomNumber: '',
  ratings: EMPTY_RATINGS,
  hadProblem: 'no',
  problemDetails: '',
  suggestions: '',
  overallRating: 0,
  status: 'COMPLETED',
};

/** The departing guest in the typed or picked room ("٣٠٤" and "304" are the same room) */
export function findStay(roomNumber: string, stays: DepartingStay[]): DepartingStay | null {
  const room = normalizeDigits(roomNumber.trim());
  if (!room) return null;
  return stays.find((stay) => stay.roomNumber === room) ?? null;
}

export function validateNewSurvey(values: NewSurveyValues, stays: DepartingStay[]): NewSurveyErrors {
  const errors: NewSurveyErrors = {};
  if (!values.roomNumber.trim()) errors.roomNumber = 'roomRequired';
  else if (!findStay(values.roomNumber, stays)) errors.roomNumber = 'roomNoStay';

  if (RATING_QUESTIONS.some((question) => values.ratings[question] < 1)) errors.ratings = 'ratingsRequired';

  if (values.hadProblem === 'yes' && !values.problemDetails.trim()) errors.problemDetails = 'problemRequired';
  else if (values.problemDetails.trim().length > TEXT_MAX_LENGTH) errors.problemDetails = 'tooLong';

  if (values.suggestions.trim().length > TEXT_MAX_LENGTH) errors.suggestions = 'tooLong';
  if (values.overallRating < 1) errors.overallRating = 'overallRequired';
  return errors;
}

export function toCreateBody(values: NewSurveyValues, stay: DepartingStay): GuestSurveyCreate {
  const hadProblem = values.hadProblem === 'yes';
  return {
    reservation_id: stay.reservationId,
    ratings: values.ratings,
    had_problem: hadProblem,
    ...(hadProblem && values.problemDetails.trim() ? { problem_details: values.problemDetails.trim() } : {}),
    ...(values.suggestions.trim() ? { suggestions: values.suggestions.trim() } : {}),
    overall_rating: values.overallRating,
    status: values.status,
  };
}
