import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber, formatPercent } from '../../../utils/format';
import type { ReportSnapshot } from '../types/manager-reports.types';
import './ReportKpiCards.css';

export interface ReportKpiCardsProps {
  snapshot: ReportSnapshot;
  className?: string;
}

export function ReportKpiCards({ snapshot, className = '' }: ReportKpiCardsProps) {
  const { language, t } = useLanguage();

  const vipRevenueThousands = Math.round((snapshot.roomsPerformance.vip?.revenue ?? 0) / 1000);
  const standardRevenueThousands = Math.round((snapshot.roomsPerformance.standard?.revenue ?? 0) / 1000);

  const vipRevenueSubtext = t('manager.reports.kpis.revenueFormatted').replace(
    '{{amount}}',
    formatNumber(vipRevenueThousands, language),
  );

  const standardRevenueSubtext = t('manager.reports.kpis.revenueFormatted').replace(
    '{{amount}}',
    formatNumber(standardRevenueThousands, language),
  );

  const completedTasksSubtext = t('manager.reports.kpis.completedTasks').replace(
    '{{count}}',
    formatNumber(snapshot.totals.completedTasks, language),
  );

  return (
    <div className={`report-kpi-cards ${className}`.trim()} role="region" aria-label={t('manager.reports.hero.title')}>
      {/* 1. Profit Margin Card */}
      <div className="report-kpi-card">
        <span className="report-kpi-card__label">
          {t('manager.reports.kpis.profitMargin')}
        </span>
        <strong className="report-kpi-card__value">
          {formatPercent(snapshot.totals.margin, language)}
        </strong>
        <span className="report-kpi-card__hint">
          {t('manager.reports.kpis.healthyFinancialPerformance')}
        </span>
      </div>

      {/* 2. VIP Rooms Performance Card */}
      <div className="report-kpi-card">
        <span className="report-kpi-card__label">
          {t('manager.reports.kpis.vipRoomsPerformance')}
        </span>
        <strong className="report-kpi-card__value">
          {formatPercent(snapshot.roomsPerformance.vip?.occupancy ?? 0, language)}
        </strong>
        <span className="report-kpi-card__hint">{vipRevenueSubtext}</span>
      </div>

      {/* 3. Standard Rooms Performance Card */}
      <div className="report-kpi-card">
        <span className="report-kpi-card__label">
          {t('manager.reports.kpis.standardRoomsPerformance')}
        </span>
        <strong className="report-kpi-card__value">
          {formatPercent(snapshot.roomsPerformance.standard?.occupancy ?? 0, language)}
        </strong>
        <span className="report-kpi-card__hint">{standardRevenueSubtext}</span>
      </div>

      {/* 4. Transactions Card */}
      <div className="report-kpi-card">
        <span className="report-kpi-card__label">
          {t('manager.reports.kpis.transactions')}
        </span>
        <strong className="report-kpi-card__value">
          {formatNumber(snapshot.totals.transactions, language)}
        </strong>
        <span className="report-kpi-card__hint">{completedTasksSubtext}</span>
      </div>
    </div>
  );
}
