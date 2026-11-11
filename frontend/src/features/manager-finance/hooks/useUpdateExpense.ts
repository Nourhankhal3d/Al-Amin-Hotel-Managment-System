import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateExpense, financeQueryKeys } from '../services/manager-finance.api';
import type { UpdateExpenseDto } from '../types/manager-finance.dto';

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ expenseId, payload }: { expenseId: string; payload: UpdateExpenseDto }) =>
      updateExpense(expenseId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...financeQueryKeys.all, 'expenses'] });
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.summary() });
    },
  });
}
