import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TableCard } from '../../../components/common/TableCard';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import { MAINTENANCE_I18N, PRIORITY_TONE, STATUS_TONE } from '../constants/maintenance.constants';
import type { MaintenanceTicket } from '../types/manager-maintenance.types';
import { formatCode, formatRoom, formatSince, formatTime, pluralText } from '../utils/maintenanceDisplay';
import './MaintenanceTicketsTable.css';

interface MaintenanceTicketsTableProps {
  tickets: MaintenanceTicket[];
  totalTickets: number;
  activeTickets: number;
  page: number;
  totalPages: number;
  now: number;
  onPageChange: (page: number) => void;
  onOpen: (id: string) => void;
}

export function MaintenanceTicketsTable({
  tickets,
  totalTickets,
  activeTickets,
  page,
  totalPages,
  now,
  onPageChange,
  onOpen,
}: MaintenanceTicketsTableProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${MAINTENANCE_I18N}.${key}`), [translate]);
  // The arrow points to the side the drawer opens from
  const OpenIcon = language === 'ar' ? ChevronRight : ChevronLeft;

  const columns = [
    { key: 'code', label: t('colCode'), render: (row: unknown) => (
      <span className="mt-table__code">{formatCode((row as MaintenanceTicket).code, language)}</span>
    ) },
    { key: 'room', label: t('colRoom'), render: (row: unknown) => (
      <span className="table-card__chip">{formatRoom((row as MaintenanceTicket).roomNumber, language)}</span>
    ) },
    { key: 'issue', label: t('colIssue'), render: (row: unknown) => (
      <span className="mt-table__issue">{(row as MaintenanceTicket).issue}</span>
    ) },
    { key: 'priority', label: t('colPriority'), render: (row: unknown) => {
      const { priority } = row as MaintenanceTicket;
      return <Badge tone={PRIORITY_TONE[priority]}>{t(`priorities.${priority}`)}</Badge>;
    } },
    { key: 'status', label: t('colStatus'), render: (row: unknown) => {
      const { status } = row as MaintenanceTicket;
      return <Badge tone={STATUS_TONE[status]}>{t(`statuses.${status}`)}</Badge>;
    } },
    { key: 'technician', label: t('colTechnician'), render: (row: unknown) => {
      const { technicianName } = row as MaintenanceTicket;
      return technicianName ?? <span className="mt-table__muted">{t('unassigned')}</span>;
    } },
    { key: 'reported', label: t('colReported'), render: (row: unknown) => formatTime((row as MaintenanceTicket).reportedAt, language) },
    { key: 'updated', label: t('colUpdated'), render: (row: unknown) => formatSince((row as MaintenanceTicket).updatedAt, t, language, now) },
    { key: 'actions', label: t('colActions'), render: (row: unknown) => {
      const ticket = row as MaintenanceTicket;
      return (
        <button
          type="button"
          className="table-card__open"
          aria-label={t('openTicket').replace('{code}', formatCode(ticket.code, language))}
          onClick={() => onOpen(ticket.id)}
        >
          <OpenIcon aria-hidden="true" />
        </button>
      );
    } },
  ];

  const shown = t('showing')
    .replace('{rows}', formatNumber(tickets.length, language))
    .replace('{total}', pluralText(t, 'ticketsCount', totalTickets, language));

  return (
    <TableCard
      className="mt-table-card"
      title={t('tableTitle')}
      subtitle={t('tableSubtitle')}
      badge={pluralText(t, 'activeCount', activeTickets, language)}
      footer={(
        <div className="mt-table__footer">
          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageLabel={t('pageLabel').replace('{page}', formatNumber(page, language)).replace('{total}', formatNumber(totalPages, language))}
              previousLabel={t('previousPage')}
              nextLabel={t('nextPage')}
              navigationLabel={t('pagination')}
            />
          ) : <span />}
          <span className="mt-table__shown">{shown}</span>
        </div>
      )}
    >
      <Table columns={columns} rows={tickets} emptyMessage={t('emptyTitle')} className="mt-table" />
    </TableCard>
  );
}
