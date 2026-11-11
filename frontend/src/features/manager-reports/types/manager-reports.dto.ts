// Raw DTOs and API Contract Envelopes for Manager Reports
// Based on Manager API Contract v1.2 and /mock-only/ aggregated reports endpoint

// ===================== 1. CONTRACT ENVELOPES =====================

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

// ===================== 2. GET /daily-closings =====================

export interface DailyClosingHistoryDto {
  closing_id: string; // 24-hex string
  business_date: string; // YYYY-MM-DD
  status: 'OPEN' | 'CLOSED';
  cash_total: number;
  instapay_total: number;
  vodafone_cash_total: number;
  gross_revenue: number;
  refunds_total: number;
  total_revenue: number; // gross_revenue - refunds_total
  transactions_count: number;
  opened_at: string; // ISO 8601
  closed_at: string | null;
}

export interface DailyClosingsQueryDto {
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  limit?: number; // default 20, max 100: always pass limit
  page?: number;
}

// ===================== 3. GET /dashboard/revenue?days= =====================

export interface DashboardRevenueTrendDto {
  date: string; // YYYY-MM-DD
  revenue: number;
}

export interface DashboardRevenueResponseDto {
  comparison_percentage: number; // e.g. 12.4
  trend: DashboardRevenueTrendDto[];
  payment_methods: {
    cash: number;
    instapay: number;
    vodafone_cash: number;
    card?: number;
  };
}

// ===================== 4. GET /dashboard/overview =====================

export interface FloorOccupancyDto {
  total: number;
  occupied: number;
  rate: number;
}

export interface RoomTypeOccupancyDto {
  total: number;
  occupied: number;
  rate: number;
}

export interface DashboardOverviewResponseDto {
  rooms_total: number; // 36 in seed
  rooms_occupied: number; // 23 in seed
  occupancy_rate: number; // 64% in seed
  by_floor: Record<string, FloorOccupancyDto>;
  by_type: Record<string, RoomTypeOccupancyDto>;
  daily_revenue: number;
}

// ===================== 5. /mock-only/reports/aggregated =====================
// Not in contract v1.2 — served via /mock-only/ mock handler. TODO confirm with backend.

export interface MonthlyBarDto {
  month: string; // "01", "02", ...
  month_name_ar: string; // "يناير", "فبراير", ...
  month_name_en: string; // "Jan", "Feb", ...
  revenue: number;
  expenses: number;
  net_profit: number;
}

export interface ExpenseCategoryShareDto {
  category: string; // "cleaning", "maintenance", "utilities", "emergency"
  category_label_ar: string;
  category_label_en: string;
  amount: number;
}

export interface CategoryPerformanceDto {
  rooms_count: number;
  occupancy_rate: number; // 76 for VIP, 67 for standard
  revenue: number; // 398,000 for VIP, 286,000 for standard
}

export interface ReportAggregatedDto {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string; // YYYY-MM-DD (e.g. "2025-06-18")
  revenue: number; // e.g. 24850
  revenue_change_percentage: number; // e.g. +12.4
  expenses: number; // e.g. 3850
  net_profit: number; // e.g. 21000
  margin_percentage: number; // e.g. 84.5
  occupancy_rate: number; // e.g. 64
  occupied_rooms: number; // e.g. 23
  total_rooms: number; // e.g. 36
  transactions_count: number; // e.g. 18
  completed_tasks_count: number; // e.g. 9
  payment_methods: {
    cash: number; // 42%
    instapay: number; // 34%
    vodafone_cash: number; // 24%
  };
  monthly_bars: MonthlyBarDto[]; // 12 monthly bars
  expense_categories: ExpenseCategoryShareDto[];
  rooms_performance: {
    vip: CategoryPerformanceDto;
    standard: CategoryPerformanceDto;
  };
}

export interface ReportsQueryFiltersDto {
  date?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  floor?: string;
  room_type?: string;
  shift?: string;
  room_status?: string;
  payment_method?: string;
  expense_category?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  page?: number;
}
