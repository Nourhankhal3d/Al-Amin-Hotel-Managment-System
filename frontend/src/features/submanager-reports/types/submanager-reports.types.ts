export type ReportPeriod = 'day' | 'week' | 'month' | 'year';
export type ReportStatus = 'completed' | 'pending';
export type ReportType = 'revenue' | 'expense';

export interface ReportFilters {
  period: ReportPeriod;
  dateFrom: string;
  dateTo: string;
  category: string;
  status: '' | ReportStatus;
  paymentMethod: string;
  room: string;
  type: '' | ReportType;
  floor: string;
  roomType: string;
  roomStatus: string;
  shift: string;
}

export interface ReportTransaction {
  id: string;
  type: ReportType;
  category: string;
  description: string;
  room: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: ReportStatus;
  floor: string;
  roomType: string;
  roomStatus: string;
  shift: string;
}

export interface ReportBreakdown {
  id: string;
  amount: number;
}

export interface SubManagerReportsData {
  reportDate: string;
  transactionCount: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  collectionRate: number;
  revenueTrend: number;
  expensesTrend: number;
  profitTrend: number;
  collectionTrend: number;
  paymentBreakdown: ReportBreakdown[];
  expenseBreakdown: ReportBreakdown[];
  roomPerformance: Array<{ roomType: string; occupancy: number; rooms: number; revenue: number }>;
  revenueExpenseChart: Array<{ label: string; revenue: number; expenses: number }>;
  transactions: ReportTransaction[];
}
