import { TableCard } from '../../../components/common/TableCard';
import { Table } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/common/EmptyState';
import { Button } from '../../../components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatCurrency, formatNumber } from '../../../utils/format';
import type { FinanceTransaction } from '../types/manager-finance.types';
import './FinanceRevenuesTable.css';

export interface FinanceRevenuesTableProps {
  transactions: FinanceTransaction[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSelectTransaction: (id: string) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
  className?: string;
}

export function FinanceRevenuesTable({
  transactions,
  total,
  page,
  totalPages,
  onPageChange,
  onSelectTransaction,
  onResetFilters,
  className = '',
}: FinanceRevenuesTableProps) {
  const { language, t } = useLanguage();
  const isRtl = language === 'ar';

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const countBadgeText = t('manager.finance.revenuesTable.countBadge').replace(
    '{count}',
    formatNumber(total, language),
  );

  const pageLabel = t('manager.finance.revenuesTable.showingCount')
    .replace('{current}', formatNumber(transactions.length, language))
    .replace('{total}', formatNumber(total, language));

  const columns = [
    {
      key: 'transactionNumber',
      label: t('manager.finance.revenuesTable.thTransaction'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        return (
          <span className="finance-table__transaction-no">
            {tx.transactionNumber}
          </span>
        );
      },
    },
    {
      key: 'roomNumber',
      label: t('manager.finance.revenuesTable.thRoom'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        const num = Number(tx.roomNumber);
        const displayRoom = !Number.isNaN(num)
          ? formatNumber(num, language)
          : tx.roomNumber;
        return <span className="finance-table__room-tile">{displayRoom}</span>;
      },
    },
    {
      key: 'guestName',
      label: t('manager.finance.revenuesTable.thGuest'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        return <span className="finance-table__guest-name">{tx.guestName}</span>;
      },
    },
    {
      key: 'amount',
      label: t('manager.finance.revenuesTable.thAmount'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        return (
          <strong className="finance-table__amount">
            {formatCurrency(tx.amount, language)}
          </strong>
        );
      },
    },
    {
      key: 'method',
      label: t('manager.finance.revenuesTable.thMethod'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        let methodClass = 'finance-method-chip--card';
        let methodText = t('manager.finance.methods.card');

        if (tx.method === 'instapay') {
          methodClass = 'finance-method-chip--instapay';
          methodText = t('manager.finance.methods.instapay');
        } else if (tx.method === 'cash') {
          methodClass = 'finance-method-chip--cash';
          methodText = t('manager.finance.methods.cash');
        } else if (tx.method === 'vodafone') {
          methodClass = 'finance-method-chip--vodafone';
          methodText = t('manager.finance.methods.vodafone');
        }

        return (
          <span className={`finance-method-chip ${methodClass}`}>
            {methodText}
          </span>
        );
      },
    },
    {
      key: 'time',
      label: t('manager.finance.revenuesTable.thTime'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        return <span className="finance-table__time">{tx.time}</span>;
      },
    },
    {
      key: 'status',
      label: t('manager.finance.revenuesTable.thStatus'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        if (tx.status === 'completed') {
          return (
            <Badge tone="success">
              {t('manager.finance.statuses.completed')}
            </Badge>
          );
        }
        if (tx.status === 'pending') {
          return (
            <Badge tone="warning">{t('manager.finance.statuses.pending')}</Badge>
          );
        }
        if (tx.status === 'refunded') {
          return (
            <Badge tone="danger">
              {t('manager.finance.statuses.refunded')}
            </Badge>
          );
        }
        return (
          <Badge tone="neutral">
            {t('manager.finance.statuses.cancelled')}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: t('manager.finance.revenuesTable.thActions'),
      render: (row: unknown) => {
        const tx = row as FinanceTransaction;
        const targetId = tx.transactionNumber || tx.id;
        return (
          <button
            type="button"
            className="finance-table__action-btn"
            onClick={() => onSelectTransaction(targetId)}
            aria-label={`${t('manager.finance.revenuesTable.openDrawer')} ${tx.transactionNumber}`}
          >
            <ChevronIcon size={16} aria-hidden="true" />
          </button>
        );
      },
    },
  ];

  return (
    <TableCard
      title={t('manager.finance.revenuesTable.title')}
      subtitle={t('manager.finance.revenuesTable.subtitle')}
      badge={countBadgeText}
      className={`finance-revenues-table-card ${className}`.trim()}
      footer={
        totalPages > 1 || total > 0 ? (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            pageLabel={pageLabel}
          />
        ) : null
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          title={t('manager.finance.revenuesTable.emptyTitle')}
          description={t('manager.finance.revenuesTable.emptyDescription')}
          action={
            <Button variant="secondary" onClick={onResetFilters}>
              {t('manager.finance.revenuesTable.emptyReset')}
            </Button>
          }
        />
      ) : (
        <Table columns={columns} rows={transactions} />
      )}
    </TableCard>
  );
}
