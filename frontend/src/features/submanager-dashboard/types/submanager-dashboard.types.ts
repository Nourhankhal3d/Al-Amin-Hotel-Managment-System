export type PaymentMethod = 'instapay' | 'cash' | 'vodafone_cash';

export type ExpenseSource =
  | 'cleaning_supplies'
  | 'maintenance_supplies'
  | 'electricity'
  | 'emergency';

export interface FinancialBreakdown {
  id: PaymentMethod | ExpenseSource;
  amount: number;
}

export interface SubManagerDashboardSummary {
  chartDate: string;
  transactionCount: number;
  expenseRecordCount: number;
  operationCount: number;
  revenueTotal: number;
  expenseTotal: number;
  netAmount: number;
  refundedTotal: number;
  chart: {
    points: number[];
    hours: number[];
  };
  paymentMethods: FinancialBreakdown[];
  expenseSources: FinancialBreakdown[];
  // TODO confirm with backend: response shape, shift-hour grouping, and refund accounting.
}