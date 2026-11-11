import { useMemo } from 'react';
import { SlidersHorizontal, Calendar, Printer, FileDown } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SegmentedControl, type SegmentedControlOption } from '../../../components/ui/SegmentedControl';
import { useLanguage } from '../../../core/i18n/useLanguage';
import type { ReportPeriod } from '../types/manager-reports.types';
import './ReportToolbar.css';

export interface ReportToolbarProps {
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  onOpenFilters?: () => void;
  onOpenDateRange?: () => void;
  onPrint?: () => void;
  onExportPdf?: () => void;
  className?: string;
}

export function ReportToolbar({
  period,
  onPeriodChange,
  onOpenFilters,
  onOpenDateRange,
  onPrint,
  onExportPdf,
  className = '',
}: ReportToolbarProps) {
  const { t } = useLanguage();

  const periodOptions: SegmentedControlOption[] = useMemo(
    () => [
      {
        value: 'daily',
        label: t('manager.reports.toolbar.periods.daily'),
      },
      {
        value: 'weekly',
        label: t('manager.reports.toolbar.periods.weekly'),
      },
      {
        value: 'monthly',
        label: t('manager.reports.toolbar.periods.monthly'),
      },
      {
        value: 'yearly',
        label: t('manager.reports.toolbar.periods.yearly'),
      },
    ],
    [t],
  );

  return (
    <div className={`manager-reports-toolbar ${className}`.trim()} role="toolbar" aria-label={t('manager.reports.hero.title')}>
      {/* 1. Period switcher (in RTL: right side) */}
      <div className="manager-reports-toolbar__periods">
        <SegmentedControl
          options={periodOptions}
          value={period}
          onChange={(val) => onPeriodChange(val as ReportPeriod)}
          size="md"
        />
      </div>

      {/* 2. Action buttons (in RTL: left side) */}
      <div className="manager-reports-toolbar__actions">
        {/* Filters Button (opens drawer in Task 10) */}
        <Button
          variant="secondary"
          className="manager-reports-toolbar__btn"
          onClick={onOpenFilters}
          aria-label={t('manager.reports.toolbar.filters')}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>{t('manager.reports.toolbar.filters')}</span>
        </Button>

        {/* Date Range Button */}
        <Button
          variant="secondary"
          className="manager-reports-toolbar__btn"
          onClick={onOpenDateRange}
          aria-label={t('manager.reports.toolbar.dateRange')}
        >
          <Calendar size={16} aria-hidden="true" />
          <span>{t('manager.reports.toolbar.dateRange')}</span>
        </Button>

        {/* Print Button */}
        <Button
          variant="secondary"
          className="manager-reports-toolbar__btn"
          onClick={onPrint}
          aria-label={t('manager.reports.toolbar.print')}
        >
          <Printer size={16} aria-hidden="true" />
          <span>{t('manager.reports.toolbar.print')}</span>
        </Button>

        {/* Export PDF Button (primary) */}
        <Button
          variant="primary"
          className="manager-reports-toolbar__btn manager-reports-toolbar__btn--primary"
          onClick={onExportPdf}
          aria-label={t('manager.reports.toolbar.pdf')}
        >
          <FileDown size={16} aria-hidden="true" />
          <span>{t('manager.reports.toolbar.pdf')}</span>
        </Button>
      </div>
    </div>
  );
}
