import type { BadgeTone } from '../../../components/ui/Badge';
import type { RecommendationCategory, RecommendationPriority, ReviewStatus } from '../types/aiRecommendations.types';

export const RECOMMENDATIONS_I18N = 'manager.aiRecommendations';

/** Filter chips, in the order of the design */
export const CATEGORY_OPTIONS: RecommendationCategory[] = [
  'HOUSEKEEPING',
  'MAINTENANCE',
  'FRONT_DESK',
  'FINANCE',
  'GUEST_SATISFACTION',
  'ROOM_MANAGEMENT',
];

export const PRIORITY_RANK: Record<RecommendationPriority, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export const PRIORITY_TONE: Record<RecommendationPriority, BadgeTone> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
};

export const REVIEW_TONE: Record<Exclude<ReviewStatus, 'NEW'>, BadgeTone> = {
  REVIEWED: 'success',
  LATER: 'neutral',
};

export const NOTES_MAX_LENGTH = 500;
