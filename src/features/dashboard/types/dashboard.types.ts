export interface DashboardPaymentTotals {
  cash: number;
  instapay: number;
  vodafone_cash: number;
  total: number;
}

export interface DashboardSummary {
  total_rooms: number;
  rooms_by_status: Record<string, number>;
  rooms_needing_cleaning: number;
  open_maintenance_issues: number;
  shift_payments_total: DashboardPaymentTotals;
}