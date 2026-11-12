import { useState, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Share2 } from 'lucide-react';
import { PageHero } from '../../../components/common/PageHero';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { EmptyState } from '../../../components/common/EmptyState';
import { useToast } from '../../../components/ui/ToastContext';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatClock } from '../../../utils/format';
import { useReport } from '../hooks/useReport';
import type { ReportFilters, ReportPeriod } from '../types/manager-reports.types';
import { getDefaultReportFilters } from '../schemas/report-filters.schema';
import { exportReportSummary, exportReportChartData } from '../services/manager-reports.export';
import {
  ReportToolbar,
  ReportSummaryCard,
  ReportKpiCards,
  ReportChartsGrid,
  ReportFiltersDrawer,
  ReportDateRangeDrawer,
} from '../components';
import './ManagerReportsPage.css';

export function ManagerReportsPage() {
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  // 1. Period state synced with URL search parameter ?period= (default "daily")
  const [period, setPeriod] = useState<ReportPeriod>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('period');
      if (p === 'weekly' || p === 'monthly' || p === 'yearly' || p === 'daily') {
        return p;
      }
    }
    return 'daily';
  });

  // 2. Applied filters state synced with URL search parameters
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(() => {
    const defaults = getDefaultReportFilters();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return {
        date: params.get('date') || defaults.date,
        period: (params.get('period') as ReportPeriod) || defaults.period,
        floor: params.get('floor') || defaults.floor,
        roomType: params.get('roomType') || defaults.roomType,
        shift: params.get('shift') || defaults.shift,
        roomStatus: params.get('roomStatus') || defaults.roomStatus,
        paymentMethod: params.get('paymentMethod') || defaults.paymentMethod,
        expenseCategory: params.get('expenseCategory') || defaults.expenseCategory,
      };
    }
    return defaults;
  });

  // 3. Date range state synced with ?from= &to=
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      const to = params.get('to');
      if (from || to) {
        return { startDate: from || undefined, endDate: to || undefined };
      }
    }
    return {};
  });

  // 4. Drawer open states synced with URL (?filters=1, ?date_range=1)
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('filters') === '1';
    }
    return false;
  });

  const [isDateRangeOpen, setIsDateRangeOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('date_range') === '1';
    }
    return false;
  });

  // 5. Last updated time state (for badge)
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  // Helper to sync state changes to window.location.search
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '' || value === 'ALL') {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, value);
        }
      });
      window.history.pushState({}, '', url.toString());
    },
    [],
  );

  // Handle period change from toolbar or drawer
  const handlePeriodChange = useCallback(
    (newPeriod: ReportPeriod) => {
      setPeriod(newPeriod);
      setAppliedFilters((prev) => ({ ...prev, period: newPeriod }));
      updateUrlParams({ period: newPeriod });
    },
    [updateUrlParams],
  );

  // Handle filters drawer actions
  const handleOpenFilters = useCallback(() => {
    setIsFiltersOpen(true);
    updateUrlParams({ filters: '1' });
  }, [updateUrlParams]);

  const handleCloseFilters = useCallback(() => {
    setIsFiltersOpen(false);
    updateUrlParams({ filters: null });
  }, [updateUrlParams]);

  const handleApplyFilters = useCallback(
    (newFilters: ReportFilters) => {
      setAppliedFilters(newFilters);
      setPeriod(newFilters.period);
      setIsFiltersOpen(false);

      updateUrlParams({
        filters: null,
        period: newFilters.period,
        date: newFilters.date !== getDefaultReportFilters().date ? newFilters.date : null,
        floor: newFilters.floor,
        roomType: newFilters.roomType,
        shift: newFilters.shift,
        roomStatus: newFilters.roomStatus,
        paymentMethod: newFilters.paymentMethod,
        expenseCategory: newFilters.expenseCategory,
      });

      showToast(t('manager.reports.filtersDrawer.toastApplied'), 'success');
    },
    [updateUrlParams, showToast, t],
  );

  const handleResetFilters = useCallback(() => {
    const defaults = getDefaultReportFilters();
    setAppliedFilters(defaults);
    setPeriod(defaults.period);
    setIsFiltersOpen(false);

    updateUrlParams({
      filters: null,
      period: 'daily',
      date: null,
      floor: null,
      roomType: null,
      shift: null,
      roomStatus: null,
      paymentMethod: null,
      expenseCategory: null,
    });

    showToast(t('manager.reports.filtersDrawer.toastReset'), 'success');
  }, [updateUrlParams, showToast, t]);

  // Handle date range drawer actions
  const handleOpenDateRange = useCallback(() => {
    setIsDateRangeOpen(true);
    updateUrlParams({ date_range: '1' });
  }, [updateUrlParams]);

  const handleCloseDateRange = useCallback(() => {
    setIsDateRangeOpen(false);
    updateUrlParams({ date_range: null });
  }, [updateUrlParams]);

  const handleApplyDateRange = useCallback(
    (from: string, to: string) => {
      setDateRange({ startDate: from, endDate: to });
      setIsDateRangeOpen(false);
      updateUrlParams({
        date_range: null,
        from: from || null,
        to: to || null,
      });
      showToast(t('manager.reports.dateRangeDrawer.toastApplied'), 'success');
    },
    [updateUrlParams, showToast, t],
  );

  const handleResetDateRange = useCallback(() => {
    setDateRange({});
    setIsDateRangeOpen(false);
    updateUrlParams({
      date_range: null,
      from: null,
      to: null,
    });
  }, [updateUrlParams]);

  // Browser back/forward navigation sync
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('period');
      if (p === 'weekly' || p === 'monthly' || p === 'yearly' || p === 'daily') {
        setPeriod(p);
      } else {
        setPeriod('daily');
      }

      setIsFiltersOpen(params.get('filters') === '1');
      setIsDateRangeOpen(params.get('date_range') === '1');

      const from = params.get('from');
      const to = params.get('to');
      setDateRange(from || to ? { startDate: from || undefined, endDate: to || undefined } : {});
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 6. Fetch aggregated report data via TanStack Query hook
  const { data: snapshot, isLoading, isError, refetch } = useReport(
    period,
    appliedFilters,
    dateRange,
  );

  // 7. Hero Action: "إنشاء التقرير" (Refresh, update badge time, export summary CSV)
  const handleGenerateReport = useCallback(async () => {
    await refetch();
    const nowTime = formatClock(new Date(), language);
    setLastUpdatedTime(nowTime);

    if (snapshot) {
      exportReportSummary(snapshot, language === 'ar' ? 'ar' : 'en');
      showToast(t('manager.reports.toastReportGenerated'), 'success');
    }
  }, [refetch, language, snapshot, showToast, t]);

  // 8. Hero Action: "تصدير" (Export chart series & room data CSV)
  const handleExportChartData = useCallback(() => {
    if (snapshot) {
      exportReportChartData(snapshot, language === 'ar' ? 'ar' : 'en');
      showToast(t('manager.reports.toastExported'), 'success');
    }
  }, [snapshot, language, showToast, t]);

  // 9. Toolbar Action: "طباعة" and "PDF" (Call native print dialog with print CSS)
  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  return (
    <div className="manager-reports-page">
      {/* 1. Page Hero: Eyebrow, Title, Subtitle, Gold & Glass action buttons */}
      <PageHero
        eyebrow={t('manager.reports.hero.eyebrow')}
        title={t('manager.reports.hero.title')}
        description={t('manager.reports.hero.subtitle')}
        variant="brand"
      >
        {/* Secondary Action: Export Chart Data (glass button) */}
        <Button
          variant="glass"
          className="manager-reports-page__hero-btn"
          onClick={handleExportChartData}
          aria-label={t('manager.reports.hero.export')}
        >
          <Share2 size={16} aria-hidden="true" />
          <span>{t('manager.reports.hero.export')}</span>
        </Button>

        {/* Primary Action: Generate Report (gold button) */}
        <Button
          variant="gold"
          className="manager-reports-page__hero-btn"
          onClick={() => {
            void handleGenerateReport();
          }}
          aria-label={t('manager.reports.hero.generateReport')}
        >
          <FileSpreadsheet size={16} aria-hidden="true" />
          <span>{t('manager.reports.hero.generateReport')}</span>
        </Button>
      </PageHero>

      {/* 2. Toolbar: Period SegmentedControl + Filters/DateRange/Print/PDF buttons */}
      <ReportToolbar
        period={period}
        onPeriodChange={handlePeriodChange}
        onOpenFilters={handleOpenFilters}
        onOpenDateRange={handleOpenDateRange}
        onPrint={handlePrint}
        onExportPdf={handlePrint}
      />

      {/* 3. Main Content Body with Loading / Error / Empty States */}
      {isLoading ? (
        <div className="manager-reports-page__state-wrapper">
          <LoadingState label={t('manager.reports.loading')} />
        </div>
      ) : isError ? (
        <div className="manager-reports-page__state-wrapper">
          <ErrorState
            title={t('manager.reports.errorTitle')}
            message={t('manager.reports.errorTitle')}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  void refetch();
                }}
              >
                {t('manager.reports.errorRetry')}
              </Button>
            }
          />
        </div>
      ) : !snapshot ? (
        <div className="manager-reports-page__state-wrapper">
          <EmptyState
            title={t('manager.reports.empty')}
            description={t('manager.reports.empty')}
          />
        </div>
      ) : (
        <div className="manager-reports-page__content">
          {/* A. Report Summary Card (Print Area) */}
          <ReportSummaryCard
            snapshot={snapshot}
            period={period}
            lastUpdatedTime={lastUpdatedTime ?? undefined}
          />

          {/* B. 4 Small KPI Cards */}
          <ReportKpiCards snapshot={snapshot} />

          {/* C. 4 Cards 2x2 Grid: Charts and Performance Metrics */}
          <ReportChartsGrid snapshot={snapshot} />
        </div>
      )}

      {/* 4. Advanced Filters Drawer */}
      <ReportFiltersDrawer
        open={isFiltersOpen}
        onClose={handleCloseFilters}
        filters={appliedFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* 5. Custom Date Range Drawer */}
      <ReportDateRangeDrawer
        open={isDateRangeOpen}
        onClose={handleCloseDateRange}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onApply={handleApplyDateRange}
        onReset={handleResetDateRange}
      />
    </div>
  );
}
