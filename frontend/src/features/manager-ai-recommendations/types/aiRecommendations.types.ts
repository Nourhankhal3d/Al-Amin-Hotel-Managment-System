// AI recommendations for the manager. Not in the API contract yet: these names are the proposal for the backend.
// The AI service reads the hotel's numbers (rooms, housekeeping, maintenance, front desk, finance, guest surveys)
// and sends back prioritised recommendations, each with its reason and the numbers behind it.

export type RecommendationCategory =
  | 'HOUSEKEEPING'
  | 'MAINTENANCE'
  | 'FRONT_DESK'
  | 'FINANCE'
  | 'GUEST_SATISFACTION'
  | 'ROOM_MANAGEMENT';

export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

/** NEW until the manager marks it as reviewed or leaves it for later */
export type ReviewStatus = 'NEW' | 'REVIEWED' | 'LATER';

/** GET /manager/ai/recommendations item (texts come in the language asked for with ?lang=) */
export interface ApiRecommendation {
  recommendation_id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  summary: string;
  reason: string;
  expected_benefit: string;
  supporting_stats: string[];
  suggested_actions: string[];
  review_status: ReviewStatus;
  manager_notes: string | null;
  generated_at: string;
}

export interface ApiRecommendationsList {
  data: ApiRecommendation[];
  meta?: { generated_at?: string };
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  summary: string;
  reason: string;
  expectedBenefit: string;
  supportingStats: string[];
  suggestedActions: string[];
  reviewStatus: ReviewStatus;
  managerNotes: string;
  generatedAt: string;
}

export interface RecommendationsResult {
  items: Recommendation[];
  generatedAt: string | null;
}

/** PATCH /manager/ai/recommendations/{id} */
export interface RecommendationReview {
  review_status: Exclude<ReviewStatus, 'NEW'>;
  manager_notes?: string;
}
