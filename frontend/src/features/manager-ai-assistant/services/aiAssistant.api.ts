import { request } from '../../../core/api/apiClient';
import type { Language } from '../../../core/i18n';
import type {
  AiOverview,
  ApiAiOverview,
  ApiChatMessage,
  ApiConversation,
  ApiConversationSummary,
  ApiList,
  Conversation,
  ConversationSummary,
} from '../types/aiAssistant.types';

// Not in the API contract yet (proposal for the backend)
const BASE = '/manager/ai';

function unwrap<T>(response: T | { data: T }): T {
  return response && typeof response === 'object' && 'data' in response ? (response as { data: T }).data : response as T;
}

function toSummary(api: ApiConversationSummary): ConversationSummary {
  return {
    id: String(api.conversation_id),
    title: api.title ?? '',
    questionCount: api.question_count ?? 0,
    updatedAt: api.updated_at,
  };
}

function toConversation(api: ApiConversation): Conversation {
  return {
    ...toSummary(api),
    messages: (api.messages ?? []).map((message: ApiChatMessage) => ({
      id: String(message.message_id),
      role: message.role === 'USER' ? 'USER' : 'ASSISTANT',
      content: message.content ?? '',
      createdAt: message.created_at,
    })),
  };
}

/** GET /manager/ai/overview */
export async function getAiOverview(): Promise<AiOverview> {
  const api = unwrap(await request<ApiAiOverview | { data: ApiAiOverview }>(`${BASE}/overview`));
  return {
    occupiedRooms: api.occupied_rooms ?? 0,
    availableRooms: api.available_rooms ?? 0,
    maintenanceRequests: api.maintenance_requests ?? 0,
    cleaningRequests: api.cleaning_requests ?? 0,
    revenueToday: api.revenue_today ?? 0,
    guestSatisfaction: api.guest_satisfaction ?? 0,
  };
}

/** GET /manager/ai/conversations — newest first */
export async function getConversations(language: Language): Promise<ConversationSummary[]> {
  const response = await request<ApiList<ApiConversationSummary>>(`${BASE}/conversations`, { params: { lang: language } });
  return (response.data ?? []).map(toSummary);
}

/** GET /manager/ai/conversations/{id} */
export async function getConversation(id: string, language: Language): Promise<Conversation> {
  const response = await request<ApiConversation | { data: ApiConversation }>(
    `${BASE}/conversations/${encodeURIComponent(id)}`,
    { params: { lang: language } },
  );
  return toConversation(unwrap(response));
}

/** POST /manager/ai/conversations — an empty conversation */
export async function createConversation(): Promise<Conversation> {
  return toConversation(unwrap(await request<ApiConversation | { data: ApiConversation }>(`${BASE}/conversations`, { method: 'POST' })));
}

/** POST /manager/ai/conversations/{id}/messages — the question; the answer is in the returned conversation */
export async function sendQuestion(id: string, content: string, language: Language): Promise<Conversation> {
  const response = await request<ApiConversation | { data: ApiConversation }>(
    `${BASE}/conversations/${encodeURIComponent(id)}/messages`,
    { method: 'POST', body: { content }, params: { lang: language } },
  );
  return toConversation(unwrap(response));
}
