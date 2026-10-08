import { useState } from 'react';
import { FilterBar } from '../../../components/common/FilterBar';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Drawer } from '../../../components/ui/Drawer';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';

const rows = [{ id: '1', roomNumber: '101', title: 'إصلاح مصباح', status: 'Pending' }];

export function MaintenancePage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="feature-page">
      <PageHero title="الصيانة" description="متابعة طلبات الصيانة." />
      <FilterBar value={query} onChange={setQuery} placeholder="ابحث عن الطلب أو الغرفة" />
      <Table columns={[{ key: 'roomNumber', label: 'الغرفة' }, { key: 'title', label: 'الطلب' }, { key: 'status', label: 'الحالة', render: (row: unknown) => <Badge tone="warning">{(row as { status: string }).status}</Badge> }]} rows={rows} />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />
      <Drawer open={selected !== null} title="تفاصيل الطلب" onClose={() => setSelected(null)}><p>تفاصيل الطلب ستظهر هنا.</p></Drawer>
    </div>
  );
}
