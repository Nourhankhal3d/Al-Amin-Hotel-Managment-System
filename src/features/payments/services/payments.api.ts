import { request } from '../../../core/api/apiClient';
import type { Paginated } from '../../../core/api/api.types';
import { newIdempotencyKey } from '../../../core/api/idempotency';
import { PAYMENT_METHODS } from '../../../core/constants/paymentMethods';
import { STATUS } from '../../../core/constants/status';
import type {
  ApiPayment,
  CreatePaymentInput,
  CreatePaymentResponse,
  Payment,
  PaymentsReportFilters,
} from '../types/payment.types';

export const PAYMENTS_FETCH_LIMIT = 100;

export function mapApiPaymentToPayment(api: ApiPayment): Payment {
  let method: string = api.payment_method;
  if (api.payment_method === 'cash') {
    method = PAYMENT_METHODS.cash;
  } else if (api.payment_method === 'instapay') {
    method = PAYMENT_METHODS.card;
  } else if (api.payment_method === 'vodafone_cash') {
    method = PAYMENT_METHODS.transfer;
  }

  const status = api.reversal_of_payment_id
    ? STATUS.cancelled
    : api.payment_verified
      ? STATUS.completed
      : STATUS.pending;

  return {
    id: String(api.payment_id),
    invoiceNo: `INV-${api.payment_id}`,
    guestName: undefined,
    roomNo: '',
    amount: api.amount,
    currency: 'EGP',
    method,
    status,
    paidAt: api.payment_datetime,
    recordedBy: `موظف #${api.staff_id}`,
    notes: api.notes ?? null,
  };
}

export async function getPayments(): Promise<Payment[]> {
  const response = await request<Paginated<ApiPayment>>('/payments', {
    params: { page: 1, limit: PAYMENTS_FETCH_LIMIT },
  });
  return response.data.map(mapApiPaymentToPayment);
}

export async function getPaymentsReport(filters: PaymentsReportFilters = {}): Promise<Payment[]> {
  const params: Record<string, unknown> = { page: 1, limit: PAYMENTS_FETCH_LIMIT };
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.method && filters.method !== 'all') params.method = filters.method;
  if (filters.status && filters.status !== 'all') params.status = filters.status;
  if (filters.query) params.q = filters.query;

  const response = await request<Paginated<ApiPayment>>('/payments', {
    params,
  });
  return response.data.map(mapApiPaymentToPayment);
}

export async function createPayment(input: CreatePaymentInput): Promise<CreatePaymentResponse> {
  return request<CreatePaymentResponse>('/payments', {
    method: 'POST',
    body: input,
    idempotencyKey: newIdempotencyKey(),
  });
}

