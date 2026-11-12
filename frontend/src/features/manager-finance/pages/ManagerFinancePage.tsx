import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileText } from 'lucide-react';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { SegmentedControl, type SegmentedControlOption } from '../../../components/ui/SegmentedControl';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { ROUTES } from '../../../core/constants/routes';
import {
  useDailyClosingCurrent,
  useExpenses,
  useHourlyRevenue,
  usePayments,
} from '../hooks';
import {
  FinanceStatCards,
  FinanceRevenueCard,
  FinanceRevenuesFilterCard,
  FinanceRevenuesTable,
  PaymentDetailsDrawer,
  FinanceExpensesFilterCard,
  FinanceExpensesTable,
  ExpenseDetailsDrawer,
} from '../components';
import './ManagerFinancePage.css';

const ROWS_PER_PAGE = 5;

export function ManagerFinancePage() {
  const { language, t } = useLanguage();

  const isHarness =
    typeof window !== 'undefined' &&
    window.location.pathname.includes('manager-preview.html');
  const pageParamKey = isHarness ? 'p' : 'page';

  // 1. Tab state synced with URL search param ?tab= (default "revenues")
  const [activeTab, setActiveTab] = useState<'revenues' | 'expenses'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'expenses') return 'expenses';
    }
    return 'revenues';
  });

  // 2. Filter states synced with URL
  const [search, setSearch] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('search') || '';
    }
    return '';
  });

  const [method, setMethod] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('method') || 'ALL';
    }
    return 'ALL';
  });

  const [status, setStatus] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('status') || 'ALL';
    }
    return 'ALL';
  });

  const [category, setCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('category') || 'ALL';
    }
    return 'ALL';
  });

  const [date, setDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('date') || 'ALL';
    }
    return 'ALL';
  });

  const [page, setPage] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const raw = new URLSearchParams(window.location.search).get(pageParamKey);
      const parsed = raw ? parseInt(raw, 10) : 1;
      return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }
    return 1;
  });

  const [activeDrawerId, setActiveDrawerId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('id') || null;
    }
    return null;
  });

  // Helper to sync state changes to the URL
  const syncUrlParams = useCallback(
    (updates: {
      tab?: 'revenues' | 'expenses';
      search?: string;
      method?: string;
      status?: string;
      category?: string;
      date?: string;
      page?: number;
      id?: string | null;
    }) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);

      if (updates.tab !== undefined) {
        if (updates.tab === 'revenues') url.searchParams.delete('tab');
        else url.searchParams.set('tab', updates.tab);
      }
      if (updates.search !== undefined) {
        if (!updates.search.trim()) url.searchParams.delete('search');
        else url.searchParams.set('search', updates.search.trim());
      }
      if (updates.method !== undefined) {
        if (updates.method === 'ALL') url.searchParams.delete('method');
        else url.searchParams.set('method', updates.method);
      }
      if (updates.status !== undefined) {
        if (updates.status === 'ALL') url.searchParams.delete('status');
        else url.searchParams.set('status', updates.status);
      }
      if (updates.category !== undefined) {
        if (updates.category === 'ALL') url.searchParams.delete('category');
        else url.searchParams.set('category', updates.category);
      }
      if (updates.date !== undefined) {
        if (updates.date === 'ALL') url.searchParams.delete('date');
        else url.searchParams.set('date', updates.date);
      }
      if (updates.page !== undefined) {
        if (updates.page <= 1) url.searchParams.delete(pageParamKey);
        else url.searchParams.set(pageParamKey, String(updates.page));
      }
      if (updates.id !== undefined) {
        if (!updates.id) url.searchParams.delete('id');
        else url.searchParams.set('id', updates.id);
      }

      window.history.replaceState({}, '', url.toString());
    },
    [pageParamKey],
  );

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveTab(params.get('tab') === 'expenses' ? 'expenses' : 'revenues');
      setSearch(params.get('search') || '');
      setMethod(params.get('method') || 'ALL');
      setStatus(params.get('status') || 'ALL');
      setCategory(params.get('category') || 'ALL');
      setDate(params.get('date') || 'ALL');
      const rawPage = params.get(pageParamKey);
      const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
      setPage(Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage);
      setActiveDrawerId(params.get('id') || null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pageParamKey]);

  // Tab change
  const handleTabChange = (value: string) => {
    const nextTab = value === 'expenses' ? 'expenses' : 'revenues';
    setActiveTab(nextTab);
    setSearch('');
    setDate('ALL');
    setCategory('ALL');
    setMethod('ALL');
    setStatus('ALL');
    setPage(1);
    syncUrlParams({
      tab: nextTab,
      search: '',
      method: 'ALL',
      status: 'ALL',
      category: 'ALL',
      date: 'ALL',
      page: 1,
      id: null,
    });
  };

  // Filter change handlers (reset page to 1)
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    syncUrlParams({ search: val, page: 1 });
  };

  const handleMethodChange = (val: string) => {
    setMethod(val);
    setPage(1);
    syncUrlParams({ method: val, page: 1 });
  };

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setPage(1);
    syncUrlParams({ status: val, page: 1 });
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setPage(1);
    syncUrlParams({ category: val, page: 1 });
  };

  const handleDateChange = (val: string) => {
    setDate(val);
    setPage(1);
    syncUrlParams({ date: val, page: 1 });
  };

  const handleResetFilters = () => {
    setSearch('');
    setMethod('ALL');
    setStatus('ALL');
    setCategory('ALL');
    setDate('ALL');
    setPage(1);
    syncUrlParams({
      search: '',
      method: 'ALL',
      status: 'ALL',
      category: 'ALL',
      date: 'ALL',
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    syncUrlParams({ page: newPage });
  };

  const handleSelectDrawerItem = (id: string) => {
    setActiveDrawerId(id);
    syncUrlParams({ id });
  };

  const handleCloseDrawer = () => {
    setActiveDrawerId(null);
    syncUrlParams({ id: null });
  };

  const handleNavigateToReports = () => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.includes('manager-preview.html')) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', 'manager-reports');
        window.location.href = url.toString();
        return;
      }
      window.location.href = ROUTES.managerReports;
    }
  };

  // ===================== DATA HOOKS =====================
  const {
    data: dailyClosing,
    isLoading: isClosingLoading,
    isError: isClosingError,
    error: closingError,
    refetch: refetchClosing,
  } = useDailyClosingCurrent();

  // 1. All expenses for KPIs and global calculation
  const {
    data: allExpensesData,
    isLoading: isExpensesLoading,
    isError: isExpensesError,
    error: expensesError,
    refetch: refetchAllExpenses,
  } = useExpenses({ limit: 100 });

  // 2. Paginated & filtered expenses for the Expenses Table
  const expenseFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      category: category !== 'ALL' ? category : undefined,
      date: date !== 'ALL' ? date : undefined,
      limit: ROWS_PER_PAGE,
    }),
    [search, category, date],
  );

  const {
    data: paginatedExpensesData,
    isLoading: isPaginatedExpensesLoading,
    isError: isPaginatedExpensesError,
    error: paginatedExpensesError,
    refetch: refetchPaginatedExpenses,
  } = useExpenses(expenseFilters, page);

  const {
    data: hourlyRevenue,
    isLoading: isHourlyLoading,
    isError: isHourlyError,
    error: hourlyError,
    refetch: refetchHourly,
  } = useHourlyRevenue();

  // Paginated payments list for the table
  const paymentsFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      method: method !== 'ALL' ? method : undefined,
      status: status !== 'ALL' ? status : undefined,
      date: date !== 'ALL' ? date : undefined,
      limit: ROWS_PER_PAGE,
    }),
    [search, method, status, date],
  );

  const {
    data: paymentsData,
    isLoading: isPaymentsLoading,
    isError: isPaymentsError,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments(paymentsFilters, page);

  // Complete payments query to look up drawer details by ID
  const { data: allPaymentsData } = usePayments({ limit: 100 });

  // Determine if activeDrawerId targets a payment or an expense
  const isTargetingExpense = useMemo(() => {
    if (!activeDrawerId) return false;
    if (activeDrawerId.startsWith('EXP-')) return true;
    if (activeDrawerId.startsWith('PAY-')) return false;
    return activeTab === 'expenses';
  }, [activeDrawerId, activeTab]);

  const selectedTransaction = useMemo(() => {
    if (!activeDrawerId || isTargetingExpense) return null;
    return (
      allPaymentsData?.transactions.find(
        (t) =>
          t.transactionNumber === activeDrawerId || t.id === activeDrawerId,
      ) ??
      paymentsData?.transactions.find(
        (t) =>
          t.transactionNumber === activeDrawerId || t.id === activeDrawerId,
      ) ??
      null
    );
  }, [activeDrawerId, isTargetingExpense, allPaymentsData, paymentsData]);

  const selectedExpense = useMemo(() => {
    if (!activeDrawerId || !isTargetingExpense) return null;
    return (
      allExpensesData?.expenses.find(
        (e) =>
          e.expenseNumber === activeDrawerId || e.id === activeDrawerId,
      ) ??
      paginatedExpensesData?.expenses.find(
        (e) =>
          e.expenseNumber === activeDrawerId || e.id === activeDrawerId,
      ) ??
      null
    );
  }, [activeDrawerId, isTargetingExpense, allExpensesData, paginatedExpensesData]);

  const isLoading = isClosingLoading || isExpensesLoading || isHourlyLoading;
  const isError = isClosingError || isExpensesError || isHourlyError;
  const activeError = closingError || expensesError || hourlyError;

  const handleRetry = () => {
    refetchClosing();
    refetchAllExpenses();
    refetchPaginatedExpenses();
    refetchHourly();
    refetchPayments();
  };

  // Computed financial totals
  const totalRevenue = dailyClosing?.total_revenue ?? 24850;
  const currentExpenses = allExpensesData?.expenses ?? [];
  const expensesTotal =
    currentExpenses.length > 0
      ? currentExpenses.reduce((s, e) => s + e.amount, 0)
      : 3850;
  const netProfit = totalRevenue - expensesTotal;
  const refundedTotal = dailyClosing?.refunds_total ?? 7200;

  const methodTotals = {
    instapay: dailyClosing?.instapay_total ?? 11800,
    cash: dailyClosing?.cash_total ?? 5850,
    vodafone: dailyClosing?.vodafone_cash_total ?? 7200,
  };

  const cleaningTotal = currentExpenses
    .filter((e) => e.category === 'cleaning')
    .reduce((sum, e) => sum + e.amount, 0);

  const maintenanceTotal = currentExpenses
    .filter((e) => e.category === 'maintenance')
    .reduce((sum, e) => sum + e.amount, 0);

  const expenseCategoryTotals = {
    cleaning: cleaningTotal || 1250,
    maintenance: maintenanceTotal || 950,
  };

  const tabOptions: SegmentedControlOption[] = [
    {
      value: 'revenues',
      label: t('manager.finance.tabs.revenues'),
    },
    {
      value: 'expenses',
      label: t('manager.finance.tabs.expenses'),
    },
  ];

  return (
    <div className="manager-finance-page">
      {/* 1. Page Hero Banner */}
      <PageHero
        eyebrow={t('manager.finance.hero.eyebrow')}
        title={t('manager.finance.hero.title')}
        description={t('manager.finance.hero.subtitle')}
      >
        <Button
          variant="gold"
          onClick={handleNavigateToReports}
          className="manager-finance-hero-btn"
        >
          <FileText size={18} aria-hidden="true" style={{ marginInlineEnd: 8 }} />
          <span>{t('manager.finance.hero.viewReports')}</span>
        </Button>
      </PageHero>

      {/* 2. Loading / Error / Data Content */}
      {isLoading ? (
        <div className="manager-finance-page__state-wrapper">
          <LoadingState label={t('manager.finance.common.loading')} />
        </div>
      ) : isError ? (
        <div className="manager-finance-page__state-wrapper">
          <ErrorState
            title={t('manager.finance.common.errorTitle')}
            message={getErrorMessage(activeError, language)}
            action={
              <Button variant="secondary" onClick={handleRetry}>
                {t('manager.finance.common.retry')}
              </Button>
            }
          />
        </div>
      ) : (
        <main className="manager-finance-page__content">
          {/* 3 StatCards (Total Revenue, Total Expenses, Net Shift) */}
          <FinanceStatCards
            totalRevenue={totalRevenue}
            totalExpenses={expensesTotal}
            netShift={netProfit}
          />

          {/* Large Revenue Card with Shift Curve & Breakdown Chips */}
          <FinanceRevenueCard
            totalRevenue={totalRevenue}
            totalExpenses={expensesTotal}
            netProfit={netProfit}
            refundedTotal={refundedTotal}
            methodTotals={methodTotals}
            expenseCategoryTotals={expenseCategoryTotals}
            hourlyPoints={hourlyRevenue?.points}
          />

          {/* SegmentedControl Tabs Bar */}
          <div className="manager-finance-tabs-bar">
            <SegmentedControl
              options={tabOptions}
              value={activeTab}
              onChange={handleTabChange}
              size="md"
            />
          </div>

          {/* Tab Panes */}
          <section
            className="manager-finance-tab-container"
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-label={
              activeTab === 'revenues'
                ? t('manager.finance.tabs.revenues')
                : t('manager.finance.tabs.expenses')
            }
          >
            {activeTab === 'revenues' ? (
              <div
                className="manager-finance-tab-pane manager-finance-tab-pane--revenues"
                data-testid="tab-pane-revenues"
              >
                {/* Revenues Filter Card */}
                <FinanceRevenuesFilterCard
                  search={search}
                  method={method}
                  status={status}
                  date={date}
                  onSearchChange={handleSearchChange}
                  onMethodChange={handleMethodChange}
                  onStatusChange={handleStatusChange}
                  onDateChange={handleDateChange}
                  onReset={handleResetFilters}
                />

                {/* Revenues Table Card with Pagination */}
                {isPaymentsLoading ? (
                  <div className="manager-finance-page__table-loading">
                    <LoadingState label={t('manager.finance.common.loading')} />
                  </div>
                ) : isPaymentsError ? (
                  <ErrorState
                    title={t('manager.finance.common.errorTitle')}
                    message={getErrorMessage(paymentsError, language)}
                    action={
                      <Button variant="secondary" onClick={() => refetchPayments()}>
                        {t('manager.finance.common.retry')}
                      </Button>
                    }
                  />
                ) : (
                  <FinanceRevenuesTable
                    transactions={paymentsData?.transactions ?? []}
                    total={paymentsData?.total ?? 0}
                    page={page}
                    totalPages={paymentsData?.totalPages ?? 1}
                    limit={ROWS_PER_PAGE}
                    onPageChange={handlePageChange}
                    onSelectTransaction={handleSelectDrawerItem}
                    onResetFilters={handleResetFilters}
                  />
                )}
              </div>
            ) : (
              <div
                className="manager-finance-tab-pane manager-finance-tab-pane--expenses"
                data-testid="tab-pane-expenses"
              >
                {/* Expenses Filter Card */}
                <FinanceExpensesFilterCard
                  search={search}
                  category={category}
                  date={date}
                  onSearchChange={handleSearchChange}
                  onCategoryChange={handleCategoryChange}
                  onDateChange={handleDateChange}
                  onReset={handleResetFilters}
                />

                {/* Expenses Table Card with Pagination */}
                {isPaginatedExpensesLoading ? (
                  <div className="manager-finance-page__table-loading">
                    <LoadingState label={t('manager.finance.common.loading')} />
                  </div>
                ) : isPaginatedExpensesError ? (
                  <ErrorState
                    title={t('manager.finance.common.errorTitle')}
                    message={getErrorMessage(paginatedExpensesError, language)}
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => refetchPaginatedExpenses()}
                      >
                        {t('manager.finance.common.retry')}
                      </Button>
                    }
                  />
                ) : (
                  <FinanceExpensesTable
                    expenses={paginatedExpensesData?.expenses ?? []}
                    total={paginatedExpensesData?.total ?? 0}
                    page={page}
                    totalPages={paginatedExpensesData?.totalPages ?? 1}
                    limit={ROWS_PER_PAGE}
                    onPageChange={handlePageChange}
                    onSelectExpense={handleSelectDrawerItem}
                    onResetFilters={handleResetFilters}
                  />
                )}
              </div>
            )}
          </section>

          {/* Payment Details Drawer */}
          <PaymentDetailsDrawer
            transaction={selectedTransaction}
            open={!!activeDrawerId && !isTargetingExpense && !!selectedTransaction}
            onClose={handleCloseDrawer}
            onStatusUpdated={() => {
              refetchPayments();
              refetchClosing();
              refetchHourly();
            }}
          />

          {/* Expense Details Drawer */}
          <ExpenseDetailsDrawer
            expense={selectedExpense}
            open={!!activeDrawerId && isTargetingExpense && !!selectedExpense}
            onClose={handleCloseDrawer}
            onExpenseUpdated={() => {
              refetchAllExpenses();
              refetchPaginatedExpenses();
              refetchClosing();
              refetchHourly();
            }}
          />
        </main>
      )}
    </div>
  );
}
