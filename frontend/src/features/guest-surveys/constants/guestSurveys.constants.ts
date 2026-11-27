import type { BadgeTone } from '../../../components/ui/Badge';
import type { SurveyStatus } from '../types/guestSurveys.types';

export const SURVEYS_I18N = 'guestSurveys';

export const SURVEYS_PAGE_SIZE = 6;

export const STATUS_OPTIONS: SurveyStatus[] = ['COMPLETED', 'PENDING_REVIEW'];

export const STATUS_TONE: Record<SurveyStatus, BadgeTone> = {
  COMPLETED: 'success',
  PENDING_REVIEW: 'warning',
};

export const MAX_STARS = 5;
export const TEXT_MAX_LENGTH = 500;
