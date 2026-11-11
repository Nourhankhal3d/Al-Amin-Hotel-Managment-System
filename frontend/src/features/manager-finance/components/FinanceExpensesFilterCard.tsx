import { Card } from '../../../components/ui/Card';
import { SearchBar } from '../../../components/common/SearchBar';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { RotateCcw } from 'lucide-react';
import './FinanceExpensesFilterCard.css';

export interface FinanceExpensesFilterCardProps {
  search: string;
  category: string;
  date: string;
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onDateChange: (date: string) => void;
  onReset: () => void;
  className?: string;
}

export function FinanceExpensesFilterCard({
  search,
  category,
  date,
  onSearchChange,
  onCategoryChange,
  onDateChange,
  onReset,
  className = '',
}: FinanceExpensesFilterCardProps) {
  const { t } = useLanguage();

  const categoryOptions: SelectOption[] = [
    { value: 'ALL', label: t('manager.finance.expensesFilters.all') },
    { value: 'CLEANING', label: t('manager.finance.categories.cleaning') },
    { value: 'MAINTENANCE', label: t('manager.finance.categories.maintenance') },
    { value: 'UTILITIES', label: t('manager.finance.categories.utilities') },
    { value: 'EMERGENCY', label: t('manager.finance.categories.emergency') },
  ];

  const dateOptions: SelectOption[] = [
    { value: 'ALL', label: t('manager.finance.expensesFilters.all') },
    { value: '2025-06-18', label: t('manager.finance.expensesFilters.today') },
  ];

  const hasActiveFilters =
    search.trim() !== '' || category !== 'ALL' || date !== 'ALL';

  return (
    <Card className={`finance-expenses-filter-card ${className}`.trim()}>
      {/* 1. Search Bar */}
      <div className="finance-expenses-filter-card__search">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={t('manager.finance.expensesFilters.searchPlaceholder')}
        />
      </div>

      {/* 2. Selects and Reset Row */}
      <div className="finance-expenses-filter-card__controls">
        <div className="finance-expenses-filter-card__selects">
          {/* Category Select */}
          <div className="finance-expenses-filter-card__field">
            <span className="finance-expenses-filter-card__label">
              {t('manager.finance.expensesFilters.categoryLabel')}
            </span>
            <Select
              value={category}
              options={categoryOptions}
              onChange={onCategoryChange}
              placeholder={t('manager.finance.expensesFilters.all')}
            />
          </div>

          {/* Date Select */}
          <div className="finance-expenses-filter-card__field">
            <span className="finance-expenses-filter-card__label">
              {t('manager.finance.expensesFilters.dateLabel')}
            </span>
            <Select
              value={date}
              options={dateOptions}
              onChange={onDateChange}
              placeholder={t('manager.finance.expensesFilters.all')}
            />
          </div>
        </div>

        {/* Reset Link */}
        {hasActiveFilters && (
          <button
            type="button"
            className="finance-expenses-filter-card__reset-btn"
            onClick={onReset}
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>{t('manager.finance.expensesFilters.reset')}</span>
          </button>
        )}
      </div>
    </Card>
  );
}
