// Manager Finance Raw API DTOs & Contract Envelopes
// Based on Manager API Contract v1.2

import type {
  PaymentMethodCode,
  TransactionStatusCode,
  TransactionTypeCode,
  ExpenseCategoryCode,
} from '../constants/finance.constants';

// ===================== 1. ENVELOPES =====================

export interface MetaPaginationDto {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ListEnvelopeDto<T> {
  data: T[];
  meta: MetaPaginationDto;
}

export interface SingleEnvelopeDto<T> {
  data: T;
}

export interface ApiErrorEnvelopeDto {
  error: {
    code: string;
    message: string;
    details?: {
      field?: string;
      issue?: string;
    };
  };
}

// ===================== 2. GET /payments =====================

export interface FinancePaymentDto {
  payment_id: string; // 24-hex string
  transaction_number: string; // e.g. "PAY-8421"
  booking_id?: string | null;
  room_number?: string | null;
  guest_name?: string | null;
  amount: number;
  currency: string; // "EGP"
  method: PaymentMethodCode;
  type: TransactionTypeCode;
  status: TransactionStatusCode;
  shift_id?: number | null;
  shift_type?: 'morning' | 'evening' | 'night' | null;
  staff_id: string;
  staff_name: string;
  notes?: string | null;
  created_at: string; // ISO 8601 with +03:00
  business_date: string; // YYYY-MM-DD
  refund_reason?: string | null;
  refund_request_id?: string | null; // e.g. "RF-128"
}

export interface PaymentsQueryFiltersDto {
  date?: string;
  shift?: string;
  method?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// ===================== 3. GET /daily-closings/current =====================

export interface DailyClosingCurrentDto {
  closing_id: string;
  business_date: string;
  status: 'OPEN' | 'CLOSED';
  cash_total: number;
  instapay_total: number;
  vodafone_cash_total: number;
  gross_revenue: number;
  refunds_total: number;
  total_revenue: number; // gross_revenue - refunds_total
  transactions_count: number;
  opened_at: string;
  closed_at: string | null;
}

// ===================== 4. /mock-only/ EXPENSES =====================
// Not in contract v1.2 — served via /mock-only/endpoints. TODO confirm with backend.

export interface FinanceExpenseDto {
  expense_id: string; // e.g. "EXP-108"
  description: string;
  category: ExpenseCategoryCode;
  amount: number;
  currency: string; // "EGP"
  recorded_by_staff_id: string;
  recorded_by_staff_name: string;
  business_date: string;
  created_at: string;
  notes?: string | null;
  invoice_url?: string | null;
}

export interface ExpensesQueryFiltersDto {
  date?: string;
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateExpenseDto {
  description?: string;
  category?: ExpenseCategoryCode;
  amount?: number;
  notes?: string | null;
}

// ===================== 5. /mock-only/ HOURLY REVENUE =====================
// Shift hourly revenue breakdown for Finance chart. TODO confirm with backend.

export interface HourlyRevenueDto {
  business_date: string;
  hours: string[];
  points: number[];
}

// ===================== 6. /mock-only/ PAYMENT STATUS UPDATE =====================
// Note: Contract v1.2 specifies payments are immutable; status edit is a UI mock-only feature.

export interface UpdatePaymentStatusDto {
  status: TransactionStatusCode;
  reason?: string;
}
