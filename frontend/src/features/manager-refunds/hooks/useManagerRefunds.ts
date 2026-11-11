import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decideRefundRequest, getRefundRequests } from '../services/manager-refunds.api';
import type { ApprovalDecisionBody, RefundRequest } from '../types/manager-refunds.types';

export const refundsKeys = {
  all: ['manager-refunds'] as const,
  list: () => [...refundsKeys.all, 'list'] as const,
};

export function useRefundRequests() {
  return useQuery({ queryKey: refundsKeys.list(), queryFn: getRefundRequests, staleTime: 0 });
}

/** Records the decision and updates the badge in the list right away */
export function useDecideRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, idempotencyKey }: { id: string; body: ApprovalDecisionBody; idempotencyKey: string }) =>
      decideRefundRequest(id, body, idempotencyKey),
    onSuccess: (saved) => {
      // The decision response has no reservation block, so the room and guest are kept from the list
      queryClient.setQueryData<RefundRequest[]>(refundsKeys.list(), (current) =>
        current?.map((item) => (item.id === saved.id
          ? { ...item, status: saved.status, approvedAmount: saved.approvedAmount, retainedAmount: saved.retainedAmount,
            managerNotes: saved.managerNotes, decidedAt: saved.decidedAt }
          : item)));
      void queryClient.invalidateQueries({ queryKey: refundsKeys.list() });
    },
  });
}
