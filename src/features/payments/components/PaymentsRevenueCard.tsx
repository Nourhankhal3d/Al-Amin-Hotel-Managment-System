import { PAYMENT_METHODS } from '../../../core/constants/paymentMethods';
import { formatDate, toDayKey } from '../../../core/utils/date';
import { formatMoney, formatPercent } from '../../../core/utils/numerals';
import type { Payment } from '../types/payment.types';

interface PaymentsRevenueCardProps {
  payments: Payment[];
}

interface DayPoint {
  day: string;
  total: number;
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 150;
const CHART_PAD = 14;

function totalOf(payments: Payment[], method?: string): number {
  return payments
    .filter((payment) => !method || payment.method === method)
    .reduce((sum, payment) => sum + (Number.isFinite(payment.amount) ? payment.amount : 0), 0);
}

/** Buckets amounts per calendar day (oldest → newest) for the revenue line. */
function buildDayPoints(payments: Payment[]): DayPoint[] {
  const buckets = new Map<string, number>();

  payments.forEach((payment) => {
    if (!payment.paidAt) return;
    const day = toDayKey(payment.paidAt);
    if (!day) return;
    buckets.set(day, (buckets.get(day) ?? 0) + (Number.isFinite(payment.amount) ? payment.amount : 0));
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, total]) => ({ day, total }));
}

function buildChartPaths(points: DayPoint[]) {
  const max = Math.max(...points.map((point) => point.total), 1);
  const innerWidth = CHART_WIDTH - CHART_PAD * 2;
  const innerHeight = CHART_HEIGHT - CHART_PAD * 2;
  const stepX = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const coords = points.map((point, index) => ({
    x: CHART_PAD + index * stepX,
    y: CHART_HEIGHT - CHART_PAD - (point.total / max) * innerHeight,
  }));

  const line = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`)
    .join(' ');

  const last = coords[coords.length - 1];
  const first = coords[0];
  const area = `${line} L ${last.x.toFixed(1)} ${CHART_HEIGHT - CHART_PAD / 2} L ${first.x.toFixed(1)} ${CHART_HEIGHT - CHART_PAD / 2} Z`;

  return { line, area, last };
}

export function PaymentsRevenueCard({ payments }: PaymentsRevenueCardProps) {
  const total = totalOf(payments);
  const cash = totalOf(payments, PAYMENT_METHODS.cash);
  const card = totalOf(payments, PAYMENT_METHODS.card);
  const transfer = totalOf(payments, PAYMENT_METHODS.transfer);
  const share = (value: number) => (total > 0 ? value / total : 0);

  const points = buildDayPoints(payments);
  const chart = points.length > 0 ? buildChartPaths(points) : null;

  return (
    <section className="al-card" aria-label="إيرادات الوردية">
      <div className="al-revenue">
        <div className="al-revenue__chart">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="منحنى إيرادات الوردية">
            <defs>
              <linearGradient id="al-rev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2fa84f" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#2fa84f" stopOpacity="0" />
              </linearGradient>
            </defs>
            {chart ? (
              <>
                <path d={chart.area} fill="url(#al-rev-fill)" />
                <path d={chart.line} fill="none" stroke="#2fa84f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={chart.last.x} cy={chart.last.y} r="4.5" fill="#2fa84f" stroke="#fff" strokeWidth="2" />
              </>
            ) : (
              <path
                d={`M ${CHART_PAD} ${CHART_HEIGHT / 2} L ${CHART_WIDTH - CHART_PAD} ${CHART_HEIGHT / 2}`}
                stroke="#c9cec5"
                strokeWidth="2"
                strokeDasharray="6 7"
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="al-revenue__axis">
            <span>{points.length > 0 ? formatDate(`${points[0].day}T00:00:00`, 'ar') : '—'}</span>
            <span>{points.length > 1 ? formatDate(`${points[Math.floor(points.length / 2)].day}T00:00:00`, 'ar') : ''}</span>
            <span>{points.length > 0 ? formatDate(`${points[points.length - 1].day}T00:00:00`, 'ar') : '—'}</span>
          </div>
        </div>

        <div className="al-revenue__panel">
          <span className="al-revenue__label">إيرادات الوردية</span>
          <h2 className="al-revenue__total">{formatMoney(total)}</h2>
          <p className="al-revenue__hint">
            يشمل جميع المدفوعات المسجلة خلال الوردية الحالية — نقدي وبطاقات وتحويلات.
          </p>
          <div className="al-legend">
            <span className="al-legend__item"><i className="al-legend__dot" />نقدي {formatPercent(share(cash))}</span>
            <span className="al-legend__item"><i className="al-legend__dot al-legend__dot--gold" />بطاقات {formatPercent(share(card))}</span>
            <span className="al-legend__item"><i className="al-legend__dot al-legend__dot--rose" />تحويلات {formatPercent(share(transfer))}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
