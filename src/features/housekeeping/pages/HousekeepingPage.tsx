import { useState } from 'react';
import { FilterBar } from '../../../components/common/FilterBar';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Drawer } from '../../../components/ui/Drawer';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';

const rows = [{ id: '1', roomNumber: '101', task: 'تنظيف الغرفة', status: 'Pending' }];

export function HousekeepingPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="feature-page">
      <PageHero title="تنظيف الغرف" description="متابعة مهام التنظيف." />
      <FilterBar value={query} onChange={setQuery} placeholder="ابحث عن الغرفة أو المهمة" />
      <Table columns={[
        { key: 'roomNumber', label: 'الغرفة', render: (row: unknown) => (row as { roomNumber: string }).roomNumber },
        { key: 'task', label: 'المهمة' },
        { key: 'status', label: 'الحالة', render: (row: unknown) => <Badge tone="warning">{(row as { status: string }).status}</Badge> },
      ]} rows={rows} />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />
      <Drawer open={selected !== null} title="تفاصيل المهمة" onClose={() => setSelected(null)}><p>تفاصيل المهمة ستظهر هنا.</p></Drawer>
    </div>
  );
}