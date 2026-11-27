// Manager AI assistant (chat). Not in the API contract yet: these names are the proposal for the backend.
// The server builds a short summary of the hotel's numbers and sends it to the AI with the manager's question,
// so the answers always use the hotel's real data.

/** GET /manager/ai/overview — the six cards above the chat */
export interface ApiAiOverview {
  occupied_rooms: number;
  available_rooms: number;
  maintenance_requests: number;
  cleaning_requests: number;
  revenue_today: number;
  guest_satisfaction: number;
}

export type MessageRole = 'USER' | 'ASSISTANT';

export interface ApiChatMessage {
  message_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

/** GET /manager/ai/conversations item */
export interface ApiConversationSummary {
  conversation_id: string;
  title: string;
  question_count: number;
  updated_at: string;
}

/** GET /manager/ai/conversations/{id} */
export interface ApiConversation extends ApiConversationSummary {
  messages: ApiChatMessage[];
}

export interface ApiList<T> {
  data: T[];
}

export interface AiOverview {
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRequests: number;
  cleaningRequests: number;
  revenueToday: number;
  guestSatisfaction: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  questionCount: number;
  updatedAt: string;
}

export interface Conversation extends ConversationSummary {
  messages: ChatMessage[];
}
