import { apiRequest } from '../../../core/api/apiClient';
import type { Payment, PaymentsReportFilters } from '../types/payment.types';

export async function getPayments(): Promise<Payment[]> {
  return apiRequest<Payment[]>('/payments');
}

export async function getPaymentsReport(filters: PaymentsReportFilters = {}): Promise<Payment[]> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.method) params.set('method', filters.method);
  if (filters.status) params.set('status', filters.status);
  if (filters.query) params.set('q', filters.query);

  const queryString = params.toString();
  return apiRequest<Payment[]>(`/payments${queryString ? `?${queryString}` : ''}`);
}

