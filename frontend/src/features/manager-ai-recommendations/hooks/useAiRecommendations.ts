import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Language } from '../../../core/i18n';
import { getRecommendations, refreshRecommendations, reviewRecommendation } from '../services/aiRecommendations.api';
import type { RecommendationReview, RecommendationsResult } from '../types/aiRecommendations.types';

export const recommendationsKeys = {
  all: ['manager-ai-recommendations'] as const,
  list: (language: Language) => [...recommendationsKeys.all, 'list', language] as const,
};

export function useRecommendations(language: Language) {
  return useQuery({ queryKey: recommendationsKeys.list(language), queryFn: () => getRecommendations(language), staleTime: 60_000 });
}

/** Replaces the list with the new recommendations */
export function useRefreshRecommendations(language: Language) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshRecommendations(language),
    onSuccess: (result) => {
      queryClient.setQueryData<RecommendationsResult>(recommendationsKeys.list(language), result);
      // The other language reloads the next time it is opened
      void queryClient.invalidateQueries({ queryKey: recommendationsKeys.all, refetchType: 'none' });
    },
  });
}

/** Saves "reviewed" or "later" and updates the card right away */
export function useReviewRecommendation(language: Language) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RecommendationReview }) => reviewRecommendation(id, body, language),
    onSuccess: (saved) => {
      queryClient.setQueryData<RecommendationsResult>(recommendationsKeys.list(language), (current) => current && {
        ...current,
        items: current.items.map((item) => (item.id === saved.id ? saved : item)),
      });
      void queryClient.invalidateQueries({ queryKey: recommendationsKeys.all, refetchType: 'none' });
    },
  });
}
