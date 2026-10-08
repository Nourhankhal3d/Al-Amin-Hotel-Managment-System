import { useState } from 'react';
import { FilterBar } from '../../../components/common/FilterBar';
import { PageHero } from '../../../components/common/PageHero';
import { Pagination } from '../../../components/ui/Pagination';
import { StatCard } from '../../../components/ui/StatCard';
import { Table } from '../../../components/ui/Table';

const rows = [{ id: '1', number: '101', status: 'Available', type: 'Standard' }];

export function RoomsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  return (
    <div className="feature-page">
      <PageHero title="الغرف" description="معاينة حالة الغرف الحالية." />
      <div className="stat-grid"><StatCard label="الإجمالي" value={rows.length} icon="⌂" /><StatCard label="متاحة" value={1} icon="✓" tone="blue" /></div>
      <FilterBar value={query} onChange={setQuery} placeholder="ابحث عن رقم الغرفة أو النوع" />
      <Table columns={[{ key: 'number', label: 'رقم الغرفة', render: (row: unknown) => (row as { number: string }).number }, { key: 'status', label: 'الحالة' }]} rows={rows} />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />
    </div>
  );
}
