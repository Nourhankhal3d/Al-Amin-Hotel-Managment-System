import { useState, useEffect } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useLanguage } from '../../../core/i18n/useLanguage';
import './ReportDateRangeDrawer.css';

export interface ReportDateRangeDrawerProps {
  open: boolean;
  onClose: () => void;
  startDate?: string;
  endDate?: string;
  onApply: (from: string, to: string) => void;
  onReset: () => void;
}

export function ReportDateRangeDrawer({
  open,
  onClose,
  startDate = '2025-06-01',
  endDate = '2025-06-18',
  onApply,
  onReset,
}: ReportDateRangeDrawerProps) {
  const { t } = useLanguage();

  const [from, setFrom] = useState(startDate);
  const [to, setTo] = useState(endDate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFrom(startDate);
      setTo(endDate);
      setError(null);
    }
  }, [open, startDate, endDate]);

  const handleApply = () => {
    if (from && to && from > to) {
      setError(t('manager.reports.dateRangeDrawer.errorInvalidRange'));
      return;
    }
    setError(null);
    onApply(from, to);
  };

  const handleReset = () => {
    setError(null);
    onReset();
  };

  const footer = (
    <div className="report-date-range-drawer__footer">
      <Button variant="secondary" onClick={handleReset}>
        {t('manager.reports.dateRangeDrawer.reset')}
      </Button>
      <Button variant="primary" onClick={handleApply}>
        {t('manager.reports.dateRangeDrawer.apply')}
      </Button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('manager.reports.dateRangeDrawer.title')}
      eyebrow={t('manager.reports.dateRangeDrawer.eyebrow')}
      side="end"
      footer={footer}
    >
      <div className="report-date-range-drawer__body">
        {error && (
          <div className="report-date-range-drawer__error" role="alert">
            {error}
          </div>
        )}

        <div className="report-date-range-drawer__field">
          <label className="report-date-range-drawer__label" htmlFor="report-range-from">
            {t('manager.reports.dateRangeDrawer.from')}
          </label>
          <Input
            id="report-range-from"
            type="date"
            className="report-date-range-drawer__input"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="report-date-range-drawer__field">
          <label className="report-date-range-drawer__label" htmlFor="report-range-to">
            {t('manager.reports.dateRangeDrawer.to')}
          </label>
          <Input
            id="report-range-to"
            type="date"
            className="report-date-range-drawer__input"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setError(null);
            }}
          />
        </div>
      </div>
    </Drawer>
  );
}
