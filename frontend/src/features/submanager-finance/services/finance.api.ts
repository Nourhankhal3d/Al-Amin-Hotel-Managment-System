import { request } from '../../../core/api/apiClient';
import type {
  ExpenseRecord,
  ExpenseUpdate,
  PaymentRecord,
  PaymentStatus,
  SubManagerFinanceData,
} from '../types/submanager-finance.types';

export const subManagerFinanceQueryKeys = {
  all: ['submanager-finance'] as const,
  ledger: () => [...subManagerFinanceQueryKeys.all, 'ledger'] as const,
};

const pendingExpenseUpdates = new Map<string, Promise<ExpenseRecord>>();
const recentExpenseUpdates = new Map<string, { record: ExpenseRecord; expiresAt: number }>();

export function getSubManagerFinanceData(): Promise<SubManagerFinanceData> {
  return request<SubManagerFinanceData>('/sub-manager/finance');
}

export function updatePaymentStatus(id: string, status: PaymentStatus): Promise<PaymentRecord> {
  return request<PaymentRecord>(`/sub-manager/finance/payments/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
  });
}

export function updateExpense(id: string, values: ExpenseUpdate): Promise<ExpenseRecord> {
  const requestKey = JSON.stringify([id, values]);
  const recent = recentExpenseUpdates.get(requestKey);
  if (recent && recent.expiresAt > Date.now()) return Promise.resolve(recent.record);
  if (recent) recentExpenseUpdates.delete(requestKey);

  const pending = pendingExpenseUpdates.get(requestKey);
  if (pending) return pending;

  const update = request<ExpenseRecord>(`/sub-manager/finance/expenses/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: values,
  }).then((record) => {
    const cached = { record, expiresAt: Date.now() + 1000 };
    recentExpenseUpdates.set(requestKey, cached);
    window.setTimeout(() => {
      if (recentExpenseUpdates.get(requestKey) === cached) recentExpenseUpdates.delete(requestKey);
    }, 1000);
    return record;
  }).finally(() => pendingExpenseUpdates.delete(requestKey));
  pendingExpenseUpdates.set(requestKey, update);
  return update;
}