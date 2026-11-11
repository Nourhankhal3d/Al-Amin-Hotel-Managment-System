import { Card } from '../../../components/ui/Card';
import { AreaLineChart } from '../../../components/common/AreaLineChart';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import './FinanceRevenueCard.css';

export interface FinanceRevenueCardProps {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  refundedTotal: number;
  methodTotals: {
    instapay: number;
    cash: number;
    vodafone: number;
  };
  expenseCategoryTotals: {
    cleaning: number;
    maintenance: number;
  };
  hourlyPoints?: number[];
  className?: string;
}

export function FinanceRevenueCard({
  totalRevenue,
  totalExpenses,
  netProfit,
  refundedTotal,
  methodTotals,
  expenseCategoryTotals,
  hourlyPoints,
  className = '',
}: FinanceRevenueCardProps) {
  const { language, t } = useLanguage();

  // 4 timeline labels matching the Figma design slice: 8 ص, 10 ص, 12 م, الآن
  const chartLabels = [
    t('manager.finance.revenueCard.hours.8am'),
    t('manager.finance.revenueCard.hours.10am'),
    t('manager.finance.revenueCard.hours.12pm'),
    t('manager.finance.revenueCard.hours.now'),
  ];

  // Derive 4 progressive curve points ending at totalRevenue
  let points = [5600, 11450, 18600, totalRevenue];
  if (hourlyPoints && hourlyPoints.length >= 4) {
    if (hourlyPoints.length === 4) {
      points = hourlyPoints;
    } else {
      points = [
        hourlyPoints[1] ?? 5600,
        hourlyPoints[3] ?? 11450,
        hourlyPoints[4] ?? 18600,
        hourlyPoints[hourlyPoints.length - 1] ?? totalRevenue,
      ];
    }
  }

  const currencySymbol = language === 'ar' ? 'ج.م' : 'EGP';

  return (
    <Card className={`finance-revenue-card ${className}`.trim()}>
      {/* Summary Section (Right in RTL, Left in LTR) */}
      <div className="finance-revenue-card__summary">
        <span className="finance-revenue-card__eyebrow">
          {t('manager.finance.revenueCard.title')}
        </span>

        <div className="finance-revenue-card__amount-row">
          <strong className="finance-revenue-card__amount">
            {formatNumber(netProfit, language)}
          </strong>
          <span className="finance-revenue-card__currency">{currencySymbol}</span>
        </div>

        <p className="finance-revenue-card__caption">
          {t('manager.finance.revenueCard.netCaption')}
        </p>

        {/* Shift Summary Metrics Chips */}
        <div className="finance-revenue-card__chips-group">
          <div className="finance-revenue-card__chips-row">
            {/* Revenues */}
            <span className="finance-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-primary)' }}
                aria-hidden="true"
              />
              <strong className="finance-chip__val">
                {formatNumber(totalRevenue, language)}
              </strong>
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.chips.revenues')}
              </span>
            </span>

            {/* Expenses */}
            <span className="finance-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-amber)' }}
                aria-hidden="true"
              />
              <strong className="finance-chip__val">
                {formatNumber(totalExpenses, language)}
              </strong>
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.chips.expenses')}
              </span>
            </span>
          </div>

          <div className="finance-revenue-card__chips-row">
            {/* Refunded */}
            <span className="finance-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-danger)' }}
                aria-hidden="true"
              />
              <strong className="finance-chip__val">
                {formatNumber(refundedTotal, language)}
              </strong>
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.chips.refunded')}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Divider */}
      <div className="finance-revenue-card__divider" aria-hidden="true" />

      {/* Chart Section (Left in RTL, Right in LTR) */}
      <div className="finance-revenue-card__chart-section">
        <div className="finance-revenue-card__chart-wrapper">
          <AreaLineChart
            points={points}
            labels={chartLabels}
            height={180}
            ariaLabel={t('manager.finance.revenueCard.chartAriaLabel')}
          />
        </div>

        {/* Legend Breakdown Chips under the chart */}
        <div className="finance-revenue-card__legend">
          <div className="finance-revenue-card__legend-row">
            {/* Instapay */}
            <span className="finance-legend-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-info)' }}
                aria-hidden="true"
              />
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.methods.instapay')}
              </span>
              <strong className="finance-chip__val">
                {formatNumber(methodTotals.instapay, language)}
              </strong>
            </span>

            {/* Cash */}
            <span className="finance-legend-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-chart-light-green)' }}
                aria-hidden="true"
              />
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.methods.cash')}
              </span>
              <strong className="finance-chip__val">
                {formatNumber(methodTotals.cash, language)}
              </strong>
            </span>

            {/* Vodafone Cash */}
            <span className="finance-legend-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-primary)' }}
                aria-hidden="true"
              />
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.methods.vodafone')}
              </span>
              <strong className="finance-chip__val">
                {formatNumber(methodTotals.vodafone, language)}
              </strong>
            </span>

            {/* Cleaning Supplies */}
            <span className="finance-legend-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-amber)' }}
                aria-hidden="true"
              />
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.methods.cleaning')}
              </span>
              <strong className="finance-chip__val">
                {formatNumber(expenseCategoryTotals.cleaning, language)}
              </strong>
            </span>
          </div>

          <div className="finance-revenue-card__legend-row">
            {/* Maintenance Supplies */}
            <span className="finance-legend-chip">
              <span
                className="finance-chip__dot"
                style={{ backgroundColor: 'var(--color-gold)' }}
                aria-hidden="true"
              />
              <span className="finance-chip__label">
                {t('manager.finance.revenueCard.methods.maintenance')}
              </span>
              <strong className="finance-chip__val">
                {formatNumber(expenseCategoryTotals.maintenance, language)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
