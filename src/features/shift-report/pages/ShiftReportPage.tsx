import { useEffect, useState } from 'react';
import { PageHero } from '../../../components/common/PageHero';
import { StatCard } from '../../../components/ui/StatCard';
import { getShiftReport, getShiftSummary } from '../../shift-handover/services/shift-handover.api';
import type { ShiftSummary } from '../../shift-handover/types/shift-handover.types';

export function ShiftReportPage() {
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getShiftSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) setError('تعذر تحميل بيانات المناوبة. حاولي تحديث الصفحة.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function downloadReport() {
    if (!summary) return;

    try {
      const pdf = await getShiftReport(summary.shift.shift_id);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'shift-report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('تعذر تحميل ملف التقرير PDF. حاولي مرة أخرى.');
    }
  }

  const completedTasks =
    summary?.cleaning_tasks.filter((task) => task.status === 'done').length ?? 0;

  return (
    <div className="feature-page">
      <PageHero
        title="تقرير المناوبة"
        description="ملخص بيانات المناوبة الحالية."
      />

      {loading && <p role="status">جاري تحميل التقرير...</p>}
      {error && <p role="alert">{error}</p>}

      {summary && (
        <>
          <div className="stat-grid">
            <StatCard label="الوصول" value={String(summary.check_ins)} icon="✓" />
            <StatCard
              label="المغادرة"
              value={String(summary.check_outs)}
              icon="←"
              tone="blue"
            />
            <StatCard
              label="المهام المكتملة"
              value={String(completedTasks)}
              icon="◌"
              tone="amber"
            />
          </div>

          <section className="feature-section">
            <h2>تفاصيل المناوبة</h2>
            <p>التاريخ: {summary.shift.shift_date}</p>
            <p>نوع المناوبة: {summary.shift.shift_type}</p>
            <p>
              الحالة:{' '}
              {summary.shift.status === 'active' ? 'نشطة' : 'تم التسليم'}
            </p>
            <p>إجمالي المدفوعات: {summary.payments.total}</p>
            <p>عدد الغرف التي تم التعامل معها: {summary.rooms_handled.length}</p>
            <button type="button" onClick={downloadReport}>
              تحميل التقرير PDF
            </button>
          </section>
        </>
      )}
    </div>
  );
}
