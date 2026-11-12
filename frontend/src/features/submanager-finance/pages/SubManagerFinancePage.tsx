import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, ChartNoAxesCombined, ChevronLeft, ChevronRight, Download, Receipt, Wallet } from 'lucide-react';
import { FinanceSummaryCard } from '../../../components/common/FinanceSummaryCard';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { FilterBar } from '../../../components/common/FilterBar';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { TableCard } from '../../../components/common/TableCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Pagination } from '../../../components/ui/Pagination';
import { Select } from '../../../components/ui/Select';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../components/common/toast.context';
import { ROUTES } from '../../../core/constants/routes';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { exportCsv } from '../../../utils/exportCsv';
import { formatClock, formatCurrency, formatNumber } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import { ExpenseDrawer } from '../components/ExpenseDrawer';
import { PaymentDrawer } from '../components/PaymentDrawer';
import { useSubManagerFinance } from '../hooks/useSubManagerFinance';
import {
  subManagerFinanceQueryKeys,
  updateExpense,
  updatePaymentStatus,
} from '../services/finance.api';
import type {
  ExpenseCategory,
  ExpenseUpdate,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
} from '../types/submanager-finance.types';
import './SubManagerFinancePage.css';

const PAGE_SIZE = 5;
const CHART_HOURS = [8, 10, 12, 14, 16];
const PAYMENT_METHODS: PaymentMethod[] = ['instapay', 'cash', 'vodafone_cash'];
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'cleaning_supplies',
  'maintenance_supplies',
  'electricity',
  'emergency',
];
const PAYMENT_TONES: Record<PaymentMethod, 'purple' | 'neutral' | 'info'> = {
  instapay: 'purple',
  cash: 'neutral',
  vodafone_cash: 'info',
};
const EXPENSE_TONES: Record<ExpenseCategory, 'success' | 'warning' | 'neutral' | 'danger'> = {
  cleaning_supplies: 'success',
  maintenance_supplies: 'warning',
  electricity: 'neutral',
  emergency: 'danger',
};
const PAYMENT_STATUSES: PaymentStatus[] = ['completed', 'pending', 'refunded', 'cancelled'];
const expenseToastKeys = new Set<string>();

function paymentRevenue(record: PaymentRecord): boolean {
  return record.status === 'completed' || record.status === 'refunded';
}

function totalOf<T extends { amount: number }>(records: T[]): number {
  return records.reduce((total, record) => total + record.amount, 0);
}

function translatedLabel(t: (key: string) => string, group: string, value: string): string {
  return t(`submanager.dashboard.${group}.${value}`);
}

function paymentGuest(payment: PaymentRecord, language: string): string {
  return language === 'en' ? payment.guestEn ?? payment.guest : payment.guest;
}

function expenseNotes(expense: { notes: string; notesEn?: string }, language: string): string {
  return language === 'en' ? expense.notesEn ?? expense.notes : expense.notes;
}

function methodTone(status: PaymentStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'completed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'refunded') return 'danger';
  return 'neutral';
}

export function SubManagerFinancePage() {
  const { language, t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const expenseSaveInProgress = useRef(false);
  const financeQuery = useSubManagerFinance();
  const { data, isPending, isError, error, refetch } = financeQuery;
  const tab = searchParams.get('tab') === 'expenses' ? 'expenses' : 'revenues';
  const pageRequested = Math.max(1, Number(searchParams.get('page')) || 1);
  const recordId = searchParams.get('id');

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  };

  const paymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PaymentStatus }) => updatePaymentStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: subManagerFinanceQueryKeys.ledger() });
      toast.notify(t('submanager.finance.actions.paymentUpdated'), 'success');
    },
    onError: () => toast.notify(t('submanager.finance.actions.updateFailed'), 'error'),
  });
  const expenseMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: ExpenseUpdate }) => updateExpense(id, values),
    onError: () => toast.notify(t('submanager.finance.actions.updateFailed'), 'error'),
  });

  const hero = (
    <PageHero
      eyebrow={t('submanager.finance.eyebrow')}
      title={t('submanager.finance.pageTitle')}
      description={t('submanager.finance.description')}
      className="submanager-finance-page__hero"
    >
      <Button variant="gold" onClick={() => navigate(ROUTES.subManagerReports)}>
        <Activity aria-hidden="true" />
        {t('submanager.finance.viewReports')}
      </Button>
    </PageHero>
  );

  if (isPending) return <div className="submanager-finance-page">{hero}<LoadingState label={t('submanager.finance.loading')} /></div>;
  if (isError || !data) {
    return (
      <div className="submanager-finance-page">
        {hero}
        <ErrorState
          title={t('submanager.finance.loadError')}
          message={getErrorMessage(error, language)}
          action={<Button onClick={() => { void refetch(); }}>{t('submanager.finance.retry')}</Button>}
        />
      </div>
    );
  }

  const settledPayments = data.payments.filter(paymentRevenue);
  const revenueTotal = totalOf(settledPayments);
  const expenseTotal = totalOf(data.expenses);
  const netAmount = revenueTotal - expenseTotal;
  const refundedTotal = totalOf(data.payments.filter((payment) => payment.status === 'refunded'));
  const paymentMethods = PAYMENT_METHODS.map((method) => ({
    id: method,
    label: translatedLabel(t, 'paymentMethods', method),
    amount: totalOf(settledPayments.filter((payment) => payment.method === method)),
    tone: method === 'instapay' ? 'green' as const : method === 'cash' ? 'gold' as const : 'amber' as const,
  }));
  const expenseSources = EXPENSE_CATEGORIES.map((category) => ({
    id: category,
    label: translatedLabel(t, 'expenseSources', category),
    amount: totalOf(data.expenses.filter((expense) => expense.category === category)),
    tone: EXPENSE_TONES[category] === 'success' ? 'green' as const
      : EXPENSE_TONES[category] === 'warning' ? 'gold' as const
        : EXPENSE_TONES[category] === 'danger' ? 'rose' as const : 'amber' as const,
  }));
  const chartPoints = CHART_HOURS.map((hour) => totalOf(settledPayments.filter((payment) => Number(payment.time.slice(0, 2)) <= hour)));
  const chartDate = data.payments[0]?.date ?? data.expenses[0]?.date ?? new Date().toISOString().slice(0, 10);
  const [year, month, day] = chartDate.split('-').map(Number);
  const chartLabels = CHART_HOURS.map((hour) => formatClock(new Date(year, month - 1, day, hour), language));

  const revenueSearch = searchParams.get('revenueSearch') ?? '';
  const expenseSearch = searchParams.get('expenseSearch') ?? '';
  const selectedMethod = searchParams.get('method') ?? '';
  const selectedStatus = searchParams.get('status') ?? '';
  const selectedCategory = searchParams.get('category') ?? '';
  const paymentDate = searchParams.get('paymentDate') ?? '';
  const expenseDate = searchParams.get('expenseDate') ?? '';

  const filteredPayments = data.payments.filter((payment) => {
    const query = revenueSearch.trim().toLocaleLowerCase();
    return (!query || `${paymentGuest(payment, language)} ${payment.id}`.toLocaleLowerCase().includes(query))
      && (!selectedMethod || payment.method === selectedMethod)
      && (!selectedStatus || payment.status === selectedStatus)
      && (!paymentDate || payment.date === paymentDate);
  });
  const filteredExpenses = data.expenses.filter((expense) => {
    const query = expenseSearch.trim().toLocaleLowerCase();
    const category = translatedLabel(t, 'expenseSources', expense.category);
    return (!query || `${category} ${expenseNotes(expense, language)}`.toLocaleLowerCase().includes(query))
      && (!selectedCategory || expense.category === selectedCategory)
      && (!expenseDate || expense.date === expenseDate);
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / PAGE_SIZE));
  const currentPage = Math.min(pageRequested, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const visiblePayments = filteredPayments.slice(firstIndex, firstIndex + PAGE_SIZE);
  const tableSummary = t('submanager.finance.revenueTable.summary')
    .replace('{rows}', formatNumber(visiblePayments.length, language))
    .replace('{total}', formatNumber(filteredPayments.length, language));

  const resetFilters = () => {
    const updates: Record<string, string | null> = tab === 'revenues'
      ? { revenueSearch: null, method: null, status: null, paymentDate: null, page: null }
      : { expenseSearch: null, category: null, expenseDate: null };
    setParams(updates);
  };

  const closeDrawer = () => setParams({ id: null });
  const openRecord = (id: string) => setParams({ id });

  const exportPayments = () => {
    const exported = exportCsv(filteredPayments, [
      { header: t('submanager.finance.revenueTable.transaction'), value: (payment) => payment.id },
      { header: t('submanager.finance.revenueTable.room'), value: (payment) => payment.room },
      { header: t('submanager.finance.revenueTable.guest'), value: (payment) => paymentGuest(payment, language) },
      { header: t('submanager.finance.revenueTable.amount'), value: (payment) => payment.amount },
      { header: t('submanager.finance.revenueTable.method'), value: (payment) => translatedLabel(t, 'paymentMethods', payment.method) },
      { header: t('submanager.finance.revenueTable.time'), value: (payment) => `${payment.date} ${payment.time}` },
      { header: t('submanager.finance.revenueTable.status'), value: (payment) => t(`submanager.finance.status.${payment.status}`) },
    ], 'submanager-revenues.csv');
    toast.notify(t(exported ? 'submanager.finance.actions.exported' : 'submanager.finance.actions.noExport'), exported ? 'success' : 'info');
  };

  const exportExpenses = () => {
    const exported = exportCsv(filteredExpenses, [
      { header: t('submanager.finance.expenseTable.record'), value: (expense) => expense.id },
      { header: t('submanager.finance.expenseTable.category'), value: (expense) => translatedLabel(t, 'expenseSources', expense.category) },
      { header: t('submanager.finance.expenseTable.amount'), value: (expense) => expense.amount },
      { header: t('submanager.finance.expenseTable.date'), value: (expense) => expense.date },
      { header: t('submanager.finance.expenseTable.time'), value: (expense) => expense.time },
      { header: t('submanager.finance.expenseTable.notes'), value: (expense) => expenseNotes(expense, language) },
      { header: t('submanager.finance.expenseTable.recordedBy'), value: (expense) => language === 'en' ? expense.recordedByEn ?? expense.recordedBy : expense.recordedBy },
    ], 'submanager-expenses.csv');
    toast.notify(t(exported ? 'submanager.finance.actions.exported' : 'submanager.finance.actions.noExport'), exported ? 'success' : 'info');
  };

  const selectedPayment = data.payments.find((payment) => payment.id === recordId);
  const selectedExpense = data.expenses.find((expense) => expense.id === recordId);
  const rowChevron = language === 'ar' ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />;
  const paymentMethodOptions = [
    { value: '', label: t('submanager.finance.filters.all') },
    ...PAYMENT_METHODS.map((method) => ({ value: method, label: translatedLabel(t, 'paymentMethods', method) })),
  ];
  const paymentStatusOptions = [
    { value: '', label: t('submanager.finance.filters.all') },
    ...PAYMENT_STATUSES.map((status) => ({ value: status, label: t(`submanager.finance.status.${status}`) })),
  ];
  const expenseCategoryOptions = [
    { value: '', label: t('submanager.finance.filters.all') },
    ...EXPENSE_CATEGORIES.map((category) => ({ value: category, label: translatedLabel(t, 'expenseSources', category) })),
  ];

  return (
    <div className="submanager-finance-page">
      {hero}

      <section className="submanager-finance-page__stats" aria-label={t('submanager.finance.stats.net')}>
        <StatCard label={t('submanager.finance.stats.revenue')} value={formatCurrency(revenueTotal, language)} icon={<Wallet aria-hidden="true" />} tone="green" />
        <StatCard label={t('submanager.finance.stats.expenses')} value={formatCurrency(expenseTotal, language)} icon={<Receipt aria-hidden="true" />} tone="gold" />
        <StatCard label={t('submanager.finance.stats.net')} value={formatCurrency(netAmount, language)} icon={<ChartNoAxesCombined aria-hidden="true" />} tone="green" />
      </section>

      <FinanceSummaryCard
        title={t('submanager.finance.summary.title')}
        netAmount={netAmount}
        caption={t('submanager.finance.summary.caption')}
        revenueAmount={revenueTotal}
        expenseAmount={expenseTotal}
        refundedAmount={refundedTotal}
        labels={{
          net: t('submanager.finance.stats.net'),
          revenue: t('submanager.dashboard.summary.revenue'),
          expenses: t('submanager.dashboard.summary.expenses'),
          refunded: t('submanager.dashboard.summary.refunded'),
          paymentMethods: t('submanager.dashboard.summary.paymentMethods'),
          expenseSources: t('submanager.dashboard.summary.expenseSources'),
        }}
        chart={{ points: chartPoints, labels: chartLabels, ariaLabel: t('submanager.finance.summary.chartLabel') }}
        paymentMethods={paymentMethods}
        expenseSources={expenseSources}
      />

      <Card className="submanager-finance-page__tabs">
        <SegmentedControl
          name={t('submanager.finance.tabs.label')}
          value={tab}
          onChange={(value) => setParams({ tab: value, page: '1' })}
          options={[
            { value: 'revenues', label: t('submanager.finance.tabs.revenues') },
            { value: 'expenses', label: t('submanager.finance.tabs.expenses') },
          ]}
        />
        <Button variant="secondary" onClick={tab === 'revenues' ? exportPayments : exportExpenses}>
          <Download aria-hidden="true" />
          {t('submanager.finance.actions.exportCsv')}
        </Button>
      </Card>

      <Card className="filters-card submanager-finance-page__filters">
        {tab === 'revenues' ? (
          <FilterBar
            columns={4}
            value={revenueSearch}
            onChange={(value) => setParams({ revenueSearch: value, page: '1' })}
            placeholder={t('submanager.finance.filters.searchRevenues')}
            onReset={resetFilters}
            resetLabel={t('submanager.finance.filters.reset')}
          >
            <Select value={selectedMethod} options={paymentMethodOptions} label={t('submanager.finance.filters.paymentMethod')} onChange={(value) => setParams({ method: value, page: '1' })} />
            <Select value={selectedStatus} options={paymentStatusOptions} label={t('submanager.finance.filters.status')} onChange={(value) => setParams({ status: value, page: '1' })} />
            <Input type="date" aria-label={t('submanager.finance.filters.date')} value={paymentDate} onChange={(event) => setParams({ paymentDate: event.target.value, page: '1' })} />
          </FilterBar>
        ) : (
          <FilterBar
            columns={3}
            value={expenseSearch}
            onChange={(value) => setParams({ expenseSearch: value })}
            placeholder={t('submanager.finance.filters.searchExpenses')}
            onReset={resetFilters}
            resetLabel={t('submanager.finance.filters.reset')}
          >
            <Select value={selectedCategory} options={expenseCategoryOptions} label={t('submanager.finance.filters.category')} onChange={(value) => setParams({ category: value })} />
            <Input type="date" aria-label={t('submanager.finance.filters.date')} value={expenseDate} onChange={(event) => setParams({ expenseDate: event.target.value })} />
          </FilterBar>
        )}
      </Card>

      {tab === 'revenues' ? (
        <TableCard
          title={t('submanager.finance.revenueTable.title')}
          badge={<Badge tone="success">{t('submanager.finance.revenueTable.count').replace('{count}', formatNumber(filteredPayments.length, language))}</Badge>}
          footer={(
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setParams({ page: String(page) })}
              pageLabel={tableSummary}
              previousLabel={t('pagination.previous')}
              nextLabel={t('pagination.next')}
              navigationLabel={t('pagination.label')}
            />
          )}
        >
          {filteredPayments.length === 0 ? (
            <EmptyState title={t('submanager.finance.revenueTable.empty')} description={t('submanager.finance.revenueTable.emptyDescription')} />
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table" aria-label={t('submanager.finance.revenueTable.title')}>
                <thead><tr>
                  <th>{t('submanager.finance.revenueTable.transaction')}</th>
                  <th>{t('submanager.finance.revenueTable.room')}</th>
                  <th>{t('submanager.finance.revenueTable.guest')}</th>
                  <th>{t('submanager.finance.revenueTable.amount')}</th>
                  <th>{t('submanager.finance.revenueTable.method')}</th>
                  <th>{t('submanager.finance.revenueTable.time')}</th>
                  <th>{t('submanager.finance.revenueTable.status')}</th>
                  <th aria-label={t('submanager.finance.revenueTable.title')} />
                </tr></thead>
                <tbody>
                  {visiblePayments.map((payment) => (
                    <tr key={payment.id}>
                      <td><bdi>{payment.id}</bdi></td>
                      <td><span className="table-card__chip">{payment.room}</span></td>
                      <td>{paymentGuest(payment, language)}</td>
                      <td className="submanager-finance-page__amount">{formatCurrency(payment.amount, language)}</td>
                      <td><Badge tone={PAYMENT_TONES[payment.method]}>{translatedLabel(t, 'paymentMethods', payment.method)}</Badge></td>
                      <td>{formatClock(new Date(`${payment.date}T${payment.time}:00`), language)}</td>
                      <td><Badge tone={methodTone(payment.status)}>{t(`submanager.finance.status.${payment.status}`)}</Badge></td>
                      <td><button type="button" className="table-card__open" aria-label={t('submanager.finance.revenueTable.open').replace('{id}', payment.id)} onClick={() => openRecord(payment.id)}>{rowChevron}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      ) : (
        <TableCard
          title={t('submanager.finance.expenseTable.title')}
          badge={<Badge tone="success">{t('submanager.finance.expenseTable.count').replace('{count}', formatNumber(filteredExpenses.length, language))}</Badge>}
        >
          {filteredExpenses.length === 0 ? (
            <EmptyState title={t('submanager.finance.expenseTable.empty')} description={t('submanager.finance.expenseTable.emptyDescription')} />
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table" aria-label={t('submanager.finance.expenseTable.title')}>
                <thead><tr>
                  <th>{t('submanager.finance.expenseTable.record')}</th>
                  <th>{t('submanager.finance.expenseTable.category')}</th>
                  <th>{t('submanager.finance.expenseTable.amount')}</th>
                  <th>{t('submanager.finance.expenseTable.date')}</th>
                  <th>{t('submanager.finance.expenseTable.time')}</th>
                  <th>{t('submanager.finance.expenseTable.notes')}</th>
                  <th>{t('submanager.finance.expenseTable.recordedBy')}</th>
                  <th aria-label={t('submanager.finance.expenseTable.title')} />
                </tr></thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td><bdi>{expense.id}</bdi></td>
                      <td><Badge tone={EXPENSE_TONES[expense.category]}>{translatedLabel(t, 'expenseSources', expense.category)}</Badge></td>
                      <td className="submanager-finance-page__amount">{formatCurrency(expense.amount, language)}</td>
                      <td>{formatDate(new Date(`${expense.date}T12:00:00`), language)}</td>
                      <td>{formatClock(new Date(`${expense.date}T${expense.time}:00`), language)}</td>
                      <td className="submanager-finance-page__notes">{expenseNotes(expense, language)}</td>
                      <td>{language === 'en' ? expense.recordedByEn ?? expense.recordedBy : expense.recordedBy}</td>
                      <td><button type="button" className="table-card__open" aria-label={t('submanager.finance.expenseTable.open').replace('{id}', expense.id)} onClick={() => openRecord(expense.id)}>{rowChevron}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableCard>
      )}

      {selectedPayment && (
        <PaymentDrawer
          key={selectedPayment.id}
          payment={selectedPayment}
          busy={paymentMutation.isPending}
          onClose={closeDrawer}
          onSave={async (status) => {
            try { await paymentMutation.mutateAsync({ id: selectedPayment.id, status }); } catch { /* Toast reports the failure. */ }
          }}
        />
      )}
      {selectedExpense && (
        <ExpenseDrawer
          key={selectedExpense.id}
          expense={selectedExpense}
          busy={expenseMutation.isPending}
          onClose={closeDrawer}
          onSave={async (values) => {
            if (expenseSaveInProgress.current) return;
            expenseSaveInProgress.current = true;
            try {
              const localizedValues = language === 'en' ? { ...values, notesEn: values.notes } : values;
              await expenseMutation.mutateAsync({ id: selectedExpense.id, values: localizedValues });
              await queryClient.invalidateQueries({ queryKey: subManagerFinanceQueryKeys.ledger() });
              const toastKey = `${selectedExpense.id}:${JSON.stringify(values)}`;
              if (!expenseToastKeys.has(toastKey)) {
                expenseToastKeys.add(toastKey);
                toast.notify(t('submanager.finance.actions.expenseUpdated'), 'success');
                window.setTimeout(() => expenseToastKeys.delete(toastKey), 4500);
              }
            } catch {
              // The mutation's error callback reports the failure.
            } finally {
              expenseSaveInProgress.current = false;
            }
          }}
        />
      )}
    </div>
  );
}

