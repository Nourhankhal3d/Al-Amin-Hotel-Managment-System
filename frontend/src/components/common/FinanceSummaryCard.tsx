import { AreaLineChart } from './AreaLineChart';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../core/i18n/useLanguage';
import { formatCurrency } from '../../utils/format';
import './FinanceSummaryCard.css';

export interface FinanceSummaryLegendItem {
  id: string;
  label: string;
  amount: number;
  tone: 'green' | 'gold' | 'amber' | 'rose';
}

export interface FinanceSummaryCardProps {
  title: string;
  netAmount: number;
  caption: string;
  revenueAmount: number;
  expenseAmount: number;
  refundedAmount: number;
  labels: {
    net: string;
    revenue: string;
    expenses: string;
    refunded: string;
    paymentMethods: string;
    expenseSources: string;
  };
  chart: {
    points: number[];
    labels: string[];
    ariaLabel: string;
  };
  paymentMethods: FinanceSummaryLegendItem[];
  expenseSources: FinanceSummaryLegendItem[];
}

function LegendGroup({ title, items }: { title: string; items: FinanceSummaryLegendItem[] }) {
  const { language } = useLanguage();

  return (
    <div className="finance-summary-card__legend-group">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <span className={`finance-summary-card__legend-dot finance-summary-card__legend-dot--${item.tone}`} aria-hidden="true" />
            <span className="finance-summary-card__legend-label">{item.label}</span>
            <strong>{formatCurrency(item.amount, language)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FinanceSummaryCard({
  title,
  netAmount,
  caption,
  revenueAmount,
  expenseAmount,
  refundedAmount,
  labels,
  chart,
  paymentMethods,
  expenseSources,
}: FinanceSummaryCardProps) {
  const { language } = useLanguage();

  return (
    <Card className="finance-summary-card" dir="ltr">
      <div className="finance-summary-card__chart-column" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AreaLineChart
          className="finance-summary-card__chart"
          points={chart.points}
          labels={chart.labels}
          height={166}
          ariaLabel={chart.ariaLabel}
        />
        <div className="finance-summary-card__legends">
          <LegendGroup title={labels.paymentMethods} items={paymentMethods} />
          <LegendGroup title={labels.expenseSources} items={expenseSources} />
        </div>
      </div>

      <div className="finance-summary-card__summary" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <h2>{title}</h2>
        <span className="finance-summary-card__net-label">{labels.net}</span>
        <strong className="finance-summary-card__net-value">{formatCurrency(netAmount, language)}</strong>
        <p>{caption}</p>
        <div className="finance-summary-card__chips">
          <Badge tone="success">{labels.revenue}<strong>{formatCurrency(revenueAmount, language)}</strong></Badge>
          <Badge tone="warning">{labels.expenses}<strong>{formatCurrency(expenseAmount, language)}</strong></Badge>
          <Badge tone="danger">{labels.refunded}<strong>{formatCurrency(refundedAmount, language)}</strong></Badge>
        </div>
      </div>
    </Card>
  );
}