import { Check, LogIn, LogOut } from 'lucide-react';
import { PageHero } from '../../../components/common/PageHero';
import { StatCard } from '../../../components/ui/StatCard';

export function ShiftReportPage() {
  return <div className="feature-page"><PageHero title="تقرير المناوبة" description="ملخص تقرير المناوبة الحالية." /><div className="stat-grid"><StatCard label="الوصول" value="0" icon={<LogIn aria-hidden="true" />} /><StatCard label="المغادرة" value="0" icon={<LogOut aria-hidden="true" />} tone="blue" /><StatCard label="المهام" value="0" icon={<Check aria-hidden="true" />} tone="amber" /></div></div>;
}
