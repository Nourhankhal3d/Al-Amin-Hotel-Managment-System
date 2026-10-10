
import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import type { Payment } from '../types/payment.types';

export async function getPayments(): Promise<Payment[]> {
  const response = await request<Paginated<Payment>>('/payments');
  return response.data;
}