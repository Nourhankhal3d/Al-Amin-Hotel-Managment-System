// UI Models for Manager Reports
// Decoupled from raw API contract shapes and ready for presentation components

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ReportFilters {
  date: string; // YYYY-MM-DD
  period: ReportPeriod;
  floor: string; // 'ALL', '1', '2', '3'
  roomType: string; // 'ALL', 'standard', 'vip', 'suite'
  shift: string; // 'ALL', 'morning', 'evening', 'night'
  roomStatus: string; // 'ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'
  paymentMethod: string; // 'ALL', 'CASH', 'INSTAPAY', 'VODAFONE_CASH'
  expenseCategory: string; // 'ALL', 'CLEANING', 'MAINTENANCE', 'UTILITIES', 'EMERGENCY'
}

export interface ReportTotals {
  revenue: number;
  expenses: number;
  netProfit: number;
  margin: number;
  avgOccupancy: number;
  transactions: number;
  completedTasks: number;
  occupiedRooms?: number;
  totalRooms?: number;
  revenueChange?: number;
}

export interface PaymentSplitItem {
  id: 'cash' | 'instapay' | 'vodafone';
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlySeriesItem {
  month: string; // e.g. "يناير" / "Jan"
  monthIndex: number; // 0..11
  revenue: number;
  expenses: number;
  net: number;
}

export interface ExpenseCategoryItem {
  id: string;
  label: string;
  amount: number;
  percentage: number; // strictly computed so all categories sum to 100
  color: string;
}

export interface RoomCategoryPerformance {
  category: 'vip' | 'standard';
  label: string;
  rooms: number;
  occupancy: number; // percentage (e.g. 76 for VIP, 67 for standard)
  revenue: number;
  formattedRevenue: string; // e.g. "398 ألف ج.م"
}

export interface RoomsPerformance {
  vip: RoomCategoryPerformance;
  standard: RoomCategoryPerformance;
}

export interface ReportSnapshot {
  period: ReportPeriod;
  periodEndDate: string; // YYYY-MM-DD (e.g. "2025-06-18")
  formattedEndDate: string; // e.g. "18 يونيو 2025"
  totals: ReportTotals;
  paymentSplit: PaymentSplitItem[];
  monthlySeries: MonthlySeriesItem[]; // exactly 12 items
  expenseCategories: ExpenseCategoryItem[]; // percentages sum to 100
  roomsPerformance: RoomsPerformance;
}

export interface FilterSelectOption<T = string> {
  value: T;
  label: string;
}

export interface ReportFilterOptions {
  periods: FilterSelectOption<ReportPeriod>[];
  floors: FilterSelectOption[];
  roomTypes: FilterSelectOption[];
  shifts: FilterSelectOption[];
  roomStatuses: FilterSelectOption[];
  paymentMethods: FilterSelectOption[];
  expenseCategories: FilterSelectOption[];
}
