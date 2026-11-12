import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Download,
  FileText,
  FileDown,
  Printer,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatCurrency, formatNumber, formatPercent } from '../../../utils/format';
import {
  getSubManagerReports,
  subManagerReportsQueryKeys,
} from '../services/submanager-reports.api';
import type { ReportFilters, ReportPeriod } from '../types/submanager-reports.types';
import './SubManagerReportsPage.css';

const emptyFilters: ReportFilters = {
  period: 'day',
  dateFrom: '',
  dateTo: '',
  category: '',
  status: '',
  paymentMethod: '',
  room: '',
  type: '',
  floor: '',
  roomType: '',
  roomStatus: '',
  shift: '',
};

const periods: ReportPeriod[] = ['day', 'week', 'month', 'year'];
export function SubManagerReportsPage() {
  const { language, t } = useLanguage();
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<ReportFilters>({ ...emptyFilters, period: 'year' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: subManagerReportsQueryKeys.report(filters),
    queryFn: () => getSubManagerReports(filters),
  });

  const changePeriod = (period: ReportPeriod) => {
    setFilters((current) => ({ ...current, period }));
    setDraftFilters((current) => ({ ...current, period }));
  };

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({ ...draftFilters });
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    const defaults = { ...emptyFilters, period: 'year' as const };
    setDraftFilters(defaults);
    setFilters(defaults);
  };

  const exportCsv = () => {
    if (!data?.transactions.length) return;
    const heading = [t('submanager.reports.table.id'), t('submanager.reports.table.type'), t('submanager.reports.table.description'), t('submanager.reports.table.category'), t('submanager.reports.table.room'), t('submanager.reports.table.date'), t('submanager.reports.table.amount'), t('submanager.reports.table.status')];
    const lines = data.transactions.map((transaction) => [
      transaction.id,
      t(`submanager.reports.types.${transaction.type}`),
      transaction.description,
      t(`submanager.reports.categories.${transaction.category}`),
      transaction.room,
      transaction.date,
      String(transaction.amount),
      t(`submanager.reports.status.${transaction.status}`),
    ]);
    const csv = [heading, ...lines]
      .map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'al-amin-financial-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const hero = (
    <PageHero
      eyebrow={t('submanager.reports.eyebrow')}
      title={t('submanager.reports.title')}
      description={t('submanager.reports.subtitle')}
      className="submanager-reports-page__hero"
    >
      <Button variant="gold" onClick={() => window.print()}>
        <FileText aria-hidden="true" />
        {t('submanager.reports.actions.create')}
      </Button>
      <Button variant="glass" onClick={exportCsv}>
        <Download aria-hidden="true" />
        {t('submanager.reports.actions.export')}
      </Button>
    </PageHero>
  );

  if (isPending) {
    return (
      <div className="submanager-reports-page">
        {hero}
        <div className="submanager-reports-page__skeleton" aria-label={t('submanager.reports.loading')} aria-busy="true">
          <div className="submanager-reports-skeleton submanager-reports-skeleton--summary" />
          <div className="submanager-reports-page__kpis">
            {Array.from({ length: 4 }, (_, index) => <div className="submanager-reports-skeleton" key={index} />)}
          </div>
          <LoadingState label={t('submanager.reports.loading')} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="submanager-reports-page">
        {hero}
        <ErrorState
          title={t('submanager.reports.loadError')}
          message={getErrorMessage(error, language)}
          action={<Button onClick={() => { void refetch(); }}>{t('submanager.reports.actions.retry')}</Button>}
        />
      </div>
    );
  }

  const maxChartValue = Math.max(...data.revenueExpenseChart.flatMap((point) => [point.revenue, point.expenses]));
  const paymentTotal = data.paymentBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const paymentColors = ['#41c06a', '#9edbb0', '#c9a768'];
  const breakdownGradient = data.paymentBreakdown.reduce((result, item, index) => {
    const start = data.paymentBreakdown.slice(0, index).reduce((sum, entry) => sum + entry.amount, 0) / paymentTotal * 100;
    const end = start + item.amount / paymentTotal * 100;
    return `${result}${index ? ', ' : ''}${paymentColors[index % paymentColors.length]} ${start}% ${end}%`;
  }, '');
  const expenseTotal = data.expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="submanager-reports-page">
      {hero}

      <div className="submanager-reports-page__toolbar">
        <div className="submanager-reports-page__toolbar-actions">
          <Button className="submanager-reports-page__pdf-button" variant="primary" onClick={() => window.print()}><FileDown aria-hidden="true" /> PDF</Button>
          <Button variant="secondary" onClick={() => window.print()}><Printer aria-hidden="true" /> {t('submanager.reports.actions.print')}</Button>
          <Button variant="secondary" onClick={() => setIsFilterOpen(true)}><CalendarDays aria-hidden="true" /> {t('submanager.reports.actions.date')}</Button>
          <Button variant="secondary" onClick={() => setIsFilterOpen(true)}><SlidersHorizontal aria-hidden="true" /> {t('submanager.reports.actions.filters')}</Button>
        </div>
        <div className="submanager-reports-page__periods" role="group" aria-label={t('submanager.reports.period.label')}>
          {periods.map((period) => (
            <button
              type="button"
              key={period}
              className={filters.period === period ? 'is-active' : ''}
              aria-pressed={filters.period === period}
              onClick={() => changePeriod(period)}
            >
              {t(`submanager.reports.period.${period}`)}
            </button>
          ))}
        </div>
      </div>

      {data.transactions.length === 0 ? (
        <EmptyState title={t('submanager.reports.emptyTitle')} description={t('submanager.reports.emptyDescription')} />
      ) : (
        <>
          <section className="submanager-reports-page__daily-summary">
            <div className="submanager-reports-page__daily-heading">
              <img className="submanager-reports-page__brand-logo" src="/hotel-logo.png" alt="" />
              <div>
                <span className="submanager-reports-page__hotel-name">{t('submanager.reports.hotelName')}</span>
                <h2>{t('submanager.reports.daily.title')}</h2>
                <span className="submanager-reports-page__daily-subtitle">{t('submanager.reports.daily.subtitle')}</span>
                <p>{t('submanager.reports.daily.periodEnding').replace('{date}', new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${data.reportDate}T12:00:00`)))}</p>
              </div>
              <span className="submanager-reports-page__updated">{t('submanager.reports.daily.updated')}</span>
            </div>
            <div className="submanager-reports-page__daily-metrics">
                <SummaryMetric label={t('submanager.reports.kpis.revenue')} value={formatCurrency(data.totalRevenue, language)} hint={`${formatPercent(data.revenueTrend, language)} ${t('submanager.reports.kpis.revenueHint')}`} />
                <SummaryMetric label={t('submanager.reports.kpis.expenses')} value={formatCurrency(data.totalExpenses, language)} hint={t('submanager.reports.kpis.expensesBudgetHint')} />
                <SummaryMetric label={t('submanager.reports.kpis.net')} value={formatCurrency(data.netProfit, language)} hint={t('submanager.reports.kpis.profitHint')} />
                <SummaryMetric label={t('submanager.reports.kpis.collection')} value={formatPercent(data.collectionRate, language)} hint={t('submanager.reports.kpis.collectionHint')} />
            </div>
          </section>

          <section className="submanager-reports-page__kpis" aria-label={t('submanager.reports.kpis.secondaryLabel')}>
            <KpiCard label={t('submanager.reports.kpis.margin')} value={formatPercent(data.totalRevenue ? data.netProfit / data.totalRevenue * 100 : 0, language)} hint={t('submanager.reports.kpis.profitHint')} />
            <KpiCard label={t('submanager.reports.kpis.vip')} value={formatPercent(data.roomPerformance.find((room) => room.roomType === 'vip')?.occupancy ?? 0, language)} hint={`${formatCurrency(data.roomPerformance.find((room) => room.roomType === 'vip')?.revenue ?? 0, language)} ${t('submanager.reports.charts.roomRevenue')}`} />
            <KpiCard label={t('submanager.reports.kpis.regular')} value={formatPercent(data.roomPerformance.find((room) => room.roomType === 'regular')?.occupancy ?? 0, language)} hint={`${formatCurrency(data.roomPerformance.find((room) => room.roomType === 'regular')?.revenue ?? 0, language)} ${t('submanager.reports.charts.roomRevenue')}`} />
            <KpiCard label={t('submanager.reports.kpis.transactions')} value={String(data.transactionCount)} hint={t('submanager.reports.kpis.transactionsHint')} />
          </section>

          <section className="submanager-reports-page__charts">
            <article className="submanager-reports-card submanager-reports-card--donut">
              <div className="submanager-reports-card__heading">
                <div><h2>{t('submanager.reports.charts.payments')}</h2><p>{t('submanager.reports.charts.paymentsHint')}</p></div>
              </div>
              <div className="submanager-reports-donut-wrap">
                <div className="submanager-reports-donut" style={{ background: paymentTotal ? `conic-gradient(${breakdownGradient})` : 'var(--color-border)' }}>
                  <div><strong>{formatCompactNumber(paymentTotal, language)}</strong><span>{t('submanager.reports.charts.paymentUnit')}</span></div>
                </div>
              </div>
              <ul className="submanager-reports-legend">
                {data.paymentBreakdown.map((method, index) => (
                  <li key={method.id}>
                    <span className="submanager-reports-legend__dot" style={{ backgroundColor: paymentColors[index % paymentColors.length] }} />
                    <span>{t(`submanager.reports.paymentMethods.${method.id}`)}</span>
                    <strong>{formatPercent(paymentTotal ? method.amount / paymentTotal * 100 : 0, language)}</strong>
                  </li>
                ))}
              </ul>
            </article>

            <article className="submanager-reports-card submanager-reports-card--chart">
              <div className="submanager-reports-card__heading">
                <div><h2>{t('submanager.reports.charts.revenueExpenses')}</h2><p>{t('submanager.reports.charts.revenueExpensesHint')}</p></div>
                <span className="submanager-reports-card__period">{t('submanager.reports.charts.stableGrowth')}</span>
              </div>
              <div className="submanager-reports-bars" role="img" aria-label={t('submanager.reports.charts.chartLabel')}>
                {data.revenueExpenseChart.map((point, index) => (
                  <div className="submanager-reports-bars__group" key={`${point.label}-${index}`}>
                    <div className="submanager-reports-bars__pair">
                      <span className="submanager-reports-bars__revenue" style={{ height: `${point.revenue / maxChartValue * 100}%` }} />
                      <span className="submanager-reports-bars__expenses" style={{ height: `${point.expenses / maxChartValue * 100}%` }} />
                    </div>
                    <small>{t(`submanager.reports.months.${point.label}`)}</small>
                  </div>
                ))}
              </div>
              <div className="submanager-reports-chart-legend">
                <span><i className="is-revenue" />{t('submanager.reports.charts.revenue')}</span>
                <span><i className="is-expense" />{t('submanager.reports.charts.expenses')}</span>
              </div>
            </article>
          </section>

          <section className="submanager-reports-page__details">
            <article className="submanager-reports-card">
              <div className="submanager-reports-card__heading">
                <div><h2>{t('submanager.reports.charts.expenseCategories')}</h2><p>{t('submanager.reports.charts.expenseCategoriesHint')}</p></div>
              </div>
              <ul className="submanager-reports-category-list">
                {data.expenseBreakdown.map((item, index) => (
                  <li key={item.id}>
                    <div><span>{t(`submanager.reports.categories.${item.id}`)}</span><strong>{formatPercent(expenseTotal ? item.amount / expenseTotal * 100 : 0, language)}</strong></div>
                    <div className="submanager-reports-category-list__track"><span style={{ width: `${expenseTotal ? item.amount / expenseTotal * 100 : 0}%`, backgroundColor: paymentColors[(index + 2) % paymentColors.length] }} /></div>
                  </li>
                ))}
              </ul>
            </article>
            <article className="submanager-reports-card">
              <div className="submanager-reports-card__heading">
                <div><h2>{t('submanager.reports.charts.roomPerformance')}</h2><p>{t('submanager.reports.charts.roomPerformanceHint')}</p></div>
              </div>
              <div className="submanager-reports-room-list">
                {data.roomPerformance.map((room) => (
                  <div className="submanager-reports-room" key={room.roomType}>
                    <div><span>{t(`submanager.reports.roomTypes.${room.roomType}`)}</span><small>{t('submanager.reports.charts.roomsCount').replace('{count}', formatNumber(room.rooms, language))}</small></div>
                    <strong>{formatPercent(room.occupancy, language)} {t('submanager.reports.charts.occupancy')}</strong>
                    <span className="submanager-reports-room__revenue">{formatCurrency(room.revenue, language)}</span>
                    <div className="submanager-reports-room__track"><span style={{ width: `${room.occupancy}%` }} /></div>
                  </div>
                ))}
              </div>
            </article>
          </section>

        </>
      )}

      {isFilterOpen && (
        <div className="submanager-reports-drawer-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsFilterOpen(false);
        }}>
          <aside className="submanager-reports-drawer" role="dialog" aria-modal="true" aria-labelledby="submanager-reports-drawer-title" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <header className="submanager-reports-drawer__header">
              <div><span>{t('submanager.reports.drawer.eyebrow')}</span><h2 id="submanager-reports-drawer-title">{t('submanager.reports.drawer.title')}</h2></div>
              <button type="button" onClick={() => setIsFilterOpen(false)} aria-label={t('submanager.reports.drawer.close')}><X aria-hidden="true" /></button>
            </header>
            <form onSubmit={applyFilters}>
              <div className="submanager-reports-drawer__grid">
                <fieldset className="submanager-reports-drawer__date-range">
                  <legend>{t('submanager.reports.drawer.dateRange')}</legend>
                  <div>
                    <input aria-label={t('submanager.reports.drawer.dateRange')} type="date" value={draftFilters.dateFrom} onChange={(event) => setDraftFilters({ ...draftFilters, dateFrom: event.target.value, dateTo: '' })} />
                  </div>
                </fieldset>
                <label>{t('submanager.reports.drawer.period')}<select value={draftFilters.period} onChange={(event) => setDraftFilters({ ...draftFilters, period: event.target.value as ReportPeriod })}>{periods.map((period) => <option value={period} key={period}>{t(`submanager.reports.period.${period}`)}</option>)}</select></label>
                <label>{t('submanager.reports.drawer.floor')}<select value={draftFilters.floor} onChange={(event) => setDraftFilters({ ...draftFilters, floor: event.target.value })}><option value="">{t('submanager.reports.drawer.allFloors')}</option>{['1', '2', '3', '4', '5'].map((floor) => <option value={floor} key={floor}>{formatNumber(Number(floor), language)}</option>)}</select></label>
                <label>{t('submanager.reports.drawer.roomType')}<select value={draftFilters.roomType} onChange={(event) => setDraftFilters({ ...draftFilters, roomType: event.target.value })}><option value="">{t('submanager.reports.drawer.allRoomTypes')}</option><option value="regular">{t('submanager.reports.roomTypes.regular')}</option><option value="vip">{t('submanager.reports.roomTypes.vip')}</option></select></label>
                <label>{t('submanager.reports.drawer.roomStatus')}<select value={draftFilters.roomStatus} onChange={(event) => setDraftFilters({ ...draftFilters, roomStatus: event.target.value })}><option value="">{t('submanager.reports.drawer.allRoomStatuses')}</option><option value="occupied">{t('submanager.reports.drawer.occupied')}</option><option value="maintenance">{t('submanager.reports.drawer.maintenance')}</option></select></label>
                <label>{t('submanager.reports.drawer.shift')}<select value={draftFilters.shift} onChange={(event) => setDraftFilters({ ...draftFilters, shift: event.target.value })}><option value="">{t('submanager.reports.drawer.allShifts')}</option><option value="morning">{t('submanager.reports.drawer.morning')}</option><option value="evening">{t('submanager.reports.drawer.evening')}</option><option value="night">{t('submanager.reports.drawer.night')}</option></select></label>
                <label>{t('submanager.reports.drawer.paymentMethod')}<select value={draftFilters.paymentMethod} onChange={(event) => setDraftFilters({ ...draftFilters, paymentMethod: event.target.value })}><option value="">{t('submanager.reports.drawer.allMethods')}</option><option value="cash">{t('submanager.reports.paymentMethods.cash')}</option><option value="instapay">{t('submanager.reports.paymentMethods.instapay')}</option><option value="card">{t('submanager.reports.paymentMethods.card')}</option></select></label>
                <label>{t('submanager.reports.drawer.expenseCategory')}<select value={draftFilters.category} onChange={(event) => setDraftFilters({ ...draftFilters, category: event.target.value })}><option value="">{t('submanager.reports.drawer.allCategories')}</option><option value="cleaning_supplies">{t('submanager.reports.categories.cleaning_supplies')}</option><option value="utilities">{t('submanager.reports.categories.utilities')}</option><option value="maintenance_supplies">{t('submanager.reports.categories.maintenance_supplies')}</option><option value="other">{t('submanager.reports.categories.other')}</option></select></label>
              </div>
              <footer className="submanager-reports-drawer__actions">
                <Button variant="secondary" onClick={resetFilters}>{t('submanager.reports.drawer.reset')}</Button>
                <Button type="submit"><SlidersHorizontal aria-hidden="true" />{t('submanager.reports.drawer.apply')}</Button>
              </footer>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="submanager-reports-summary-metric"><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>;
}

function formatCompactNumber(value: number, language: string) {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="submanager-reports-kpi">
      <div className="submanager-reports-kpi__top"><span>{label}</span></div>
      <strong className="submanager-reports-kpi__value">{value}</strong>
      <div className="submanager-reports-kpi__bottom"><span>{hint}</span></div>
    </article>
  );
}
