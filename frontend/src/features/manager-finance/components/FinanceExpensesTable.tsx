import { TableCard } from '../../../components/common/TableCard';
import { Table } from '../../../components/ui/Table';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/common/EmptyState';
import { Button } from '../../../components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { formatDate } from '../../../utils/date';
import type { FinanceExpense } from '../types/manager-finance.types';
import './FinanceExpensesTable.css';

export interface FinanceExpensesTableProps {
  expenses: FinanceExpense[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSelectExpense: (id: string) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

export function FinanceExpensesTable({
  expenses,
  total,
  page,
  totalPages,
  onPageChange,
  onSelectExpense,
  onResetFilters,
  className = '',
}: FinanceExpensesTableProps) {
  const { language, t } = useLanguage();
  const isRtl = language === 'ar';

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const countBadgeText = t('manager.finance.expensesTable.countBadge').replace(
    '{count}',
    formatNumber(total, language),
  );

  const viewAllFooterText = t('manager.finance.expensesTable.viewAllFooter');

  const columns = [
    {
      key: 'expenseNumber',
      label: t('manager.finance.expensesTable.thRecordNumber'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        return (
          <span className="finance-expense-table__record-no">
            {item.expenseNumber}
          </span>
        );
      },
    },
    {
      key: 'category',
      label: t('manager.finance.expensesTable.thCategory'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        return (
          <span className="finance-expense-category-chip">
            {item.categoryLabel}
          </span>
        );
      },
    },
    {
      key: 'amount',
      label: t('manager.finance.expensesTable.thAmount'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        return (
          <strong className="finance-expense-table__amount">
            - {formatCurrency(item.amount, language)}
          </strong>
        );
      },
    },
    {
      key: 'date',
      label: t('manager.finance.expensesTable.thDate'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        const displayDate = formatDate(item.date, language) || item.date;
        return (
          <span className="finance-expense-table__date">{displayDate}</span>
        );
      },
    },
    {
      key: 'time',
      label: t('manager.finance.expensesTable.thTime'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        return (
          <span className="finance-expense-table__time">{item.time}</span>
        );
      },
    },
    {
      key: 'notes',
      label: t('manager.finance.expensesTable.thNotes'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        return (
          <span className="finance-expense-table__notes" title={item.notes || ''}>
            {item.notes || '—'}
          </span>
        );
      },
    },
    {
      key: 'recordedBy',
      label: t('manager.finance.expensesTable.thRecordedBy'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        const initial = item.recordedByName?.charAt(0) || 'س';
        return (
          <div
            className="finance-expense-table__avatar"
            title={item.recordedByName}
            aria-label={item.recordedByName}
          >
            <span>{initial}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: t('manager.finance.expensesTable.thActions'),
      render: (row: unknown) => {
        const item = row as FinanceExpense;
        const targetId = item.expenseNumber || item.id;
        return (
          <button
            type="button"
            className="finance-expense-table__action-btn"
            onClick={() => onSelectExpense(targetId)}
            aria-label={`${t('manager.finance.expensesTable.openDrawer')} ${item.expenseNumber}`}
          >
            <ChevronIcon size={16} aria-hidden="true" />
          </button>
        );
      },
    },
  ];

  return (
    <TableCard
      title={t('manager.finance.expensesTable.title')}
      subtitle={t('manager.finance.expensesTable.subtitle')}
      badge={countBadgeText}
      className={`finance-expenses-table-card ${className}`.trim()}
      footer={
        totalPages > 1 || total > 0 ? (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageLabel={viewAllFooterText}
          />
        ) : null
      }
    >
      {expenses.length === 0 ? (
        <EmptyState
          title={t('manager.finance.expensesTable.emptyTitle')}
          description={t('manager.finance.expensesTable.emptyDescription')}
          action={
            <Button variant="secondary" onClick={onResetFilters}>
              {t('manager.finance.expensesTable.emptyReset')}
            </Button>
          }
        />
      ) : (
        <Table columns={columns} rows={expenses} />
      )}
    </TableCard>
  );
}
