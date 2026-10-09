import { useState } from 'react';
import { FilterBar } from '../../../components/common/FilterBar';
import { PageHero } from '../../../components/common/PageHero';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { Table } from '../../../components/ui/Table';
import { MaintenanceDetailsDrawer } from '../components/MaintenanceDetailsDrawer';
import type { MaintenanceDetails } from '../components/MaintenanceDetailsDrawer';
import { MaintenanceFormDrawer } from '../components/MaintenanceFormDrawer';

// TEMP: placeholder data until the real service is connected
const rows: MaintenanceDetails[] = [
  {
    id: '1',
    roomNumber: '305',
    issue: 'ضعف ضغط المياه',
    reference: 'MT-127',
    reportedAt: 'أُبلغ ١٠:٢٠ ص',
    status: 'معلّقة',
    priority: 'مرتفع',
    expectedFixAt: '١٢:٤٥ م',
    lastUpdate: 'منذ ٣٢ د',
    notes: 'ضعف المياه في غرفة الضيف. تم إبلاغ الفريق الفني مع طلب الفحص في أقرب وقت.',
    log: [
      { id: 'l1', title: 'تحديث حالة الغرفة', description: 'تم تأكيد حالة الغرفة', time: '١١:٤٢ ص' },
      { id: 'l2', title: 'بدأ التنظيف', description: 'أسندت المهمة إلى موظف نظافة', time: '٩:١٥ ص' },
      { id: 'l3', title: 'تسجيل المغادرة', description: 'تم إغلاق حساب الضيف', time: 'أمس' },
    ],
  },
];

export function MaintenancePage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const selectedRequest = rows.find((row) => row.id === selectedId) ?? null;

  return (
    <div className="feature-page">
      <PageHero title="سجل الصيانة" description="الإبلاغ عن مشكلات الغرف ومتابعة حالتها حتى الحل.">
        <Button onClick={() => setFormOpen(true)}>تسجيل بلاغ جديد</Button>
      </PageHero>
      <FilterBar value={query} onChange={setQuery} placeholder="ابحث برقم الغرفة أو وصف المشكلة" />
      <Table columns={[
        {
          key: 'roomNumber',
          label: 'الغرفة',
          render: (row: unknown) => {
            const request = row as MaintenanceDetails;
            return <Button variant="ghost" onClick={() => setSelectedId(request.id)}>{request.roomNumber}</Button>;
          },
        },
        { key: 'issue', label: 'المشكلة', render: (row: unknown) => (row as MaintenanceDetails).issue },
        { key: 'status', label: 'الحالة', render: (row: unknown) => <Badge tone="warning">{(row as MaintenanceDetails).status}</Badge> },
      ]} rows={rows} />
      <Pagination page={page} totalPages={1} onPageChange={setPage} />
      <MaintenanceDetailsDrawer request={selectedRequest} onClose={() => setSelectedId(null)} />
      {/* TODO: connect to the real service when it is ready */}
      <MaintenanceFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSubmit={() => setFormOpen(false)} />
    </div>
  );
}