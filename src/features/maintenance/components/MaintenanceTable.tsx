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
} from '../constants/maintenance.constants';
import type { MaintenanceRequest } from '../types/maintenance.types';
import { formatReference, formatRequestTime, formatTimeAgo } from '../utils/maintenanceDisplay';
import './MaintenanceTable.css';

interface MaintenanceTableProps {
  requests: MaintenanceRequest[];
  totalRequests: number;
  language: Language;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenRequest: (requestId: string) => void;
}

export function MaintenanceTable({ requests, totalRequests, language, page, totalPages, onPageChange, onOpenRequest }: MaintenanceTableProps) {
  const t = (key: string) => getTranslation(language, key);
  // The arrow points to the side the drawer opens from: right in Arabic, left in English
  const OpenIcon = language === 'ar' ? ChevronRight : ChevronLeft;
  const summary = t('mtListSummary')
    .replace('{rows}', formatNumber(requests.length, language))
    .replace('{total}', formatNumber(totalRequests, language));

  const columns = [
    { key: 'reference', label: t('mtColReference'), render: (row: unknown) => (
      <span className="maintenance-table__reference">{formatReference((row as MaintenanceRequest).referenceNumber, language)}</span>
    ) },
    { key: 'roomNumber', label: t('colRoom'), render: (row: unknown) => (
      <span className="maintenance-table__room">{formatNumber(Number((row as MaintenanceRequest).roomNumber), language)}</span>
    ) },
    { key: 'title', label: t('mtColIssue'), render: (row: unknown) => (
      <span className="maintenance-table__issue">{(row as MaintenanceRequest).title}</span>
    ) },
    { key: 'priority', label: t('priorityLabel'), render: (row: unknown) => {
      const request = row as MaintenanceRequest;
      return <Badge tone={PRIORITY_TONE[request.priority]}>{t(PRIORITY_LABEL_KEY[request.priority])}</Badge>;
    } },
    { key: 'status', label: t('statusLabel'), render: (row: unknown) => {
      const request = row as MaintenanceRequest;
      return <Badge tone={STATUS_TONE[request.status]}>{t(STATUS_LABEL_KEY[request.status])}</Badge>;
    } },
    { key: 'reportedAt', label: t('mtColReportedAt'), render: (row: unknown) => formatRequestTime((row as MaintenanceRequest).reportedAt, language) },
    { key: 'updatedAt', label: t('mtColLastUpdate'), render: (row: unknown) => formatTimeAgo((row as MaintenanceRequest).updatedAt, language) },
    { key: 'actions', label: t('colActions'), render: (row: unknown) => {
      const request = row as MaintenanceRequest;
      return (
        <button
          type="button"
          className="maintenance-table__open"
          aria-label={t('mtOpenRequest').replace('{room}', formatNumber(Number(request.roomNumber), language))}
          onClick={() => onOpenRequest(request.id)}
        >
          <OpenIcon aria-hidden="true" />
        </button>
      );
    } },
  ];

  return (
    <Card className="maintenance-table-card">
      <header className="maintenance-table-card__header">
        <div>
          <h2>{t('mtListTitle')}</h2>
          <p>{t('mtListSubtitle')}</p>
        </div>
        <span className="maintenance-table-card__count">
          {formatNumber(totalRequests, language)} {t('mtListCount')}
        </span>
      </header>
      <Table columns={columns} rows={requests} emptyMessage={t('mtEmpty')} className="maintenance-table" />
      <footer className="maintenance-table-card__footer">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageLabel={summary}
          previousLabel={t('pagination.previous')}
          nextLabel={t('pagination.next')}
          navigationLabel={t('pagination.label')}
        />
      </footer>
    </Card>
  );
}
