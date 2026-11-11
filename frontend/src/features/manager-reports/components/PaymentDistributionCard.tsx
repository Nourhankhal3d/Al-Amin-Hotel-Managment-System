import { useMemo } from 'react';
import { DonutChart, type DonutSegment, type DonutSegmentTone } from '../../../components/common/DonutChart';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import type { ReportSnapshot } from '../types/manager-reports.types';
import './PaymentDistributionCard.css';

export interface PaymentDistributionCardProps {
  snapshot: ReportSnapshot;
  className?: string;
}

export function PaymentDistributionCard({
  snapshot,
  className = '',
}: PaymentDistributionCardProps) {
  const { language, t } = useLanguage();

  const totalRevenue = snapshot.totals?.revenue ?? 0;

  // Center display: value in thousands with 1 decimal if >= 1000 (e.g. 24.8 ألف ج.م)
  const { centerValue, centerLabel } = useMemo(() => {
    if (totalRevenue >= 1000) {
      const thousands = totalRevenue / 1000;
      return {
        centerValue: formatNumber(thousands, language, 1),
        centerLabel: t('manager.reports.paymentDistribution.thousandEgp'),
      };
    }
    return {
      centerValue: formatNumber(totalRevenue, language, 0),
      centerLabel: t('manager.reports.paymentDistribution.egp'),
    };
  }, [totalRevenue, language, t]);

  // Map snapshot.paymentSplit to DonutSegment[]
  const segments: DonutSegment[] = useMemo(() => {
    if (!snapshot.paymentSplit || snapshot.paymentSplit.length === 0) return [];

    return snapshot.paymentSplit.map((item) => {
      let tone: DonutSegmentTone = 'green';
      if (item.id === 'cash') tone = 'green';
      else if (item.id === 'instapay') tone = 'light-green';
      else if (item.id === 'vodafone') tone = 'gold';

      return {
        key: item.id,
        label: item.label,
        value: item.amount,
        tone,
        color: item.color,
      };
    });
  }, [snapshot.paymentSplit]);

  return (
    <article
      className={`payment-distribution-card ${className}`.trim()}
      aria-label={t('manager.reports.paymentDistribution.title')}
    >
      <header className="payment-distribution-card__header">
        <h3 className="payment-distribution-card__title">
          {t('manager.reports.paymentDistribution.title')}
        </h3>
        <p className="payment-distribution-card__subtitle">
          {t('manager.reports.paymentDistribution.subtitle')}
        </p>
      </header>

      <div className="payment-distribution-card__chart-wrapper">
        <DonutChart
          segments={segments}
          thickness={26}
          size={190}
          centerValue={centerValue}
          centerLabel={centerLabel}
          showLegend={true}
          legendPosition="bottom"
          ariaLabel={t('manager.reports.paymentDistribution.title')}
        />
      </div>
    </article>
  );
}
