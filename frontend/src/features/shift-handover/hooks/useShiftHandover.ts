import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getShiftSummary,
  submitShiftHandover,
} from '../services/shift-handover.api';

export const shiftSummaryKey = ['shift-handover', 'summary'] as const;

// enabled=false after handover: the summary stays shown from the cache instead of returning 404
export function useShiftSummary(enabled: boolean) {
  return useQuery({
    queryKey: shiftSummaryKey,
    queryFn: getShiftSummary,
    enabled,
  });
}

export function useHandoverShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitShiftHandover,
    // The handover response is the closed shift: put it straight into the Sidebar's cache,
    // so the logout warning disappears immediately.
    onSuccess: (shift) => {
      queryClient.setQueryData(['shift', 'current'], shift);
    },
  });
}