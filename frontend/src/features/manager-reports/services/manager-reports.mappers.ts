// Mappers for Manager Reports (DTO -> UI Model)

import type { ReportAggregatedDto } from '../types/manager-reports.dto';
import type {
  ReportSnapshot,
  PaymentSplitItem,
  MonthlySeriesItem,
  ExpenseCategoryItem,
  RoomsPerformance,
} from '../types/manager-reports.types';
import {
  PAYMENT_METHOD_COLORS,
  EXPENSE_CATEGORY_COLORS,
} from '../constants/reports.constants';
import { formatDate } from '../../../utils/date';
import { formatNumber } from '../../../utils/format';

/**
 * Distributes percentage points so the array of integer percentages
 * strictly sums to 100 (Largest Remainder Method).
 */
export function computeIntegerPercentagesTo100(amounts: number[]): number[] {
  const total = amounts.reduce((sum, a) => sum + Math.max(0, a), 0);
  if (total <= 0) {
    if (amounts.length === 0) return [];
    const equalShare = Math.floor(100 / amounts.length);
    const remainder = 100 - equalShare * amounts.length;
    return amounts.map((_, i) => equalShare + (i < remainder ? 1 : 0));
  }

  const rawPercentages = amounts.map((a) => (Math.max(0, a) / total) * 100);
  const floors = rawPercentages.map((p) => Math.floor(p));
  const currentSum = floors.reduce((s, p) => s + p, 0);
  const remainder = 100 - currentSum;

  const fractionalParts = rawPercentages.map((p, index) => ({
    index,
    frac: p - floors[index],
  }));

  fractionalParts.sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let i = 0; i < remainder && i < fractionalParts.length; i++) {
    result[fractionalParts[i].index] += 1;
  }

  return result;
}

export function mapAggregatedDtoToSnapshot(
  dto: ReportAggregatedDto,
  language: 'ar' | 'en' = 'ar',
): ReportSnapshot {
  const isAr = language === 'ar';

  // 1. Payment Split (Cash, Instapay, Vodafone Cash)
  const cashAmount = dto.payment_methods.cash;
  const instapayAmount = dto.payment_methods.instapay;
  const vodafoneAmount = dto.payment_methods.vodafone_cash;

  const paymentPercentages = computeIntegerPercentagesTo100([
    cashAmount,
    instapayAmount,
    vodafoneAmount,
  ]);

  const paymentSplit: PaymentSplitItem[] = [
    {
      id: 'cash',
      label: isAr ? 'نقدي' : 'Cash',
      amount: cashAmount,
      percentage: paymentPercentages[0] ?? 42,
      color: PAYMENT_METHOD_COLORS.cash,
    },
    {
      id: 'instapay',
      label: isAr ? 'إنستاباي' : 'Instapay',
      amount: instapayAmount,
      percentage: paymentPercentages[1] ?? 34,
      color: PAYMENT_METHOD_COLORS.instapay,
    },
    {
      id: 'vodafone',
      label: isAr ? 'فودافون كاش' : 'Vodafone Cash',
      amount: vodafoneAmount,
      percentage: paymentPercentages[2] ?? 24,
      color: PAYMENT_METHOD_COLORS.vodafone,
    },
  ];

  // 2. 12 Monthly Bars
  const monthlySeries: MonthlySeriesItem[] = dto.monthly_bars.map(
    (bar, index) => ({
      month: isAr ? bar.month_name_ar : bar.month_name_en,
      monthIndex: index,
      revenue: bar.revenue,
      expenses: bar.expenses,
      net: bar.net_profit,
    }),
  );

  // 3. Expense Categories (Percentages strictly sum to 100)
  const categoryAmounts = dto.expense_categories.map((c) => c.amount);
  const categoryPercentages = computeIntegerPercentagesTo100(categoryAmounts);

  const expenseCategories: ExpenseCategoryItem[] = dto.expense_categories.map(
    (c, i) => {
      const catKey = c.category.toLowerCase();
      let color: string = EXPENSE_CATEGORY_COLORS.cleaning;
      if (catKey.includes('util') || catKey.includes('كهرباء') || catKey.includes('مياه')) {
        color = EXPENSE_CATEGORY_COLORS.utilities;
      } else if (catKey.includes('maint') || catKey.includes('صيانة')) {
        color = EXPENSE_CATEGORY_COLORS.maintenance;
      } else if (catKey.includes('emerg') || catKey.includes('طوارئ') || catKey.includes('other')) {
        color = EXPENSE_CATEGORY_COLORS.emergency;
      }

      return {
        id: c.category,
        label: isAr ? c.category_label_ar : c.category_label_en,
        amount: c.amount,
        percentage: categoryPercentages[i] ?? 0,
        color,
      };
    },
  );

  // 4. Rooms Performance
  const vipRev = dto.rooms_performance.vip.revenue;
  const standardRev = dto.rooms_performance.standard.revenue;

  const vipFormattedRev = isAr
    ? `${formatNumber(Math.round(vipRev / 1000), language)} ألف ج.م`
    : `${formatNumber(Math.round(vipRev / 1000), language)}k EGP`;

  const standardFormattedRev = isAr
    ? `${formatNumber(Math.round(standardRev / 1000), language)} ألف ج.م`
    : `${formatNumber(Math.round(standardRev / 1000), language)}k EGP`;

  const roomsPerformance: RoomsPerformance = {
    vip: {
      category: 'vip',
      label: isAr ? 'غرف VIP' : 'VIP Rooms',
      rooms: dto.rooms_performance.vip.rooms_count,
      occupancy: dto.rooms_performance.vip.occupancy_rate,
      revenue: vipRev,
      formattedRevenue: vipFormattedRev,
    },
    standard: {
      category: 'standard',
      label: isAr ? 'الغرف العادية' : 'Standard Rooms',
      rooms: dto.rooms_performance.standard.rooms_count,
      occupancy: dto.rooms_performance.standard.occupancy_rate,
      revenue: standardRev,
      formattedRevenue: standardFormattedRev,
    },
  };

  return {
    period: dto.period,
    periodEndDate: dto.date,
    formattedEndDate: formatDate(dto.date, language) || dto.date,
    totals: {
      revenue: dto.revenue,
      expenses: dto.expenses,
      netProfit: dto.net_profit,
      margin: dto.margin_percentage,
      avgOccupancy: dto.occupancy_rate,
      transactions: dto.transactions_count,
      completedTasks: dto.completed_tasks_count,
      occupiedRooms: dto.occupied_rooms,
      totalRooms: dto.total_rooms,
      revenueChange: dto.revenue_change_percentage,
    },
    paymentSplit,
    monthlySeries,
    expenseCategories,
    roomsPerformance,
  };
}
