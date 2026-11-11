import { useMemo } from 'react';
import { Logo } from '../../../components/common/Logo';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatCurrency, formatPercent } from '../../../utils/format';
import type { ReportPeriod, ReportSnapshot } from '../types/manager-reports.types';
import './ReportSummaryCard.css';

export interface ReportSummaryCardProps {
  snapshot: ReportSnapshot;
  period: ReportPeriod;
  lastUpdatedTime?: string;
  className?: string;
}

function formatPeriodEndingDate(dateString: string, language: 'ar' | 'en'): string {
  try {
    const d = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function ReportSummaryCard({
  snapshot,
  period,
  lastUpdatedTime,
  className = '',
}: ReportSummaryCardProps) {
  const { language, t } = useLanguage();

  const reportTitle = useMemo(() => {
    switch (period) {
      case 'weekly':
        return t('manager.reports.reportCard.titles.weekly');
      case 'monthly':
        return t('manager.reports.reportCard.titles.monthly');
      case 'yearly':
        return t('manager.reports.reportCard.titles.yearly');
      case 'daily':
      default:
        return t('manager.reports.reportCard.titles.daily');
    }
  }, [period, t]);

  const formattedEndingDate = useMemo(() => {
    const rawDate = snapshot.periodEndDate || '2025-06-18';
    return formatPeriodEndingDate(rawDate, language);
  }, [snapshot.periodEndDate, language]);

  const endingDateText = t('manager.reports.reportCard.periodEnding').replace(
    '{{date}}',
    formattedEndingDate,
  );

  const outOfRoomsText = t('manager.reports.reportCard.summary.outOfRooms').replace(
    '{{count}}',
    language === 'ar' ? '٣٦' : '36',
  );

  const vsPrevPeriodText = t(
    'manager.reports.reportCard.summary.vsPreviousPeriod',
  ).replace('{{change}}', language === 'ar' ? '١٢٫٤' : '12.4');

  return (
    <article
      className={`report-summary-card report-print-area ${className}`.trim()}
      aria-label={reportTitle}
    >
      {/* 1. Header with Hotel Brand, Title, Date, and Updated Badge */}
      <div className="report-summary-card__header">
        <div className="report-summary-card__brand-block">
          <Logo className="report-summary-card__logo" />
          <div className="report-summary-card__copy">
            <span className="report-summary-card__eyebrow">
              {t('manager.reports.reportCard.hotelNameLocation')}
            </span>
            <h2 className="report-summary-card__title">{reportTitle}</h2>
            <span className="report-summary-card__date">{endingDateText}</span>
          </div>
        </div>

        <div className="report-summary-card__badge" aria-label={t('manager.reports.reportCard.updatedNow')}>
          <span className="report-summary-card__badge-dot" aria-hidden="true" />
          <span>
            {lastUpdatedTime
              ? `${language === 'ar' ? 'تم التحديث ' : 'Updated '}${lastUpdatedTime}`
              : t('manager.reports.reportCard.updatedNow')}
          </span>
        </div>
      </div>

      {/* 2. Thin Divider */}
      <hr className="report-summary-card__divider" aria-hidden="true" />

      {/* 3. 4 Summary Figures Row */}
      <div className="report-summary-card__figures">
        {/* Figure 1: Total Revenue */}
        <div className="report-summary-card__figure">
          <span className="report-summary-card__figure-label">
            {t('manager.reports.reportCard.summary.totalRevenue')}
          </span>
          <strong className="report-summary-card__figure-value">
            {formatCurrency(snapshot.totals.revenue, language)}
          </strong>
          <span className="report-summary-card__figure-caption report-summary-card__figure-caption--positive">
            {vsPrevPeriodText}
          </span>
        </div>

        {/* Figure 2: Total Expenses */}
        <div className="report-summary-card__figure">
          <span className="report-summary-card__figure-label">
            {t('manager.reports.reportCard.summary.totalExpenses')}
          </span>
          <strong className="report-summary-card__figure-value">
            {formatCurrency(snapshot.totals.expenses, language)}
          </strong>
          <span className="report-summary-card__figure-caption">
            {t('manager.reports.reportCard.summary.withinOperatingBudget')}
          </span>
        </div>

        {/* Figure 3: Net Profit */}
        <div className="report-summary-card__figure">
          <span className="report-summary-card__figure-label">
            {t('manager.reports.reportCard.summary.netProfit')}
          </span>
          <strong className="report-summary-card__figure-value">
            {formatCurrency(snapshot.totals.netProfit, language)}
          </strong>
          <span className="report-summary-card__figure-caption">
            {t('manager.reports.reportCard.summary.afterExpensesDeduction')}
          </span>
        </div>

        {/* Figure 4: Average Occupancy */}
        <div className="report-summary-card__figure">
          <span className="report-summary-card__figure-label">
            {t('manager.reports.reportCard.summary.avgOccupancy')}
          </span>
          <strong className="report-summary-card__figure-value">
            {formatPercent(snapshot.totals.avgOccupancy, language)}
          </strong>
          <span className="report-summary-card__figure-caption">
            {outOfRoomsText}
          </span>
        </div>
      </div>
    </article>
  );
}
