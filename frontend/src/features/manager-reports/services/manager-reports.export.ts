import { exportCsv, type CsvColumn } from '../../../utils/exportCsv';
import type { ReportSnapshot } from '../types/manager-reports.types';

export interface ReportSummaryRow {
  section: string;
  metric: string;
  value: string | number;
  notes?: string | number;
}

export interface ReportChartRow {
  section: string;
  name: string;
  revenue: number;
  secondaryMetric: string | number; // expenses or occupancy
  netOrDetails: string | number; // net profit or rooms count
}

/**
 * Downloads a comprehensive summary CSV of the current report:
 * Totals, Margins, Occupancy, Payment Splits, and Expense Categories.
 */
export function exportReportSummary(snapshot: ReportSnapshot, language: 'ar' | 'en' = 'ar'): boolean {
  const isAr = language === 'ar';

  const rows: ReportSummaryRow[] = [
    // 1. Core KPIs
    {
      section: isAr ? 'المؤشرات الرئيسية' : 'Core KPIs',
      metric: isAr ? 'إجمالي الإيرادات' : 'Total Revenue',
      value: snapshot.totals.revenue,
      notes: isAr ? 'جنيه مصري' : 'EGP',
    },
    {
      section: isAr ? 'المؤشرات الرئيسية' : 'Core KPIs',
      metric: isAr ? 'إجمالي المصروفات' : 'Total Expenses',
      value: snapshot.totals.expenses,
      notes: isAr ? 'جنيه مصري' : 'EGP',
    },
    {
      section: isAr ? 'المؤشرات الرئيسية' : 'Core KPIs',
      metric: isAr ? 'صافي الربح' : 'Net Profit',
      value: snapshot.totals.netProfit,
      notes: isAr ? 'جنيه مصري' : 'EGP',
    },
    {
      section: isAr ? 'المؤشرات الرئيسية' : 'Core KPIs',
      metric: isAr ? 'هامش الربح' : 'Profit Margin',
      value: `${snapshot.totals.margin}%`,
      notes: isAr ? 'أداء مالي صحي' : 'Healthy Performance',
    },
    {
      section: isAr ? 'المؤشرات الرئيسية' : 'Core KPIs',
      metric: isAr ? 'متوسط الإشغال' : 'Average Occupancy',
      value: `${snapshot.totals.avgOccupancy}%`,
      notes: isAr ? 'من إجمالي الغرف' : 'Total Rooms',
    },
    {
      section: isAr ? 'المؤشرات الرئيسية' : 'Core KPIs',
      metric: isAr ? 'المعاملات والمهام' : 'Transactions & Tasks',
      value: snapshot.totals.transactions,
      notes: isAr ? `${snapshot.totals.completedTasks} مهام مكتملة` : `${snapshot.totals.completedTasks} completed tasks`,
    },

    // 2. Payment Method Split
    ...snapshot.paymentSplit.map((p) => ({
      section: isAr ? 'توزيع طرق الدفع' : 'Payment Methods',
      metric: p.label,
      value: p.amount,
      notes: `${p.percentage}%`,
    })),

    // 3. Expense Categories Breakdown
    ...snapshot.expenseCategories.map((c) => ({
      section: isAr ? 'فئات المصروفات' : 'Expense Categories',
      metric: c.label,
      value: c.amount,
      notes: `${c.percentage}%`,
    })),
  ];

  const columns: CsvColumn<ReportSummaryRow>[] = [
    { header: isAr ? 'القسم' : 'Section', value: (r) => r.section },
    { header: isAr ? 'البند / المؤشر' : 'Metric / Item', value: (r) => r.metric },
    { header: isAr ? 'القيمة' : 'Value', value: (r) => r.value },
    { header: isAr ? 'الملاحظات / النسبة' : 'Notes / Ratio', value: (r) => r.notes ?? '' },
  ];

  const fileName = `report-summary-${snapshot.period}-${snapshot.periodEndDate}.csv`;
  return exportCsv(rows, columns, fileName);
}

/**
 * Downloads chart and performance series data:
 * 12 Monthly Bars (Revenue, Expenses, Net) and Room Category Performances (VIP & Standard).
 */
export function exportReportChartData(snapshot: ReportSnapshot, language: 'ar' | 'en' = 'ar'): boolean {
  const isAr = language === 'ar';

  const rows: ReportChartRow[] = [
    // 1. 12 Monthly Bars
    ...snapshot.monthlySeries.map((m) => ({
      section: isAr ? 'الاتجاه الشهري' : 'Monthly Trend',
      name: m.month,
      revenue: m.revenue,
      secondaryMetric: m.expenses,
      netOrDetails: m.net,
    })),

    // 2. Room Category Performance
    {
      section: isAr ? 'أداء الغرف' : 'Rooms Performance',
      name: isAr ? 'غرف VIP' : 'VIP Rooms',
      revenue: snapshot.roomsPerformance.vip?.revenue ?? 0,
      secondaryMetric: `${snapshot.roomsPerformance.vip?.occupancy ?? 0}%`,
      netOrDetails: isAr
        ? `${snapshot.roomsPerformance.vip?.rooms ?? 0} غرفة`
        : `${snapshot.roomsPerformance.vip?.rooms ?? 0} rooms`,
    },
    {
      section: isAr ? 'أداء الغرف' : 'Rooms Performance',
      name: isAr ? 'الغرف العادية' : 'Standard Rooms',
      revenue: snapshot.roomsPerformance.standard?.revenue ?? 0,
      secondaryMetric: `${snapshot.roomsPerformance.standard?.occupancy ?? 0}%`,
      netOrDetails: isAr
        ? `${snapshot.roomsPerformance.standard?.rooms ?? 0} غرفة`
        : `${snapshot.roomsPerformance.standard?.rooms ?? 0} rooms`,
    },
  ];

  const columns: CsvColumn<ReportChartRow>[] = [
    { header: isAr ? 'القسم' : 'Section', value: (r) => r.section },
    { header: isAr ? 'البيان / الشهر' : 'Item / Month', value: (r) => r.name },
    { header: isAr ? 'الإيرادات (ج.م)' : 'Revenue (EGP)', value: (r) => r.revenue },
    { header: isAr ? 'المصروفات / نسبة الإشغال' : 'Expenses / Occupancy', value: (r) => r.secondaryMetric },
    { header: isAr ? 'صافي الربح / عدد الغرف' : 'Net Profit / Rooms Count', value: (r) => r.netOrDetails },
  ];

  const fileName = `report-chart-data-${snapshot.period}-${snapshot.periodEndDate}.csv`;
  return exportCsv(rows, columns, fileName);
}
