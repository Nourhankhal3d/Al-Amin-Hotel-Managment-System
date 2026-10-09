import { useQuery } from '@tanstack/react-query';
import { PageHero } from '../../../components/common/PageHero';
import { LoadingState } from '../../../components/common/LoadingState';
import { StatCard } from '../../../components/ui/StatCard';
import { formatDate } from '../../../core/utils/date';
import { toArabicDigits } from '../../../core/utils/numerals';
import { getShiftReport } from '../services/shift-report.api';
import type { ShiftSummary } from '../types/shift-report.types';

const MOCK_SHIFT_SUMMARY: ShiftSummary = {
  date: new Date().toISOString().slice(0, 10),
  checkedIn: 12,
  checkedOut: 9,
  tasksCompleted: 18,
};

export function ShiftReportPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['shift-report', 'summary'],
    queryFn: getShiftReport,
  });
  const summary = data ?? (import.meta.env.DEV ? MOCK_SHIFT_SUMMARY : undefined);

  if (!summary && isPending) {
    return <LoadingState label="جارٍ تحميل تقرير المناوبة..." />;
  }

  if (!summary && isError) {
    return <div className="ui-error-state" role="alert">تعذّر تحميل تقرير المناوبة.</div>;
  }

  if (!summary) return null;

  return (
    <div className="feature-page">
      <PageHero
        title="تقرير المناوبة"
        description={`ملخص تقرير المناوبة الحالية — ${formatDate(summary.date)}.`}
      />
      <div className="stat-grid">
        <StatCard label="الوصول" value={toArabicDigits(summary.checkedIn)} icon="✓" />
        <StatCard label="المغادرة" value={toArabicDigits(summary.checkedOut)} icon="←" tone="blue" />
        <StatCard label="المهام" value={toArabicDigits(summary.tasksCompleted)} icon="◌" tone="amber" />
      </div>
    </div>
  );
}
