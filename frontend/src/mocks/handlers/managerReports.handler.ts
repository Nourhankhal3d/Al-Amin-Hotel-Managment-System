// Mock Service Worker Handlers for Manager Reports
// Implements Manager API Contract v1.2 endpoints and /mock-only/ reports endpoints

import { http, HttpResponse, delay } from 'msw';
import type {
  DailyClosingHistoryDto,
  DashboardRevenueResponseDto,
  DashboardOverviewResponseDto,
  ReportAggregatedDto,
  MonthlyBarDto,
  ExpenseCategoryShareDto,
} from '../../features/manager-reports/types/manager-reports.dto';
import {
  REPORTS_BUSINESS_DATE,
  MONTH_NAMES_AR,
  MONTH_NAMES_EN,
} from '../../features/manager-reports/constants/reports.constants';

const API = '/api/v1';

function shouldMockError(requestUrl: string): boolean {
  try {
    const reqUrl = new URL(requestUrl);
    if (reqUrl.searchParams.get('mockError') === '1') return true;
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined' && window.location) {
    try {
      const pageUrl = new URL(window.location.href);
      if (pageUrl.searchParams.get('mockError') === '1') return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function getMockDelay(requestUrl: string): number {
  try {
    const reqUrl = new URL(requestUrl);
    const d = reqUrl.searchParams.get('mockDelay');
    if (d && !Number.isNaN(Number(d))) return Number(d);
  } catch {
    // ignore
  }
  return 80;
}

function mockErrorResponse() {
  return HttpResponse.json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'خطأ اختباري في بوابة التقارير (mockError=1)',
        details: { field: 'mockError', issue: 'forced_test_error' },
      },
    },
    { status: 400 },
  );
}

// ===================== SEED DATA =====================
// Daily seed from master instructions:
// Revenue 24,850; Expenses 3,850; Net 21,000; Margin 84.5%; Avg Occupancy 64% (23 of 36 rooms)
// VIP 76% (15 rooms, 398k EGP); Standard 67% (21 rooms, 286k EGP); 18 transactions; 9 tasks
// Payment split: cash 42% (10,437), instapay 34% (8,449), vodafone 24% (5,964)
// Expense categories: Cleaning 1,250, Utilities 1,200, Maintenance 950, Emergency 450 (sum = 3,850)

export const BASE_MONTHLY_BARS: MonthlyBarDto[] = [
  { month: '01', month_name_ar: MONTH_NAMES_AR[0], month_name_en: MONTH_NAMES_EN[0], revenue: 18500, expenses: 3200, net_profit: 15300 },
  { month: '02', month_name_ar: MONTH_NAMES_AR[1], month_name_en: MONTH_NAMES_EN[1], revenue: 20400, expenses: 3400, net_profit: 17000 },
  { month: '03', month_name_ar: MONTH_NAMES_AR[2], month_name_en: MONTH_NAMES_EN[2], revenue: 24850, expenses: 3850, net_profit: 21000 },
  { month: '04', month_name_ar: MONTH_NAMES_AR[3], month_name_en: MONTH_NAMES_EN[3], revenue: 27200, expenses: 4100, net_profit: 23100 },
  { month: '05', month_name_ar: MONTH_NAMES_AR[4], month_name_en: MONTH_NAMES_EN[4], revenue: 31500, expenses: 4600, net_profit: 26900 },
  { month: '06', month_name_ar: MONTH_NAMES_AR[5], month_name_en: MONTH_NAMES_EN[5], revenue: 35200, expenses: 5100, net_profit: 30100 },
  { month: '07', month_name_ar: MONTH_NAMES_AR[6], month_name_en: MONTH_NAMES_EN[6], revenue: 38900, expenses: 5400, net_profit: 33500 },
  { month: '08', month_name_ar: MONTH_NAMES_AR[7], month_name_en: MONTH_NAMES_EN[7], revenue: 42600, expenses: 5800, net_profit: 36800 },
  { month: '09', month_name_ar: MONTH_NAMES_AR[8], month_name_en: MONTH_NAMES_EN[8], revenue: 40100, expenses: 5500, net_profit: 34600 },
  { month: '10', month_name_ar: MONTH_NAMES_AR[9], month_name_en: MONTH_NAMES_EN[9], revenue: 36400, expenses: 5000, net_profit: 31400 },
  { month: '11', month_name_ar: MONTH_NAMES_AR[10], month_name_en: MONTH_NAMES_EN[10], revenue: 32800, expenses: 4700, net_profit: 28100 },
  { month: '12', month_name_ar: MONTH_NAMES_AR[11], month_name_en: MONTH_NAMES_EN[11], revenue: 38000, expenses: 5200, net_profit: 32800 },
];

export const mockDailyClosingsList: DailyClosingHistoryDto[] = [
  {
    closing_id: '6719b4a1f2e8c90012ab3450',
    business_date: REPORTS_BUSINESS_DATE,
    status: 'OPEN',
    cash_total: 5850.0,
    instapay_total: 11800.0,
    vodafone_cash_total: 7200.0,
    gross_revenue: 32050.0,
    refunds_total: 7200.0,
    total_revenue: 24850.0,
    transactions_count: 18,
    opened_at: `${REPORTS_BUSINESS_DATE}T08:00:00+03:00`,
    closed_at: null,
  },
  {
    closing_id: '6719b4a1f2e8c90012ab3449',
    business_date: '2025-06-17',
    status: 'CLOSED',
    cash_total: 6200.0,
    instapay_total: 10500.0,
    vodafone_cash_total: 5400.0,
    gross_revenue: 22100.0,
    refunds_total: 0.0,
    total_revenue: 22100.0,
    transactions_count: 15,
    opened_at: '2025-06-17T08:00:00+03:00',
    closed_at: '2025-06-17T23:59:00+03:00',
  },
  {
    closing_id: '6719b4a1f2e8c90012ab3448',
    business_date: '2025-06-16',
    status: 'CLOSED',
    cash_total: 5100.0,
    instapay_total: 12400.0,
    vodafone_cash_total: 6100.0,
    gross_revenue: 23600.0,
    refunds_total: 1200.0,
    total_revenue: 22400.0,
    transactions_count: 16,
    opened_at: '2025-06-16T08:00:00+03:00',
    closed_at: '2025-06-16T23:59:00+03:00',
  },
];

export const mockDashboardRevenue: DashboardRevenueResponseDto = {
  comparison_percentage: 12.4,
  trend: [
    { date: '2025-06-12', revenue: 19800 },
    { date: '2025-06-13', revenue: 21500 },
    { date: '2025-06-14', revenue: 23200 },
    { date: '2025-06-15', revenue: 21900 },
    { date: '2025-06-16', revenue: 22400 },
    { date: '2025-06-17', revenue: 22100 },
    { date: '2025-06-18', revenue: 24850 },
  ],
  payment_methods: {
    cash: 5850.0,
    instapay: 11800.0,
    vodafone_cash: 7200.0,
  },
};

export const mockDashboardOverview: DashboardOverviewResponseDto = {
  rooms_total: 36,
  rooms_occupied: 23,
  occupancy_rate: 64,
  daily_revenue: 24850.0,
  by_floor: {
    '1': { total: 12, occupied: 8, rate: 67 },
    '2': { total: 12, occupied: 9, rate: 75 },
    '3': { total: 12, occupied: 6, rate: 50 },
  },
  by_type: {
    standard: { total: 21, occupied: 14, rate: 67 },
    vip: { total: 15, occupied: 9, rate: 76 },
  },
};

/**
 * Deterministically generates an aggregated report snapshot based on:
 * - Period: daily (1x), weekly (7x), monthly (30x), yearly (sum of 12 months)
 * - Filters: floor, room_type, shift, payment_method, expense_category
 */
export function generateAggregatedReport(params: {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date?: string;
  floor?: string;
  room_type?: string;
  shift?: string;
  room_status?: string;
  payment_method?: string;
  expense_category?: string;
}): ReportAggregatedDto {
  const period = params.period ?? 'daily';
  const date = params.date ?? REPORTS_BUSINESS_DATE;

  // 1. Period scaling factor
  let periodMultiplier = 1;
  let yearlyRevenueSum = 0;
  let yearlyExpensesSum = 0;
  for (const b of BASE_MONTHLY_BARS) {
    yearlyRevenueSum += b.revenue;
    yearlyExpensesSum += b.expenses;
  }

  if (period === 'weekly') {
    periodMultiplier = 7;
  } else if (period === 'monthly') {
    periodMultiplier = 30;
  } else if (period === 'yearly') {
    periodMultiplier = yearlyRevenueSum / 24850;
  }

  // 2. Filter scaling factor
  let filterFactor = 1.0;
  if (params.floor && params.floor !== 'ALL') {
    filterFactor *= 0.35;
  }
  if (params.room_type && params.room_type !== 'ALL') {
    filterFactor *= params.room_type.toLowerCase() === 'vip' ? 0.58 : 0.42;
  }
  if (params.shift && params.shift !== 'ALL') {
    filterFactor *= 0.45;
  }
  if (params.payment_method && params.payment_method !== 'ALL') {
    filterFactor *= 0.5;
  }
  if (params.expense_category && params.expense_category !== 'ALL') {
    filterFactor *= 0.4;
  }

  const effectiveMultiplier = periodMultiplier * filterFactor;

  // Base metrics
  const baseRevenue = 24850;
  const baseExpenses = 3850;
  const baseTxCount = 18;
  const baseTasksCount = 9;

  let revenue = Math.round(baseRevenue * effectiveMultiplier);
  let expenses = Math.round(baseExpenses * effectiveMultiplier);
  if (period === 'yearly' && filterFactor === 1.0) {
    revenue = yearlyRevenueSum;
    expenses = yearlyExpensesSum;
  }

  const net_profit = revenue - expenses;
  const margin_percentage = revenue > 0 ? Number(((net_profit / revenue) * 100).toFixed(1)) : 84.5;
  const transactions_count = Math.max(1, Math.round(baseTxCount * effectiveMultiplier));
  const completed_tasks_count = Math.max(1, Math.round(baseTasksCount * effectiveMultiplier));

  // Occupancy metrics
  const total_rooms = 36;
  const occupied_rooms = Math.min(36, Math.max(1, Math.round(23 * Math.min(1.2, Math.max(0.6, filterFactor)))));
  const occupancy_rate = Math.round((occupied_rooms / total_rooms) * 100);

  // Payment split amounts (cash 42%, instapay 34%, vodafone 24%)
  let cashAmount = Math.round(revenue * 0.42);
  let instapayAmount = Math.round(revenue * 0.34);
  let vodafoneAmount = revenue - cashAmount - instapayAmount;

  if (params.payment_method && params.payment_method !== 'ALL') {
    const pm = params.payment_method.toUpperCase();
    if (pm === 'CASH') {
      cashAmount = revenue;
      instapayAmount = 0;
      vodafoneAmount = 0;
    } else if (pm === 'INSTAPAY') {
      cashAmount = 0;
      instapayAmount = revenue;
      vodafoneAmount = 0;
    } else if (pm.includes('VODAFONE')) {
      cashAmount = 0;
      instapayAmount = 0;
      vodafoneAmount = revenue;
    }
  }

  // Expense categories (Cleaning 1250, Utilities 1200, Maintenance 950, Emergency 450)
  const baseCatCleaning = Math.round(expenses * (1250 / 3850));
  const baseCatUtilities = Math.round(expenses * (1200 / 3850));
  const baseCatMaintenance = Math.round(expenses * (950 / 3850));
  const baseCatEmergency = expenses - baseCatCleaning - baseCatUtilities - baseCatMaintenance;

  const expense_categories: ExpenseCategoryShareDto[] = [
    {
      category: 'cleaning',
      category_label_ar: 'مستلزمات تنظيف',
      category_label_en: 'Cleaning Supplies',
      amount: baseCatCleaning,
    },
    {
      category: 'utilities',
      category_label_ar: 'كهرباء ومياه',
      category_label_en: 'Utilities',
      amount: baseCatUtilities,
    },
    {
      category: 'maintenance',
      category_label_ar: 'مستلزمات صيانة',
      category_label_en: 'Maintenance Supplies',
      amount: baseCatMaintenance,
    },
    {
      category: 'emergency',
      category_label_ar: 'أخرى',
      category_label_en: 'Other',
      amount: baseCatEmergency,
    },
  ];

  // 12 Monthly Bars scaled by filterFactor
  const monthly_bars: MonthlyBarDto[] = BASE_MONTHLY_BARS.map((bar) => {
    const barRev = Math.round(bar.revenue * filterFactor);
    const barExp = Math.round(bar.expenses * filterFactor);
    return {
      month: bar.month,
      month_name_ar: bar.month_name_ar,
      month_name_en: bar.month_name_en,
      revenue: barRev,
      expenses: barExp,
      net_profit: barRev - barExp,
    };
  });

  // Rooms performance (VIP 15 rooms 76% 398k, Standard 21 rooms 67% 286k)
  const vipRevBase = period === 'daily' ? 398000 : Math.round(398000 * (periodMultiplier / 1.0));
  const standardRevBase = period === 'daily' ? 286000 : Math.round(286000 * (periodMultiplier / 1.0));

  const rooms_performance = {
    vip: {
      rooms_count: 15,
      occupancy_rate: 76,
      revenue: Math.round(vipRevBase * filterFactor),
    },
    standard: {
      rooms_count: 21,
      occupancy_rate: 67,
      revenue: Math.round(standardRevBase * filterFactor),
    },
  };

  return {
    period,
    date,
    revenue,
    revenue_change_percentage: 12.4,
    expenses,
    net_profit,
    margin_percentage,
    occupancy_rate,
    occupied_rooms,
    total_rooms,
    transactions_count,
    completed_tasks_count,
    payment_methods: {
      cash: cashAmount,
      instapay: instapayAmount,
      vodafone_cash: vodafoneAmount,
    },
    monthly_bars,
    expense_categories,
    rooms_performance,
  };
}

// ===================== HANDLERS EXPORT =====================

export const managerReportsHandlers = [
  // 1. GET /daily-closings (history with limit and date range)
  http.get(`${API}/daily-closings`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    let filtered = [...mockDailyClosingsList];
    if (startDate) {
      filtered = filtered.filter((c) => c.business_date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((c) => c.business_date <= endDate);
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return HttpResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    });
  }),

  // 2. GET /dashboard/revenue
  http.get(`${API}/dashboard/revenue`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    return HttpResponse.json({
      data: mockDashboardRevenue,
    });
  }),

  // 3. GET /dashboard/overview
  http.get(`${API}/dashboard/overview`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    return HttpResponse.json({
      data: mockDashboardOverview,
    });
  }),

  // 4. GET /mock-only/reports/aggregated
  http.get(`${API}/mock-only/reports/aggregated`, async ({ request }) => {
    if (shouldMockError(request.url)) return mockErrorResponse();
    await delay(getMockDelay(request.url));

    const url = new URL(request.url);
    const period = (url.searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly';
    const date = url.searchParams.get('date') || REPORTS_BUSINESS_DATE;
    const floor = url.searchParams.get('floor') || undefined;
    const room_type = url.searchParams.get('room_type') || undefined;
    const shift = url.searchParams.get('shift') || undefined;
    const room_status = url.searchParams.get('room_status') || undefined;
    const payment_method = url.searchParams.get('payment_method') || undefined;
    const expense_category = url.searchParams.get('expense_category') || undefined;

    const report = generateAggregatedReport({
      period,
      date,
      floor,
      room_type,
      shift,
      room_status,
      payment_method,
      expense_category,
    });

    return HttpResponse.json({
      data: report,
    });
  }),
];
