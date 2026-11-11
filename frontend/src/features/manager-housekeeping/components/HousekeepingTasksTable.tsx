import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TableCard } from '../../../components/common/TableCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import { HOUSEKEEPING_I18N, PRIORITY_TONE, STATUS_TONE } from '../constants/housekeeping.constants';
import type { HousekeepingTask } from '../types/manager-housekeeping.types';
import { formatRoom, formatTime, pluralText } from '../utils/housekeepingDisplay';
import './HousekeepingTasksTable.css';

interface HousekeepingTasksTableProps {
  tasks: HousekeepingTask[];
  page: number;
  totalPages: number;
  updatedText: string;
  onPageChange: (page: number) => void;
  onOpen: (id: string) => void;
}

export function HousekeepingTasksTable({ tasks, page, totalPages, updatedText, onPageChange, onOpen }: HousekeepingTasksTableProps) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${HOUSEKEEPING_I18N}.${key}`), [translate]);
  // The arrow points to the side the drawer opens from
  const OpenIcon = language === 'ar' ? ChevronRight : ChevronLeft;

  const columns = [
    { key: 'room', label: t('colRoom'), render: (row: unknown) => (
      <span className="table-card__chip">{formatRoom((row as HousekeepingTask).roomNumber, language)}</span>
    ) },
    { key: 'cleaner', label: t('colCleaner'), render: (row: unknown) => {
      const task = row as HousekeepingTask;
      if (!task.cleanerName) return <span className="hk-table__muted">{t('unassigned')}</span>;
      return (
        <span className="hk-table__person">
          <Avatar name={task.cleanerName} size="sm" />
          <span>{task.cleanerName}</span>
        </span>
      );
    } },
    { key: 'priority', label: t('colPriority'), render: (row: unknown) => {
      const { priority } = row as HousekeepingTask;
      return <Badge tone={PRIORITY_TONE[priority]}>{t(`priorities.${priority}`)}</Badge>;
    } },
    { key: 'status', label: t('colStatus'), render: (row: unknown) => {
      const { status } = row as HousekeepingTask;
      return <Badge tone={STATUS_TONE[status]}>{t(`statuses.${status}`)}</Badge>;
    } },
    { key: 'logged', label: t('colLogged'), render: (row: unknown) => formatTime((row as HousekeepingTask).createdAt, language) },
    { key: 'actions', label: t('colActions'), render: (row: unknown) => {
      const task = row as HousekeepingTask;
      return (
        <button
          type="button"
          className="table-card__open"
          aria-label={t('openTask').replace('{room}', formatRoom(task.roomNumber, language))}
          onClick={() => onOpen(task.id)}
        >
          <OpenIcon aria-hidden="true" />
        </button>
      );
    } },
  ];

  return (
    <TableCard
      className="hk-table-card"
      title={t('tableTitle')}
      subtitle={t('tableSubtitle')}
      badge={pluralText(t, 'visibleCount', tasks.length, language)}
      footer={(
        <div className="hk-table__footer">
          <span className="hk-table__updated">{updatedText}</span>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageLabel={t('pageLabel').replace('{page}', formatNumber(page, language)).replace('{total}', formatNumber(totalPages, language))}
              previousLabel={t('previousPage')}
              nextLabel={t('nextPage')}
              navigationLabel={t('pagination')}
            />
          )}
        </div>
      )}
    >
      <Table columns={columns} rows={tasks} emptyMessage={t('emptyTitle')} className="hk-table" />
    </TableCard>
  );
}
