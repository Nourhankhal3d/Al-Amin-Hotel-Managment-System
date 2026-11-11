import { Card } from '../../../components/ui/Card';
import { SearchBar } from '../../../components/common/SearchBar';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { RotateCcw } from 'lucide-react';
import './FinanceRevenuesFilterCard.css';

export interface FinanceRevenuesFilterCardProps {
  search: string;
  method: string;
  status: string;
  date: string;
  onSearchChange: (search: string) => void;
  onMethodChange: (method: string) => void;
  onStatusChange: (status: string) => void;
  onDateChange: (date: string) => void;
  onReset: () => void;
  className?: string;
}

export function FinanceRevenuesFilterCard({
  search,
  method,
  status,
  date,
  onSearchChange,
  onMethodChange,
  onStatusChange,
  onDateChange,
  onReset,
  className = '',
}: FinanceRevenuesFilterCardProps) {
  const { t } = useLanguage();

  const methodOptions: SelectOption[] = [
    { value: 'ALL', label: t('manager.finance.filters.all') },
    { value: 'INSTAPAY', label: t('manager.finance.methods.instapay') },
    { value: 'CASH', label: t('manager.finance.methods.cash') },
    { value: 'VODAFONE_CASH', label: t('manager.finance.methods.vodafone') },
    { value: 'CARD', label: t('manager.finance.methods.card') },
  ];

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: t('manager.finance.filters.all') },
    { value: 'COMPLETED', label: t('manager.finance.statuses.completed') },
    { value: 'PENDING', label: t('manager.finance.statuses.pending') },
    { value: 'REFUNDED', label: t('manager.finance.statuses.refunded') },
    { value: 'CANCELLED', label: t('manager.finance.statuses.cancelled') },
  ];

  const dateOptions: SelectOption[] = [
    { value: 'ALL', label: t('manager.finance.filters.all') },
    { value: '2025-06-18', label: t('manager.finance.filters.today') },
  ];

  const hasActiveFilters =
    search.trim() !== '' || method !== 'ALL' || status !== 'ALL' || date !== 'ALL';

  return (
    <Card className={`finance-revenues-filter-card ${className}`.trim()}>
      {/* 1. Search Bar */}
      <div className="finance-revenues-filter-card__search">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={t('manager.finance.filters.searchPlaceholder')}
        />
      </div>

      {/* 2. Selects and Reset Row */}
      <div className="finance-revenues-filter-card__controls">
        <div className="finance-revenues-filter-card__selects">
          {/* Method Select */}
          <div className="finance-revenues-filter-card__field">
            <span className="finance-revenues-filter-card__label">
              {t('manager.finance.filters.methodLabel')}
            </span>
            <Select
              value={method}
              options={methodOptions}
              onChange={onMethodChange}
              placeholder={t('manager.finance.filters.all')}
            />
          </div>

          {/* Status Select */}
          <div className="finance-revenues-filter-card__field">
            <span className="finance-revenues-filter-card__label">
              {t('manager.finance.filters.statusLabel')}
            </span>
            <Select
              value={status}
              options={statusOptions}
              onChange={onStatusChange}
              placeholder={t('manager.finance.filters.all')}
            />
          </div>

          {/* Date Select */}
          <div className="finance-revenues-filter-card__field">
            <span className="finance-revenues-filter-card__label">
              {t('manager.finance.filters.dateLabel')}
            </span>
            <Select
              value={date}
              options={dateOptions}
              onChange={onDateChange}
              placeholder={t('manager.finance.filters.all')}
            />
          </div>
        </div>

        {/* Reset Link */}
        {hasActiveFilters && (
          <button
            type="button"
            className="finance-revenues-filter-card__reset-btn"
            onClick={onReset}
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>{t('manager.finance.filters.reset')}</span>
          </button>
        )}
      </div>
    </Card>
  );
}
