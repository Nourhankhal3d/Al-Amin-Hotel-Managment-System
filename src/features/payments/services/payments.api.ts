import { apiRequest } from '../../../core/api/apiClient';
import type { Payment } from '../types/payment.types';

export async function getPayments(): Promise<Payment[]> {
  return apiRequest<Payment[]>('/payments');
}
