import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePaymentStatus, financeQueryKeys } from '../services/manager-finance.api';
import type { TransactionStatusCode } from '../constants/finance.constants';

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, status, reason }: { paymentId: string; status: TransactionStatusCode; reason?: string }) =>
      updatePaymentStatus(paymentId, status, reason),
    onSuccess: () => {
      // Invalidate payments list, daily closing, hourly revenue, and summary queries
      void queryClient.invalidateQueries({ queryKey: [...financeQueryKeys.all, 'payments'] });
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.dailyClosing() });
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.hourlyRevenue() });
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.summary() });
    },
  });
}
