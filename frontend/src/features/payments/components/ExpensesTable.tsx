import { EmptyState } from '../../../components/common/EmptyState';
import { TableCard } from '../../../components/common/TableCard';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';
import { getTranslation, type Language } from '../../../core/i18n';
import { usePagination } from '../../../hooks/usePagination';
import { formatNumber } from '../../../utils/format';
import type { Expense } from '../services/expenses.api';
import { formatAmount, formatPaymentTime } from '../utils/paymentsFormat';

const PAGE_SIZE = 8;

interface ExpensesTableProps {
  expenses: Expense[];
  language: Language;
}

export function ExpensesTable({ expenses, language }: ExpensesTableProps) {
  const t = (key: string) => getTranslation(language, key);
  const { page, setPage, totalPages, items } = usePagination(expenses, PAGE_SIZE);

  const columns = [
    { key: 'category', label: t('paymentsPage.expenses.columns.category'), render: (row: unknown) => {
      const expense = row as Expense;
      return <Badge tone="warning">{t(`paymentsPage.expenses.categories.${expense.category}`)}</Badge>;
    } },
    { key: 'amount', label: t('paymentsPage.expenses.columns.amount'), render: (row: unknown) => (
      // An expense is money going out: shown as a negative amount in red
      <span className="payments-page__amount payments-page__amount--negative">{formatAmount(-(row as Expense).amount, language)}</span>
    ) },
    { key: 'time', label: t('paymentsPage.expenses.columns.time'), render: (row: unknown) => formatPaymentTime((row as Expense).recordedAt, language) },
    { key: 'notes', label: t('paymentsPage.expenses.columns.notes'), render: (row: unknown) => (row as Expense).notes ?? '—' },
  ];

  const summary = t('paymentsPage.table.summary')
    .replace('{rows}', formatNumber(items.length, language))
    .replace('{total}', formatNumber(expenses.length, language));

  return (
    <TableCard
      title={t('paymentsPage.expenses.title')}
      subtitle={t('paymentsPage.expenses.subtitle')}
      badge={t('paymentsPage.expenses.count').replace('{count}', formatNumber(expenses.length, language))}
      footer={expenses.length > 0 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageLabel={summary}
          previousLabel={t('pagination.previous')}
          nextLabel={t('pagination.next')}
          navigationLabel={t('pagination.label')}
        />
      ) : undefined}
    >
      {expenses.length === 0 ? (
        <EmptyState title={t('paymentsPage.expenses.empty')} description={t('paymentsPage.expenses.emptyDesc')} />
      ) : (
        <Table columns={columns} rows={items} emptyMessage={t('paymentsPage.expenses.empty')} />
      )}
    </TableCard>
  );
}