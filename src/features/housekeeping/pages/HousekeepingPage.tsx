import './HousekeepingPage.css';
import { useState } from 'react';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { HousekeepingFilters } from '../components/HousekeepingFilters';
import { TaskDetailsDrawer } from '../components/TaskDetailsDrawer';
import type { TaskDetails } from '../components/TaskDetailsDrawer';
import { TaskFormDrawer } from '../components/TaskFormDrawer';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
  STATUS_TONE,
  TASK_TYPE_LABEL_KEY,
} from '../constants/housekeeping.constants';

// TEMP: placeholder data until the real service is connected
// (log texts, notes and times below are sample data, they will come from the backend)
const rows: TaskDetails[] = [
  {
    id: '1',
    roomNumber: '207',
    taskType: 'checkout',
    status: 'in_progress',
    priority: 'high',
    assignedAt: 'أسندت الساعة ١١:١٨ ص',
    followUpAt: '١٢:٣٠ م',
    notes: 'يرجى تجهيز الغرفة بالكامل والتأكد من المناشف ومستلزمات الضيافة.',
    log: [
      { id: 'l1', title: 'بدأت المهمة', description: 'تم بدء تنظيف الغرفة', time: '١١:١٨ ص' },
      { id: 'l2', title: 'تم التعيين', description: 'أسندت المهمة إلى موظف نظافة', time: '١١:٠٥ ص' },
      { id: 'l3', title: 'طُلب التنظيف', description: 'تم إنشاء الطلب من الاستقبال', time: '١٠:٥٨ ص' },
    ],
  },
  {
    id: '2',
    roomNumber: '305',
    taskType: 'precheckin',
    status: 'pending',
    priority: 'critical',
    log: [{ id: 'l1', title: 'طُلب التنظيف', description: 'تم إنشاء الطلب من الاستقبال', time: '١١:٠٥ ص' }],
  },
  {
    id: '3',
    roomNumber: '112',
    taskType: 'daily',
    status: 'done',
    priority: 'normal',
    log: [{ id: 'l1', title: 'اكتملت المهمة', description: 'تم تنظيف الغرفة', time: '٩:٣٠ ص' }],
  },
  {
    id: '4',
    roomNumber: '210',
    taskType: 'guest',
    status: 'pending',
    priority: 'high',
    log: [{ id: 'l1', title: 'طُلب التنظيف', description: 'طلب من الضيف', time: '١٠:١٠ ص' }],
  },
];

export function HousekeepingPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filteredRows = rows.filter((row) => {
    const typeLabel = t(TASK_TYPE_LABEL_KEY[row.taskType]);
    const matchesQuery = !query || row.roomNumber.includes(query) || typeLabel.includes(query);
    const matchesStatus = !status || row.status === status;
    const matchesPriority = !priority || row.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  const selectedTask = rows.find((row) => row.id === selectedId) ?? null;

  const resetFilters = () => {
    setQuery('');
    setStatus('');
    setPriority('');
  };

  return (
    <div className="feature-page">
      <PageHero title={t('hkHeroTitle')} description={t('hkHeroDesc')}>
        <Button onClick={() => setFormOpen(true)}>{t('hkNewTask')}</Button>
      </PageHero>

      <div className="housekeeping-stats">
        <StatCard label={t('hkStatToday')} value={rows.length} icon="▤" tone="amber" />
        <StatCard label={t('hkStatHigh')} value={rows.filter((row) => row.priority === 'high').length} icon="!" tone="rose" />
        <StatCard label={t('hkStatDone')} value={rows.filter((row) => row.status === 'done').length} icon="✓" tone="teal" />
        <StatCard label={t('hkStatInProgress')} value={rows.filter((row) => row.status === 'in_progress').length} icon="✦" tone="blue" />
        <StatCard label={t('hkStatPending')} value={rows.filter((row) => row.status === 'pending').length} icon="◷" tone="amber" />
      </div>

      <HousekeepingFilters
        query={query}
        status={status}
        priority={priority}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onReset={resetFilters}
      />

      <Table
        columns={[
          { key: 'roomNumber', label: t('colRoom'), render: (row: unknown) => (row as TaskDetails).roomNumber },
          {
            key: 'taskType',
            label: t('hkColTaskType'),
            render: (row: unknown) => t(TASK_TYPE_LABEL_KEY[(row as TaskDetails).taskType]),
          },
          {
            key: 'priority',
            label: t('priorityLabel'),
            render: (row: unknown) => {
              const task = row as TaskDetails;
              return <Badge tone={PRIORITY_TONE[task.priority]}>{t(PRIORITY_LABEL_KEY[task.priority])}</Badge>;
            },
          },
          {
            key: 'status',
            label: t('statusLabel'),
            render: (row: unknown) => {
              const task = row as TaskDetails;
              return <Badge tone={STATUS_TONE[task.status]}>{t(STATUS_LABEL_KEY[task.status])}</Badge>;
            },
          },
          {
            key: 'createdAt',
            label: t('hkColCreatedAt'),
            render: (row: unknown) => {
              const task = row as TaskDetails;
              return task.log[task.log.length - 1]?.time ?? '';
            },
          },
          {
            key: 'actions',
            label: t('colActions'),
            render: (row: unknown) => {
              const task = row as TaskDetails;
              return <Button variant="ghost" onClick={() => setSelectedId(task.id)}>›</Button>;
            },
          },
        ]}
        rows={filteredRows}
      />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />

      <TaskDetailsDrawer task={selectedTask} onClose={() => setSelectedId(null)} />
      {/* TODO: connect to the real service when it is ready */}
      <TaskFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSubmit={() => setFormOpen(false)} />
    </div>
  );
}