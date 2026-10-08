import { PageHero } from '../../../components/common/PageHero';
import { StatCard } from '../../../components/ui/StatCard';

export function ShiftReportPage() {
  return <div className="feature-page"><PageHero title="تقرير المناوبة" description="ملخص تقرير المناوبة الحالية." /><div className="stat-grid"><StatCard label="الوصول" value="0" icon="✓" /><StatCard label="المغادرة" value="0" icon="←" tone="blue" /><StatCard label="المهام" value="0" icon="◌" tone="amber" /></div></div>;
}
