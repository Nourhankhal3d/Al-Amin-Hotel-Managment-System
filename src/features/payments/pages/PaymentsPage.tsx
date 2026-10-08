import { useState } from 'react';
import { FilterBar } from '../../../components/common/FilterBar';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Drawer } from '../../../components/ui/Drawer';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';

const rows = [{ id: '1', guestName: 'عبدالرحمن', amount: 250, method: 'Cash', status: 'Completed' }];

export function PaymentsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="feature-page">
      <PageHero title="الدفع" description="معاينة مدفوعات الضيوف." />
      <FilterBar value={query} onChange={setQuery} placeholder="ابحث عن الضيوف أو الطريقة" />
      <Table columns={[{ key: 'guestName', label: 'الضيف' }, { key: 'amount', label: 'المبلغ' }, { key: 'method', label: 'الطريقة' }, { key: 'status', label: 'الحالة', render: (row: unknown) => <Badge tone="success">{(row as { status: string }).status}</Badge> }]} rows={rows} />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />
      <Drawer open={selected !== null} title="تفاصيل الدفع" onClose={() => setSelected(null)}><p>تفاصيل الدفع ستظهر هنا.</p></Drawer>
    </div>
  );
}
