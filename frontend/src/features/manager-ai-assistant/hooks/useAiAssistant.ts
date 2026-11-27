import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Language } from '../../../core/i18n';
import { NEW_CONVERSATION } from '../constants/aiAssistant.constants';
import {
  createConversation,
  getAiOverview,
  getConversation,
  getConversations,
  sendQuestion,
} from '../services/aiAssistant.api';
import type { Conversation, ConversationSummary } from '../types/aiAssistant.types';

export const assistantKeys = {
  all: ['manager-ai-assistant'] as const,
  overview: () => [...assistantKeys.all, 'overview'] as const,
  list: (language: Language) => [...assistantKeys.all, 'conversations', language] as const,
  detail: (id: string, language: Language) => [...assistantKeys.all, 'conversation', id, language] as const,
};

export function useAiOverview() {
  return useQuery({ queryKey: assistantKeys.overview(), queryFn: getAiOverview, staleTime: 60_000 });
}

export function useConversations(language: Language) {
  return useQuery({ queryKey: assistantKeys.list(language), queryFn: () => getConversations(language), staleTime: 0 });
}

export function useConversation(id: string | null, language: Language) {
  return useQuery({
    queryKey: assistantKeys.detail(id ?? '', language),
    queryFn: () => getConversation(id ?? '', language),
    enabled: Boolean(id) && id !== NEW_CONVERSATION,
    staleTime: 30_000,
  });
}

/** Sends a question; a chat without a conversation gets one first */
export function useSendQuestion(language: Language) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string | null; content: string }) => {
      const id = conversationId && conversationId !== NEW_CONVERSATION ? conversationId : (await createConversation()).id;
      return sendQuestion(id, content, language);
    },
    onSuccess: (conversation: Conversation) => {
      queryClient.setQueryData(assistantKeys.detail(conversation.id, language), conversation);
      queryClient.setQueryData<ConversationSummary[]>(assistantKeys.list(language), (current) => {
        const summary: ConversationSummary = {
          id: conversation.id,
          title: conversation.title,
          questionCount: conversation.questionCount,
          updatedAt: conversation.updatedAt,
        };
        return [summary, ...(current ?? []).filter((item) => item.id !== conversation.id)];
      });
      void queryClient.invalidateQueries({ queryKey: assistantKeys.all, refetchType: 'none' });
    },
  });
}
