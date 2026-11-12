import { useMemo } from 'react';
import { GroupedBarChart, type BarSeries } from '../../../components/common/GroupedBarChart';
import { useLanguage } from '../../../core/i18n/useLanguage';
import type { MonthlySeriesItem, ReportSnapshot } from '../types/manager-reports.types';
import './RevenueTrendCard.css';

export interface RevenueTrendCardProps {
  snapshot: ReportSnapshot;
  className?: string;
}

function computeTrendBadge(series: MonthlySeriesItem[], t: (k: string) => string): string {
  if (!series || series.length < 2) {
    return t('manager.reports.revenueExpensesNet.stableGrowth');
  }

  const half = Math.floor(series.length / 2);
  const firstHalfTotal = series.slice(0, half).reduce((sum, s) => sum + s.revenue, 0);
  const secondHalfTotal = series.slice(half).reduce((sum, s) => sum + s.revenue, 0);

  const firstAvg = firstHalfTotal / half;
  const secondAvg = secondHalfTotal / (series.length - half);

  if (firstAvg <= 0) return t('manager.reports.revenueExpensesNet.stableGrowth');

  const diffPct = ((secondAvg - firstAvg) / firstAvg) * 100;

  if (diffPct > 5) {
    return t('manager.reports.revenueExpensesNet.stableGrowth');
  } else if (diffPct < -5) {
    return t('manager.reports.revenueExpensesNet.decliningGrowth');
  }
  return t('manager.reports.revenueExpensesNet.balancedGrowth');
}

export function RevenueTrendCard({
  snapshot,
  className = '',
}: RevenueTrendCardProps) {
  const { t } = useLanguage();

  const monthlySeries = useMemo(() => snapshot.monthlySeries ?? [], [snapshot.monthlySeries]);

  // Trend badge text computed from series data
  const trendBadgeText = useMemo(() => {
    return computeTrendBadge(monthlySeries, t);
  }, [monthlySeries, t]);

  // 12 Category labels (already localized in monthlySeries)
  const categories = useMemo(() => {
    return monthlySeries.map((m) => m.month);
  }, [monthlySeries]);

  // Two series: Revenue (wide green) and Expenses (thin gold)
  const series: BarSeries[] = useMemo(() => {
    return [
      {
        key: 'revenue',
        label: t('manager.reports.reportCard.summary.totalRevenue'),
        values: monthlySeries.map((m) => m.revenue),
        tone: 'green',
        variant: 'wide',
      },
      {
        key: 'expenses',
        label: t('manager.reports.reportCard.summary.totalExpenses'),
        values: monthlySeries.map((m) => m.expenses),
        tone: 'gold',
        variant: 'thin',
      },
    ];
  }, [monthlySeries, t]);

  return (
    <article
      className={`revenue-trend-card ${className}`.trim()}
      aria-label={t('manager.reports.revenueExpensesNet.title')}
    >
      <GroupedBarChart
        title={t('manager.reports.revenueExpensesNet.title')}
        subtitle={t('manager.reports.revenueExpensesNet.subtitle')}
        categories={categories}
        series={series}
        height={195}
        badge={
          <span className="revenue-trend-card__badge" aria-label={trendBadgeText}>
            {trendBadgeText}
          </span>
        }
        showLegend={false}
        ariaLabel={t('manager.reports.revenueExpensesNet.title')}
      />
    </article>
  );
}
