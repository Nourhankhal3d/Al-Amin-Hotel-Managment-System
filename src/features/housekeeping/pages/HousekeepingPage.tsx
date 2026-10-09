import './HousekeepingPage.css';
import { useState } from 'react';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';
import { HousekeepingFilters } from '../components/HousekeepingFilters';
import { TaskDetailsDrawer } from '../components/TaskDetailsDrawer';
import type { TaskDetails } from '../components/TaskDetailsDrawer';
import { TaskFormDrawer } from '../components/TaskFormDrawer';

// TEMP: texts live here until i18n is wired
const LABELS = {
  heroTitle: 'متابعة التنظيف',
  heroDescription: 'الإبلاغ عن احتياجات تنظيف الغرف ومتابعة حالتها حتى الاكتمال.',
  newTask: 'الإبلاغ عن تنظيف',
  statToday: 'مهام اليوم',
  statHigh: 'أولوية مرتفعة',
  statDone: 'مكتملة',
  statInProgress: 'قيد التنفيذ',
  statPending: 'معلّقة',
  room: 'الغرفة',
  taskType: 'نوع المهمة',
  priority: 'الأولوية',
  status: 'الحالة',
  createdAt: 'وقت التسجيل',
  actions: 'الإجراءات',
};

// TODO: move these maps to constants/housekeeping.constants.ts
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
const STATUS_TONE: Record<string, Tone> = { 'معلّقة': 'warning', 'قيد التنفيذ': 'info', 'مكتملة': 'success' };
const PRIORITY_TONE: Record<string, Tone> = { 'عادي': 'neutral', 'مرتفع': 'warning', 'حرج': 'danger' };

// TEMP: placeholder data until the real service is connected
const rows: TaskDetails[] = [
  {
    id: '1',
    roomNumber: '207',
    taskType: 'تنظيف بعد المغادرة',
    status: 'قيد التنفيذ',
    priority: 'مرتفع',
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
    taskType: 'تجهيز قبل الوصول',
    status: 'معلّقة',
    priority: 'حرج',
    log: [{ id: 'l1', title: 'طُلب التنظيف', description: 'تم إنشاء الطلب من الاستقبال', time: '١١:٠٥ ص' }],
  },
  {
    id: '3',
    roomNumber: '112',
    taskType: 'تنظيف يومي',
    status: 'مكتملة',
    priority: 'عادي',
    log: [{ id: 'l1', title: 'اكتملت المهمة', description: 'تم تنظيف الغرفة', time: '٩:٣٠ ص' }],
  },
  {
    id: '4',
    roomNumber: '210',
    taskType: 'طلب من الضيف',
    status: 'معلّقة',
    priority: 'مرتفع',
    log: [{ id: 'l1', title: 'طُلب التنظيف', description: 'طلب من الضيف', time: '١٠:١٠ ص' }],
  },
];

export function HousekeepingPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filteredRows = rows.filter((row) => {
    const matchesQuery = !query || row.roomNumber.includes(query) || row.taskType.includes(query);
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
      <PageHero title={LABELS.heroTitle} description={LABELS.heroDescription}>
        <Button onClick={() => setFormOpen(true)}>{LABELS.newTask}</Button>
      </PageHero>

      <div className="housekeeping-stats">
        <StatCard label={LABELS.statToday} value={rows.length} icon="▤" tone="amber" />
        <StatCard label={LABELS.statHigh} value={rows.filter((row) => row.priority === 'مرتفع').length} icon="!" tone="rose" />
        <StatCard label={LABELS.statDone} value={rows.filter((row) => row.status === 'مكتملة').length} icon="✓" tone="teal" />
        <StatCard label={LABELS.statInProgress} value={rows.filter((row) => row.status === 'قيد التنفيذ').length} icon="✦" tone="blue" />
        <StatCard label={LABELS.statPending} value={rows.filter((row) => row.status === 'معلّقة').length} icon="◷" tone="amber" />
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
          { key: 'roomNumber', label: LABELS.room, render: (row: unknown) => (row as TaskDetails).roomNumber },
          { key: 'taskType', label: LABELS.taskType, render: (row: unknown) => (row as TaskDetails).taskType },
          {
            key: 'priority',
            label: LABELS.priority,
            render: (row: unknown) => {
              const task = row as TaskDetails;
              return <Badge tone={PRIORITY_TONE[task.priority] ?? 'neutral'}>{task.priority}</Badge>;
            },
          },
          {
            key: 'status',
            label: LABELS.status,
            render: (row: unknown) => {
              const task = row as TaskDetails;
              return <Badge tone={STATUS_TONE[task.status] ?? 'neutral'}>{task.status}</Badge>;
            },
          },
          {
            key: 'createdAt',
            label: LABELS.createdAt,
            render: (row: unknown) => {
              const task = row as TaskDetails;
              return task.log[task.log.length - 1]?.time ?? '';
            },
          },
          {
            key: 'actions',
            label: LABELS.actions,
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