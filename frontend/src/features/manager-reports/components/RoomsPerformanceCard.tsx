import { ProgressBar } from '../../../components/ui/ProgressBar';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import type { ReportSnapshot } from '../types/manager-reports.types';
import './RoomsPerformanceCard.css';

export interface RoomsPerformanceCardProps {
  snapshot: ReportSnapshot;
  className?: string;
}

export function RoomsPerformanceCard({
  snapshot,
  className = '',
}: RoomsPerformanceCardProps) {
  const { language, t } = useLanguage();

  const standard = snapshot.roomsPerformance?.standard ?? { rooms: 21, occupancy: 67, revenue: 286000 };
  const vip = snapshot.roomsPerformance?.vip ?? { rooms: 15, occupancy: 76, revenue: 398000 };

  // Format headers: e.g. "21 غرفة · 67٪ إشغال"
  const standardStatText = t('manager.reports.roomsPerformance.roomsOccupancy')
    .replace('{{rooms}}', formatNumber(standard.rooms, language))
    .replace('{{occupancy}}', formatNumber(standard.occupancy, language));

  const vipStatText = t('manager.reports.roomsPerformance.roomsOccupancy')
    .replace('{{rooms}}', formatNumber(vip.rooms, language))
    .replace('{{occupancy}}', formatNumber(vip.occupancy, language));

  // Format revenue subtext: e.g. "إيراد 286 ألف ج.م"
  const standardRevenueThousands = Math.round(standard.revenue / 1000);
  const standardRevenueText = t('manager.reports.roomsPerformance.revenueText').replace(
    '{{amount}}',
    formatNumber(standardRevenueThousands, language),
  );

  const vipRevenueThousands = Math.round(vip.revenue / 1000);
  const vipRevenueText = t('manager.reports.roomsPerformance.revenueText').replace(
    '{{amount}}',
    formatNumber(vipRevenueThousands, language),
  );

  return (
    <article
      className={`rooms-performance-card ${className}`.trim()}
      aria-label={t('manager.reports.roomsPerformance.title')}
    >
      <header className="rooms-performance-card__header">
        <h3 className="rooms-performance-card__title">
          {t('manager.reports.roomsPerformance.title')}
        </h3>
        <p className="rooms-performance-card__subtitle">
          {t('manager.reports.roomsPerformance.subtitle')}
        </p>
      </header>

      <div className="rooms-performance-card__items">
        {/* 1. Standard Rooms Row */}
        <div className="rooms-performance-card__item">
          <div className="rooms-performance-card__item-header">
            <strong className="rooms-performance-card__item-stat">
              {standardStatText}
            </strong>
            <span className="rooms-performance-card__item-type">
              {t('manager.reports.roomsPerformance.standardLabel')}
            </span>
          </div>

          <ProgressBar
            value={standard.occupancy}
            tone="success"
            size="md"
            ariaLabel={`${t('manager.reports.roomsPerformance.standardLabel')}: ${standardStatText}`}
          />

          <span className="rooms-performance-card__item-revenue">
            {standardRevenueText}
          </span>
        </div>

        {/* 2. VIP Rooms Row */}
        <div className="rooms-performance-card__item">
          <div className="rooms-performance-card__item-header">
            <strong className="rooms-performance-card__item-stat">
              {vipStatText}
            </strong>
            <span className="rooms-performance-card__item-type">
              {t('manager.reports.roomsPerformance.vipLabel')}
            </span>
          </div>

          <ProgressBar
            value={vip.occupancy}
            tone="success"
            size="md"
            ariaLabel={`${t('manager.reports.roomsPerformance.vipLabel')}: ${vipStatText}`}
          />

          <span className="rooms-performance-card__item-revenue">
            {vipRevenueText}
          </span>
        </div>
      </div>
    </article>
  );
}
