import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGuestSurvey, getDepartingStays, getGuestSurveys } from '../services/guestSurveys.api';
import type { GuestSurvey, GuestSurveyCreate } from '../types/guestSurveys.types';

export const surveysKeys = {
  all: ['guest-surveys'] as const,
  list: () => [...surveysKeys.all, 'list'] as const,
  stays: () => [...surveysKeys.all, 'departing-stays'] as const,
};

export function useGuestSurveys() {
  return useQuery({ queryKey: surveysKeys.list(), queryFn: getGuestSurveys, staleTime: 0 });
}

export function useDepartingStays() {
  return useQuery({ queryKey: surveysKeys.stays(), queryFn: getDepartingStays, staleTime: 0 });
}

/** Adds the survey to the top of the list and removes the guest from the departing list */
export function useCreateGuestSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GuestSurveyCreate) => createGuestSurvey(body),
    onSuccess: (created) => {
      queryClient.setQueryData<GuestSurvey[]>(surveysKeys.list(), (current) => [created, ...(current ?? [])]);
      void queryClient.invalidateQueries({ queryKey: surveysKeys.all });
    },
  });
}
