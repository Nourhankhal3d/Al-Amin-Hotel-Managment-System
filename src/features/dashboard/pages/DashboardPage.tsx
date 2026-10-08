import { PageHero } from '../../../components/common/PageHero';
import { StatCard } from '../../../components/ui/StatCard';

export function DashboardPage() {
  return (
    <div className="feature-page">
      <PageHero title="لوحة القيادة" description="ملخص الوضع الحالي للفندق." />
      <div className="stat-grid">
        <StatCard label="غرفة محجوزة" value="0" icon="⌂" />
        <StatCard label="غرفة متاحة" value="0" icon="✓" tone="blue" />
        <StatCard label="مهام التنظيف" value="0" icon="◌" tone="amber" />
        <StatCard label="طلبات الصيانة" value="0" icon="⚙" tone="rose" />
      </div>
    </div>
  );
}
