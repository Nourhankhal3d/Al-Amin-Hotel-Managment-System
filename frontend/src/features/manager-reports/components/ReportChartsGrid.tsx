import { useLanguage } from '../../../core/i18n/useLanguage';
import type { ReportSnapshot } from '../types/manager-reports.types';
import { PaymentDistributionCard } from './PaymentDistributionCard';
import { RevenueTrendCard } from './RevenueTrendCard';
import { ExpenseCategoriesCard } from './ExpenseCategoriesCard';
import { RoomsPerformanceCard } from './RoomsPerformanceCard';
import './ReportChartsGrid.css';

export interface ReportChartsGridProps {
  snapshot: ReportSnapshot;
  className?: string;
}

export function ReportChartsGrid({
  snapshot,
  className = '',
}: ReportChartsGridProps) {
  const { t } = useLanguage();

  return (
    <section
      className={`report-charts-grid ${className}`.trim()}
      aria-label={t('manager.reports.charts.sectionTitle')}
    >
      {/* Row 1, Col 1 (Start / Wider): Revenue, Expenses & Net Trend */}
      <RevenueTrendCard snapshot={snapshot} />

      {/* Row 1, Col 2 (End / Narrower): Payment Method Distribution */}
      <PaymentDistributionCard snapshot={snapshot} />

      {/* Row 2, Col 1 (Start / Wider): Rooms Performance */}
      <RoomsPerformanceCard snapshot={snapshot} />

      {/* Row 2, Col 2 (End / Narrower): Operational Expense Categories */}
      <ExpenseCategoriesCard snapshot={snapshot} />
    </section>
  );
}
