import './HousekeepingPage.css';
import { useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock, Flag, Sparkles } from 'lucide-react';
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

const PAGE_SIZE = 5;

// TEMP: the floor is the first digit of the room number until the backend sends it
const getFloor = (roomNumber: string) => roomNumber.charAt(0);

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
  const { t, dir } = useLanguage();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [floor, setFloor] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const floorOptions = Array.from(new Set(rows.map((row) => getFloor(row.roomNumber)))).sort();

  const filteredRows = rows.filter((row) => {
    const search = query.trim();
    const typeLabel = t(TASK_TYPE_LABEL_KEY[row.taskType]);
    const matchesQuery = !search || row.roomNumber.includes(search) || typeLabel.includes(search);
    const matchesStatus = !status || row.status === status;
    const matchesPriority = !priority || row.priority === priority;
    const matchesFloor = !floor || getFloor(row.roomNumber) === floor;
    return matchesQuery && matchesStatus && matchesPriority && matchesFloor;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedTask = rows.find((row) => row.id === selectedId) ?? null;

  const changeFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const resetFilters = () => {
    setQuery('');
    setStatus('');
    setPriority('');
    setFloor('');
    setPage(1);
  };

  const OpenIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="feature-page housekeeping-page">
      <PageHero
        className="housekeeping-hero"
        title={t('hkHeroTitle')}
        eyebrow={t('housekeeping')}
        description={t('hkHeroDesc')}
      >
        <Button className="housekeeping-hero__cta" onClick={() => setFormOpen(true)}>{t('hkNewTask')}</Button>
      </PageHero>

      <div className="stat-grid">
        <StatCard className="housekeeping-stat" label={t('hkStatToday')} value={rows.length} icon={<CalendarDays size={20} aria-hidden="true" />} tone="amber" />
        <StatCard className="housekeeping-stat" label={t('hkStatHigh')} value={rows.filter((row) => row.priority === 'high').length} icon={<Flag size={20} aria-hidden="true" />} tone="rose" />
        <StatCard className="housekeeping-stat" label={t('hkStatDone')} value={rows.filter((row) => row.status === 'done').length} icon={<Check size={20} aria-hidden="true" />} tone="teal" />
        <StatCard className="housekeeping-stat" label={t('hkStatInProgress')} value={rows.filter((row) => row.status === 'in_progress').length} icon={<Sparkles size={20} aria-hidden="true" />} tone="blue" />
        <StatCard className="housekeeping-stat" label={t('hkStatPending')} value={rows.filter((row) => row.status === 'pending').length} icon={<Clock size={20} aria-hidden="true" />} tone="amber" />
      </div>

      <HousekeepingFilters
        query={query}
        status={status}
        priority={priority}
        floor={floor}
        floorOptions={floorOptions}
        onQueryChange={changeFilter(setQuery)}
        onStatusChange={changeFilter(setStatus)}
        onPriorityChange={changeFilter(setPriority)}
        onFloorChange={changeFilter(setFloor)}
        onReset={resetFilters}
      />

      <section className="housekeeping-list">
        <header className="housekeeping-list__header">
          <div>
            <h2>{t('hkListTitle')}</h2>
            <p>{t('hkListSubtitle')}</p>
          </div>
          <Badge tone="success">{filteredRows.length} {t('hkListCount')}</Badge>
        </header>

        <Table
          columns={[
            {
              key: 'roomNumber',
              label: t('colRoom'),
              render: (row: unknown) => <Badge tone="success">{(row as TaskDetails).roomNumber}</Badge>,
            },
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
                return (
                  <button
                    type="button"
                    className="housekeeping-open-btn"
                    aria-label={t('hkDetailsEyebrow')}
                    onClick={() => setSelectedId(task.id)}
                  >
                    <OpenIcon size={18} aria-hidden="true" />
                  </button>
                );
              },
            },
          ]}
          rows={visibleRows}
        />
      </section>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <TaskDetailsDrawer task={selectedTask} onClose={() => setSelectedId(null)} />
      {/* TODO: connect to the real service when it is ready */}
      <TaskFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSubmit={() => setFormOpen(false)} />
    </div>
  );
}
