import { useQuery } from '@tanstack/react-query';
import { Activity, ChartNoAxesCombined, FileDown, Receipt, Wallet } from 'lucide-react';
import { FinanceSummaryCard } from '../../../components/common/FinanceSummaryCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { StatCard } from '../../../components/ui/StatCard';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatClock, formatCurrency } from '../../../utils/format';
import { getSubManagerDashboardSummary, subManagerDashboardQueryKeys } from '../services/dashboard.api';
import type { ExpenseSource, PaymentMethod } from '../types/submanager-dashboard.types';
import './SubManagerDashboardPage.css';

const paymentTones: Record<PaymentMethod, 'green' | 'gold' | 'amber'> = {
  instapay: 'green',
  cash: 'gold',
  vodafone_cash: 'amber',
};

const expenseTones: Record<ExpenseSource, 'green' | 'gold' | 'amber' | 'rose'> = {
  cleaning_supplies: 'green',
  maintenance_supplies: 'gold',
  electricity: 'amber',
  emergency: 'rose',
};

export function SubManagerDashboardPage() {
  const { language, t } = useLanguage();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: subManagerDashboardQueryKeys.summary,
    queryFn: getSubManagerDashboardSummary,
  });

  const hero = (
    <PageHero
      eyebrow={t('submanager.dashboard.eyebrow')}
      title={t('submanager.dashboard.reportTitle')}
      description={t('submanager.dashboard.description')}
      className="submanager-dashboard-page__hero"
    >
      <Button
        variant="gold"
        className="submanager-dashboard-page__print-action"
        onClick={() => window.print()}
      >
        <FileDown aria-hidden="true" />
        {t('submanager.dashboard.downloadPdf')}
      </Button>
    </PageHero>
  );

  if (isPending) return <div className="submanager-dashboard-page">{hero}<LoadingState label={t('submanager.dashboard.loading')} /></div>;
  if (isError || !data) {
    return (
      <div className="submanager-dashboard-page">
        {hero}
        <ErrorState
          title={t('submanager.dashboard.loadError')}
          message={getErrorMessage(error, language)}
          action={<Button onClick={() => { void refetch(); }}>{t('submanager.dashboard.retry')}</Button>}
        />
      </div>
    );
  }
  if (data.operationCount === 0) {
    return (
      <div className="submanager-dashboard-page">
        {hero}
        <EmptyState
          title={t('submanager.dashboard.emptyTitle')}
          description={t('submanager.dashboard.emptyDescription')}
        />
      </div>
    );
  }

  const chartLabels = data.chart.hours.map((hour) => {
    const [year, month, day] = data.chartDate.split('-').map(Number);
    return formatClock(new Date(year, month - 1, day, hour), language);
  });
  const paymentMethods = data.paymentMethods.map((method) => ({
    id: method.id,
    label: t(`submanager.dashboard.paymentMethods.${method.id}`),
    amount: method.amount,
    tone: paymentTones[method.id as PaymentMethod],
  }));
  const expenseSources = data.expenseSources.map((source) => ({
    id: source.id,
    label: t(`submanager.dashboard.expenseSources.${source.id}`),
    amount: source.amount,
    tone: expenseTones[source.id as ExpenseSource],
  }));

  return (
    <div className="submanager-dashboard-page">
      {hero}
      <FinanceSummaryCard
        title={t('submanager.dashboard.summary.title')}
        netAmount={data.netAmount}
        caption={t('submanager.dashboard.summary.caption')}
        revenueAmount={data.revenueTotal}
        expenseAmount={data.expenseTotal}
        refundedAmount={data.refundedTotal}
        labels={{
          net: t('submanager.dashboard.stats.net'),
          revenue: t('submanager.dashboard.summary.revenue'),
          expenses: t('submanager.dashboard.summary.expenses'),
          refunded: t('submanager.dashboard.summary.refunded'),
          paymentMethods: t('submanager.dashboard.summary.paymentMethods'),
          expenseSources: t('submanager.dashboard.summary.expenseSources'),
        }}
        chart={{
          points: data.chart.points,
          labels: chartLabels,
          ariaLabel: t('submanager.dashboard.summary.chartLabel'),
        }}
        paymentMethods={paymentMethods}
        expenseSources={expenseSources}
      />
      <section className="submanager-dashboard-page__stats" aria-label={t('submanager.dashboard.stats.operations')}>
        <StatCard
          label={t('submanager.dashboard.stats.revenue')}
          value={formatCurrency(data.revenueTotal, language)}
          hint={t('submanager.dashboard.stats.revenueHint')}
          icon={<Wallet aria-hidden="true" />}
          tone="green"
        />
        <StatCard
          label={t('submanager.dashboard.stats.expenses')}
          value={formatCurrency(data.expenseTotal, language)}
          hint={t('submanager.dashboard.stats.expensesHint')}
          icon={<Receipt aria-hidden="true" />}
          tone="gold"
        />
        <StatCard
          label={t('submanager.dashboard.stats.net')}
          value={formatCurrency(data.netAmount, language)}
          hint={t('submanager.dashboard.stats.netHint')}
          icon={<ChartNoAxesCombined aria-hidden="true" />}
          tone="green"
        />
        <StatCard
          label={t('submanager.dashboard.stats.operations')}
          value={data.operationCount}
          hint={t('submanager.dashboard.stats.operationsHint')}
          icon={<Activity aria-hidden="true" />}
          tone="gold"
        />
      </section>
    </div>
  );
}

