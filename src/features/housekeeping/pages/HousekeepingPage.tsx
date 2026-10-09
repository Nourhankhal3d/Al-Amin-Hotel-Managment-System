import { useState } from 'react';
import { FilterBar } from '../../../components/common/FilterBar';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';
import { TaskDetailsDrawer } from '../components/TaskDetailsDrawer';
import type { TaskDetails } from '../components/TaskDetailsDrawer';

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
];

export function HousekeepingPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTask = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <div className="feature-page">
      <PageHero title="تنظيف الغرف" description="متابعة مهام التنظيف." />
      <FilterBar value={query} onChange={setQuery} placeholder="ابحث عن الغرفة أو المهمة" />
      <Table columns={[
        {
          key: 'roomNumber',
          label: 'الغرفة',
          render: (row: unknown) => {
            const task = row as TaskDetails;
            return <Button variant="ghost" onClick={() => setSelectedId(task.id)}>{task.roomNumber}</Button>;
          },
        },
        { key: 'taskType', label: 'المهمة', render: (row: unknown) => (row as TaskDetails).taskType },
        { key: 'status', label: 'الحالة', render: (row: unknown) => <Badge tone="info">{(row as TaskDetails).status}</Badge> },
      ]} rows={rows} />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />
      <TaskDetailsDrawer task={selectedTask} onClose={() => setSelectedId(null)} />
    </div>
  );
}