// UI Models for Manager Finance
// Decoupled from raw API contract shapes; consumable by UI components

export type UiPaymentMethod = 'cash' | 'instapay' | 'vodafone' | 'card';
export type UiTransactionType = 'booking' | 'service' | 'refund' | 'deposit';
export type UiTransactionStatus = 'completed' | 'pending' | 'refunded' | 'cancelled';
export type UiExpenseCategory = 'cleaning' | 'maintenance' | 'utilities' | 'emergency' | 'other';

export interface FinanceTransaction {
  id: string;
  transactionNumber: string; // e.g. "PAY-8421"
  bookingId?: string;
  roomNumber: string;
  guestName: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  method: UiPaymentMethod;
  methodLabel: string;
  type: UiTransactionType;
  typeLabel: string;
  status: UiTransactionStatus;
  statusLabel: string;
  time: string; // HH:mm
  date: string; // formatted date
  isoDate: string;
  shiftId?: number;
  shiftName?: string;
  staffId: string;
  staffName: string;
  notes?: string;
  refundRequestId?: string; // e.g. "RF-128"
  refundReason?: string;
}

export interface FinanceTransactionList {
  transactions: FinanceTransaction[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface FinanceExpense {
  id: string;
  expenseNumber: string; // e.g. "EXP-108"
  description: string;
  category: UiExpenseCategory;
  categoryLabel: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  recordedByName: string;
  recordedById: string;
  time: string;
  date: string;
  isoDate: string;
  notes?: string;
  invoiceUrl?: string;
}

export interface FinanceExpenseList {
  expenses: FinanceExpense[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface MethodTotals {
  cash: number;
  instapay: number;
  vodafone: number;
  card: number;
}

export interface HourlyRevenueSeries {
  points: number[];
  labels: string[];
}

export interface FinanceSummary {
  revenue: number; // gross - refunded
  expenses: number;
  netProfit: number; // revenue - expenses
  refunded: number;
  transactionsCount: number;
  methodTotals: MethodTotals;
  hourlyRevenue: HourlyRevenueSeries;
}

export interface FinanceFilterState {
  tab: 'revenues' | 'expenses';
  search: string;
  method: string;
  status: string;
  category: string;
  page: number;
}
