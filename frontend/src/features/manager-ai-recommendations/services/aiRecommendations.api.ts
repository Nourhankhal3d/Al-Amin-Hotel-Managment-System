import { request } from '../../../core/api/apiClient';
import type { Language } from '../../../core/i18n';
import type {
  ApiRecommendation,
  ApiRecommendationsList,
  Recommendation,
  RecommendationReview,
  RecommendationsResult,
} from '../types/aiRecommendations.types';

// Not in the API contract yet (proposal for the backend)
const BASE = '/manager/ai/recommendations';

function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response ? (response as { data: T }).data : response as T;
}

export function toRecommendation(api: ApiRecommendation): Recommendation {
  return {
    id: String(api.recommendation_id),
    category: api.category,
    priority: api.priority ?? 'MEDIUM',
    title: api.title ?? '',
    summary: api.summary ?? '',
    reason: api.reason ?? '',
    expectedBenefit: api.expected_benefit ?? '',
    supportingStats: api.supporting_stats ?? [],
    suggestedActions: api.suggested_actions ?? [],
    reviewStatus: api.review_status ?? 'NEW',
    managerNotes: api.manager_notes ?? '',
    generatedAt: api.generated_at,
  };
}

function toResult(response: ApiRecommendationsList): RecommendationsResult {
  const items = (response.data ?? []).map(toRecommendation);
  return { items, generatedAt: response.meta?.generated_at ?? items[0]?.generatedAt ?? null };
}

/** GET /manager/ai/recommendations — the latest recommendations, written in the page language */
export async function getRecommendations(language: Language): Promise<RecommendationsResult> {
  return toResult(await request<ApiRecommendationsList>(BASE, { params: { lang: language } }));
}

/** POST /manager/ai/recommendations/refresh — asks the AI to read the latest numbers again */
export async function refreshRecommendations(language: Language): Promise<RecommendationsResult> {
  return toResult(await request<ApiRecommendationsList>(`${BASE}/refresh`, { method: 'POST', params: { lang: language } }));
}

/** PATCH /manager/ai/recommendations/{id} — reviewed or later, with the manager's notes */
export async function reviewRecommendation(id: string, body: RecommendationReview, language: Language): Promise<Recommendation> {
  const response = await request<ApiRecommendation | { data: ApiRecommendation }>(
    `${BASE}/${encodeURIComponent(id)}`,
    { method: 'PATCH', body, params: { lang: language } },
  );
  return toRecommendation(unwrap(response));
}
