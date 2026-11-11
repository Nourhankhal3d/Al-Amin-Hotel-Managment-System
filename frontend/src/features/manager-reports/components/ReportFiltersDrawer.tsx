import { useState, useEffect } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { useReportFilterOptions } from '../hooks/useReportFilterOptions';
import type { ReportFilters, ReportPeriod } from '../types/manager-reports.types';
import { getDefaultReportFilters } from '../schemas/report-filters.schema';
import './ReportFiltersDrawer.css';

export interface ReportFiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ReportFilters;
  onApply: (newFilters: ReportFilters) => void;
  onReset: () => void;
}

export function ReportFiltersDrawer({
  open,
  onClose,
  filters,
  onApply,
  onReset,
}: ReportFiltersDrawerProps) {
  const { t } = useLanguage();
  const options = useReportFilterOptions();

  // Local draft state for filters
  const [draft, setDraft] = useState<ReportFilters>(filters);

  // Synchronize draft when drawer opens or filters prop changes
  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  const handleFieldChange = (field: keyof ReportFilters, value: string) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    onApply(draft);
  };

  const handleReset = () => {
    const defaults = getDefaultReportFilters();
    setDraft(defaults);
    onReset();
  };

  const footer = (
    <div className="report-filters-drawer__footer">
      <Button variant="secondary" onClick={handleReset}>
        {t('manager.reports.filtersDrawer.reset')}
      </Button>
      <Button variant="primary" onClick={handleApply}>
        {t('manager.reports.filtersDrawer.apply')}
      </Button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('manager.reports.filtersDrawer.title')}
      eyebrow={t('manager.reports.filtersDrawer.eyebrow')}
      side="end"
      footer={footer}
    >
      <div className="report-filters-drawer__grid">
        {/* Row 1: Date & Period */}
        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-date">
            {t('manager.reports.filtersDrawer.date')}
          </label>
          <Input
            id="report-filter-date"
            type="text"
            className="report-filters-drawer__input"
            value={draft.date}
            placeholder="YYYY-MM-DD"
            onChange={(e) => handleFieldChange('date', e.target.value)}
          />
        </div>

        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-period">
            {t('manager.reports.filtersDrawer.period')}
          </label>
          <Select
            id="report-filter-period"
            options={options.periods}
            value={draft.period}
            onChange={(val) => handleFieldChange('period', val as ReportPeriod)}
          />
        </div>

        {/* Row 2: Floor & Room Type */}
        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-floor">
            {t('manager.reports.filtersDrawer.floor')}
          </label>
          <Select
            id="report-filter-floor"
            options={options.floors}
            value={draft.floor}
            onChange={(val) => handleFieldChange('floor', val)}
          />
        </div>

        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-roomType">
            {t('manager.reports.filtersDrawer.roomType')}
          </label>
          <Select
            id="report-filter-roomType"
            options={options.roomTypes}
            value={draft.roomType}
            onChange={(val) => handleFieldChange('roomType', val)}
          />
        </div>

        {/* Row 3: Room Status & Shift */}
        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-roomStatus">
            {t('manager.reports.filtersDrawer.roomStatus')}
          </label>
          <Select
            id="report-filter-roomStatus"
            options={options.roomStatuses}
            value={draft.roomStatus}
            onChange={(val) => handleFieldChange('roomStatus', val)}
          />
        </div>

        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-shift">
            {t('manager.reports.filtersDrawer.shift')}
          </label>
          <Select
            id="report-filter-shift"
            options={options.shifts}
            value={draft.shift}
            onChange={(val) => handleFieldChange('shift', val)}
          />
        </div>

        {/* Row 4: Payment Method & Expense Category */}
        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-paymentMethod">
            {t('manager.reports.filtersDrawer.paymentMethod')}
          </label>
          <Select
            id="report-filter-paymentMethod"
            options={options.paymentMethods}
            value={draft.paymentMethod}
            onChange={(val) => handleFieldChange('paymentMethod', val)}
          />
        </div>

        <div className="report-filters-drawer__field">
          <label className="report-filters-drawer__label" htmlFor="report-filter-expenseCategory">
            {t('manager.reports.filtersDrawer.expenseCategory')}
          </label>
          <Select
            id="report-filter-expenseCategory"
            options={options.expenseCategories}
            value={draft.expenseCategory}
            onChange={(val) => handleFieldChange('expenseCategory', val)}
          />
        </div>
      </div>
    </Drawer>
  );
}
