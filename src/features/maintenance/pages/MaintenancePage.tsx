import './MaintenancePage.css';
import { useState } from 'react';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { MaintenanceDetailsDrawer } from '../components/MaintenanceDetailsDrawer';
import type { MaintenanceDetails } from '../components/MaintenanceDetailsDrawer';
import { MaintenanceFilters } from '../components/MaintenanceFilters';
import { MaintenanceFormDrawer } from '../components/MaintenanceFormDrawer';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
  STATUS_TONE,
} from '../constants/maintenance.constants';

const PAGE_SIZE = 4;

// TEMP: placeholder average until the real service is connected
const AVERAGE_RESOLUTION = '٤٢ د';

// TEMP: placeholder data until the real service is connected
// (issue, notes, log texts and times below are sample data, they will come from the backend)
const rows: MaintenanceDetails[] = [
  {
    id: '1',
    roomNumber: '305',
    issue: 'ضعف ضغط المياه',
    reference: 'MT-127',
    reportedAt: 'أُبلغ ١٠:٢٠ ص',
    status: 'pending',
    priority: 'high',
    expectedFixAt: '١٢:٤٥ م',
    lastUpdate: 'منذ ٣٢ د',
    notes: 'ضعف المياه في غرفة الضيف. تم إبلاغ الفريق الفني مع طلب الفحص في أقرب وقت.',
    log: [
      { id: 'l1', title: 'تحديث حالة الغرفة', description: 'تم تأكيد حالة الغرفة', time: '١١:٤٢ ص' },
      { id: 'l2', title: 'بدأ التنظيف', description: 'أسندت المهمة إلى موظف نظافة', time: '٩:١٥ ص' },
      { id: 'l3', title: 'تسجيل المغادرة', description: 'تم إغلاق حساب الضيف', time: 'أمس' },
    ],
  },
  {
    id: '2',
    roomNumber: '112',
    issue: 'المكيّف لا يبرّد',
    reference: 'MT-128',
    reportedAt: 'أُبلغ ١٠:٥٦ ص',
    status: 'in_progress',
    priority: 'critical',
    expectedFixAt: '١٢:٤٥ م',
    lastUpdate: 'منذ ٨ د',
    notes: 'المكيّف لا يبرّد في غرفة الضيف. تم إبلاغ الفريق الفني مع طلب الفحص في أقرب وقت.',
    log: [
      { id: 'l1', title: 'تحديث حالة الغرفة', description: 'تم تأكيد حالة الغرفة', time: '١١:٤٢ ص' },
      { id: 'l2', title: 'تم الإبلاغ', description: 'سُجّل البلاغ من الاستقبال', time: '١٠:٥٦ ص' },
    ],
  },
  {
    id: '3',
    roomNumber: '207',
    issue: 'تسرّب في الحمّام',
    reference: 'MT-126',
    reportedAt: 'أُبلغ ٩:٣٠ ص',
    status: 'in_progress',
    priority: 'high',
    expectedFixAt: '١:١٥ م',
    lastUpdate: 'منذ ٢٠ د',
    log: [{ id: 'l1', title: 'تم الإبلاغ', description: 'سُجّل البلاغ من الاستقبال', time: '٩:٣٠ ص' }],
  },
  {
    id: '4',
    roomNumber: '210',
    issue: 'مصباح لا يعمل',
    reference: 'MT-125',
    reportedAt: 'أُبلغ ٩:٠٥ ص',
    status: 'resolved',
    priority: 'normal',
    lastUpdate: 'منذ ساعة',
    log: [{ id: 'l1', title: 'تم الحل', description: 'تم استبدال المصباح', time: '١٠:٠٠ ص' }],
  },
  {
    id: '5',
    roomNumber: '401',
    issue: 'باب لا يُغلق',
    reference: 'MT-124',
    reportedAt: 'أُبلغ ٨:٤٠ ص',
    status: 'pending',
    priority: 'normal',
    lastUpdate: 'منذ ساعتين',
    log: [{ id: 'l1', title: 'تم الإبلاغ', description: 'سُجّل البلاغ من الاستقبال', time: '٨:٤٠ ص' }],
  },
];

export function MaintenancePage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [room, setRoom] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const roomOptions = Array.from(new Set(rows.map((row) => row.roomNumber)));

  const filteredRows = rows.filter((row) => {
    const search = query.trim();
    const matchesQuery = !search || row.roomNumber.includes(search) || row.issue.includes(search);
    const matchesStatus = !status || row.status === status;
    const matchesPriority = !priority || row.priority === priority;
    const matchesRoom = !room || row.roomNumber === room;
    return matchesQuery && matchesStatus && matchesPriority && matchesRoom;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedRequest = rows.find((row) => row.id === selectedId) ?? null;

  const changeFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const resetFilters = () => {
    setQuery('');
    setStatus('');
    setPriority('');
    setRoom('');
    setPage(1);
  };

  return (
    <div className="feature-page">
      <PageHero title={t('mtHeroTitle')} description={t('mtHeroDesc')}>
        <Button onClick={() => setFormOpen(true)}>{t('mtNewRequest')}</Button>
      </PageHero>

      <div className="maintenance-stats">
        <StatCard label={t('mtStatTotal')} value={rows.length} icon="🔧" tone="amber" />
        <StatCard label={t('mtStatCritical')} value={rows.filter((row) => row.priority === 'critical').length} icon="!" tone="rose" />
        <StatCard label={t('mtStatPending')} value={rows.filter((row) => row.status === 'pending').length} icon="◷" tone="amber" />
        <StatCard label={t('mtStatResolved')} value={rows.filter((row) => row.status === 'resolved').length} icon="✓" tone="teal" />
        <StatCard label={t('mtStatToday')} value={rows.length} icon="▦" tone="teal" />
        <StatCard label={t('mtStatAverage')} value={AVERAGE_RESOLUTION} icon="⏱" tone="amber" />
      </div>

      <MaintenanceFilters
        query={query}
        status={status}
        priority={priority}
        room={room}
        roomOptions={roomOptions}
        onQueryChange={changeFilter(setQuery)}
        onStatusChange={changeFilter(setStatus)}
        onPriorityChange={changeFilter(setPriority)}
        onRoomChange={changeFilter(setRoom)}
        onReset={resetFilters}
      />

      <section className="maintenance-list__header">
        <div>
          <h2>{t('mtListTitle')}</h2>
          <p>{t('mtListSubtitle')}</p>
        </div>
        <Badge tone="success">{filteredRows.length} {t('mtListCount')}</Badge>
      </section>

      <Table
        columns={[
          { key: 'reference', label: t('mtColReference'), render: (row: unknown) => (row as MaintenanceDetails).reference ?? '' },
          { key: 'roomNumber', label: t('colRoom'), render: (row: unknown) => (row as MaintenanceDetails).roomNumber },
          { key: 'issue', label: t('mtColIssue'), render: (row: unknown) => (row as MaintenanceDetails).issue },
          {
            key: 'priority',
            label: t('priorityLabel'),
            render: (row: unknown) => {
              const request = row as MaintenanceDetails;
              return <Badge tone={PRIORITY_TONE[request.priority]}>{t(PRIORITY_LABEL_KEY[request.priority])}</Badge>;
            },
          },
          {
            key: 'status',
            label: t('statusLabel'),
            render: (row: unknown) => {
              const request = row as MaintenanceDetails;
              return <Badge tone={STATUS_TONE[request.status]}>{t(STATUS_LABEL_KEY[request.status])}</Badge>;
            },
          },
          { key: 'reportedAt', label: t('mtColReportedAt'), render: (row: unknown) => (row as MaintenanceDetails).reportedAt ?? '' },
          { key: 'lastUpdate', label: t('mtColLastUpdate'), render: (row: unknown) => (row as MaintenanceDetails).lastUpdate ?? '' },
          {
            key: 'actions',
            label: t('colActions'),
            render: (row: unknown) => {
              const request = row as MaintenanceDetails;
              return <Button variant="ghost" onClick={() => setSelectedId(request.id)}>›</Button>;
            },
          },
        ]}
        rows={visibleRows}
      />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <MaintenanceDetailsDrawer request={selectedRequest} onClose={() => setSelectedId(null)} />
      {/* TODO: connect to the real service when it is ready */}
      <MaintenanceFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSubmit={() => setFormOpen(false)} />
    </div>
  );
}