// Constants for Manager Finance
// Based on Manager API Contract v1.2 and Figma 3-Finance designs

/** Fixed business date as specified in the seed (Africa/Cairo business date) */
export const FINANCE_BUSINESS_DATE = '2025-06-18';

/**
 * Payment method codes from the contract.
 * Contract values: CASH, INSTAPAY, VODAFONE_CASH, CARD.
 * The design features Cash, Instapay, and Vodafone Cash primarily.
 */
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  INSTAPAY: 'INSTAPAY',
  VODAFONE_CASH: 'VODAFONE_CASH',
  CARD: 'CARD',
} as const;

export type PaymentMethodCode = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

/**
 * Payment transaction statuses.
 * Design uses: completed, pending, refunded, cancelled.
 * TODO confirm with backend: contract does not define statuses for ledger entries.
 */
export const TRANSACTION_STATUSES = {
  COMPLETED: 'COMPLETED',
  PENDING: 'PENDING',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
} as const;

export type TransactionStatusCode = (typeof TRANSACTION_STATUSES)[keyof typeof TRANSACTION_STATUSES];

/**
 * Payment transaction categories / types.
 * Contract values: BOOKING, SERVICE, REFUND, DEPOSIT.
 */
export const TRANSACTION_TYPES = {
  BOOKING: 'BOOKING',
  SERVICE: 'SERVICE',
  REFUND: 'REFUND',
  DEPOSIT: 'DEPOSIT',
} as const;

export type TransactionTypeCode = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

/**
 * Expense categories.
 * Not in API contract v1.2; used for mock-only expenses tracking.
 * TODO confirm with backend.
 */
export const EXPENSE_CATEGORIES = {
  CLEANING: 'CLEANING',
  MAINTENANCE: 'MAINTENANCE',
  UTILITIES: 'UTILITIES',
  EMERGENCY: 'EMERGENCY',
  OTHER: 'OTHER',
} as const;

export type ExpenseCategoryCode = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES];
