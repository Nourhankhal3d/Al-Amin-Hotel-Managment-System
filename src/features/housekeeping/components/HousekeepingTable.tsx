import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
  STATUS_TONE,
  TASK_TYPE_LABEL_KEY,
} from '../constants/housekeeping.constants';
import type { HousekeepingTask } from '../types/housekeeping.types';
import { formatTaskTime } from '../utils/housekeepingDisplay';
import './HousekeepingTable.css';

interface HousekeepingTableProps {
  tasks: HousekeepingTask[];
  totalTasks: number;
  language: Language;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenTask: (taskId: string) => void;
}

export function HousekeepingTable({ tasks, totalTasks, language, page, totalPages, onPageChange, onOpenTask }: HousekeepingTableProps) {
  const t = (key: string) => getTranslation(language, key);
  // The arrow points to the side the drawer opens from: right in Arabic, left in English
  const OpenIcon = language === 'ar' ? ChevronRight : ChevronLeft;
  const summary = t('hkListSummary')
    .replace('{rows}', formatNumber(tasks.length, language))
    .replace('{total}', formatNumber(totalTasks, language));
  const pageLabel = t('hkPage')
    .replace('{page}', formatNumber(page, language))
    .replace('{total}', formatNumber(totalPages, language));

  const columns = [
    { key: 'roomNumber', label: t('colRoom'), render: (row: unknown) => (
      <span className="housekeeping-table__room">{formatNumber(Number((row as HousekeepingTask).roomNumber), language)}</span>
    ) },
    { key: 'taskType', label: t('hkColTaskType'), render: (row: unknown) => t(TASK_TYPE_LABEL_KEY[(row as HousekeepingTask).taskType]) },
    { key: 'priority', label: t('priorityLabel'), render: (row: unknown) => {
      const task = row as HousekeepingTask;
      return <Badge tone={PRIORITY_TONE[task.priority]}>{t(PRIORITY_LABEL_KEY[task.priority])}</Badge>;
    } },
    { key: 'status', label: t('statusLabel'), render: (row: unknown) => {
      const task = row as HousekeepingTask;
      return <Badge tone={STATUS_TONE[task.status]}>{t(STATUS_LABEL_KEY[task.status])}</Badge>;
    } },
    { key: 'createdAt', label: t('hkColCreatedAt'), render: (row: unknown) => formatTaskTime((row as HousekeepingTask).createdAt, language) },
    { key: 'actions', label: t('colActions'), render: (row: unknown) => {
      const task = row as HousekeepingTask;
      return (
        <button
          type="button"
          className="housekeeping-table__open"
          aria-label={t('hkOpenTask').replace('{room}', formatNumber(Number(task.roomNumber), language))}
          onClick={() => onOpenTask(task.id)}
        >
          <OpenIcon aria-hidden="true" />
        </button>
      );
    } },
  ];

  return (
    <Card className="housekeeping-table-card">
      <header className="housekeeping-table-card__header">
        <div>
          <h2>{t('hkListTitle')}</h2>
          <p>{summary}</p>
        </div>
        <span className="housekeeping-table-card__count">
          {formatNumber(totalTasks, language)} {t('hkListCount')}
        </span>
      </header>
      <Table columns={columns} rows={tasks} emptyMessage={t('hkEmpty')} className="housekeeping-table" />
      <footer className="housekeeping-table-card__footer">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageLabel={pageLabel}
          previousLabel={t('pagination.previous')}
          nextLabel={t('pagination.next')}
          navigationLabel={t('pagination.label')}
        />
      </footer>
    </Card>
  );
}
