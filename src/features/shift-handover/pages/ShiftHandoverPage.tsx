import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { Timeline } from '../../../components/common/Timeline';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { AppError } from '../../../core/errors/AppError';
import type { CleaningTask, MaintenanceIssue, ShiftSummary } from '../types/shift-handover.types';
import { getShiftReport } from '../services/shift-handover.api';
import { useHandoverShift, useShiftSummary } from '../hooks/useShiftHandover';
import './ShiftHandoverPage.css';

const currencyFormatter = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
});

function formatDate(value: string): string {
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00`
    : value;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(date);
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function SummaryIcon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    cleaning: <><path d="m4 20 9-9m-6 6 2 2m2-5 2 2m-1-9 5-5 4 4-5 5M5 19l-2 2" /><path d="m14 5 5 5" /></>,
    maintenance: <><path d="M14.5 6.5a5 5 0 0 0-6.7 6.7L3 18l3 3 4.8-4.8a5 5 0 0 0 6.7-6.7L14 13l-3-3 3.5-3.5Z" /></>,
    payments: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18m-5 5h2" /></>,
    total: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" /><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></>,
    arrival: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /><path d="M18 6h4m-2-2v4" /></>,
    departure: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /><path d="M18 6h4m-2-2v4" /></>,
    rooms: <><path d="M3 19v-8h18v8M3 15h18M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" /><path d="M5 19v-4m14 4v-4" /></>,
    done: <><path d="m5 12 4 4L19 6" /></>,
  };

  return (
    <svg className="shift-handover__summary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name] ?? icons.total}
    </svg>
  );
}

function getTimelineItems(summary: ShiftSummary) {
  const items = [
    ...summary.cleaning_tasks.map((task: CleaningTask) => ({
      id: `cleaning-${task.task_id}`,
      title: task.status === 'done' ? 'إنجاز مهمة تنظيف' : 'إسناد مهمة تنظيف',
      description: `الغرفة ${task.room_id}${task.notes ? ` · ${task.notes}` : ''}`,
      date: task.finished_date ?? task.assigned_date,
    })),
    ...summary.maintenance_issues.map((issue: MaintenanceIssue) => ({
      id: `maintenance-${issue.issue_id}`,
      title: issue.status === 'resolved' ? 'حل بلاغ صيانة' : 'تسجيل بلاغ صيانة',
      description: `الغرفة ${issue.room_id} · ${issue.problem}`,
      date: issue.resolved_date ?? issue.created_date,
    })),
  ];

  return items
    .sort((first, second) => Date.parse(second.date) - Date.parse(first.date))
    .slice(0, 6)
    .map(({ date, ...item }) => ({ ...item, time: formatTime(date) }));
}

function getPendingRows(summary: ShiftSummary) {
  return [
    { label: 'تنظيف معلق', count: summary.pending.cleaning_tasks.length, icon: 'cleaning' },
    { label: 'صيانة مفتوحة', count: summary.pending.maintenance_issues.length, icon: 'maintenance' },
    { label: 'مدفوعات معلقة', count: summary.pending.unverified_payments.length, icon: 'payments' },
  ];
}

function getCompletedRows(summary: ShiftSummary) {
  return [
    { label: 'الوصول', value: summary.check_ins, icon: 'arrival' },
    { label: 'المغادرة', value: summary.check_outs, icon: 'departure' },
    { label: 'الغرف', value: summary.rooms_handled.length, icon: 'rooms' },
    { label: 'تنظيف مكتمل', value: summary.cleaning_tasks.filter((task) => task.status === 'done').length, icon: 'done' },
    { label: 'صيانة محلولة', value: summary.maintenance_issues.filter((issue) => issue.status === 'resolved').length, icon: 'maintenance' },
  ];
}

export function ShiftHandoverPage() {
  const handover = useHandoverShift();
  const { data: summary, isLoading, isError, error, refetch } = useShiftSummary(!handover.isSuccess);
  const [notes, setNotes] = useState<string | null>(null);
  const [reportError, setReportError] = useState<unknown>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function downloadReport() {
    if (!summary) return;
    setIsDownloading(true);
    setReportError(null);
    try {
      const report = await getShiftReport(summary.shift.shift_id);
      const url = URL.createObjectURL(report);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shift-${summary.shift.shift_id}-report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setReportError(downloadError);
    } finally {
      setIsDownloading(false);
    }
  }

  function submitHandover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handover.mutate({ shift_notes: notes ?? summary?.shift.shift_notes ?? '' });
  }

  if (isLoading) return <LoadingState label="جارٍ تحميل ملخص الوردية..." />;

  if (isError && error instanceof AppError && error.code === 'NOT_FOUND') {
    return <EmptyState title="لا توجد وردية نشطة" description="ستظهر تفاصيل الوردية هنا عند بدء المناوبة." />;
  }

  if (isError) {
    return (
      <div className="shift-handover__load-error">
        <ErrorState title="تعذر تحميل الوردية" message={getErrorMessage(error)} />
        <Button variant="secondary" onClick={() => void refetch()}>إعادة المحاولة</Button>
      </div>
    );
  }

  if (!summary) {
    return <EmptyState title="لا توجد وردية نشطة" description="ستظهر تفاصيل الوردية هنا عند بدء المناوبة." />;
  }

  const pendingRows = getPendingRows(summary);
  const pendingTotal = pendingRows.reduce((total, row) => total + row.count, 0);
  const pendingTiles = [...pendingRows, { label: 'إجمالي العناصر المعلقة', count: pendingTotal, icon: 'total' }];
  const completedRows = getCompletedRows(summary);
  const timelineItems = getTimelineItems(summary);
  const isHandedOver = handover.isSuccess;
  const shiftNotes = notes ?? summary.shift.shift_notes ?? '';
  const trackedTasks = [...summary.cleaning_tasks, ...summary.maintenance_issues];
  const completedTasks = summary.cleaning_tasks.filter((task) => task.status === 'done').length
    + summary.maintenance_issues.filter((issue) => issue.status === 'resolved').length;
  const completionPercent = trackedTasks.length
    ? Math.round((completedTasks / trackedTasks.length) * 100)
    : 0;

  return (
    <div className="feature-page shift-handover">
      <PageHero
        title="إنهاء الوردية"
        description="راجع ملخص الوردية وأرسل تفاصيل التسليم إلى فريق الاستقبال التالي."
      >
        <div className="shift-handover__hero-actions">
          <Button variant="secondary" onClick={() => void downloadReport()} disabled={isDownloading}>
            {isDownloading ? 'جارٍ تجهيز التقرير...' : 'تصدير'}
          </Button>
          <Button
            form="shift-handover-form"
            type="submit"
            disabled={isHandedOver || handover.isPending}
          >
            {handover.isPending ? 'جارٍ الإرسال...' : 'إرسال التسليم'}
          </Button>
        </div>
      </PageHero>

      <Card className="shift-handover__shift-info">
        <div><span>تاريخ الوردية</span><strong>{formatDate(summary.shift.shift_date)}</strong></div>
        <div><span>نوع الوردية</span><strong>{summary.shift.shift_type === 'morning' ? 'صباحية' : summary.shift.shift_type === 'evening' ? 'مسائية' : 'ليلية'}</strong></div>
        <div><span>وقت الوردية</span><strong>{summary.shift.start_time} - {summary.shift.end_time}</strong></div>
        <div className="shift-handover__shift-mark" aria-label={isHandedOver ? 'تم تسليم الوردية' : 'الوردية نشطة'}>
          <span aria-hidden="true">{isHandedOver ? '✓' : 'نشطة'}</span>
        </div>
        <div className="shift-handover__shift-progress">
          <div className="shift-handover__progress-label">
            <span>إنجاز مهام الوردية</span>
            <strong>{completedTasks} من {trackedTasks.length} مهام</strong>
          </div>
          <div
            className="shift-handover__progress-track"
            role="progressbar"
            aria-label="إنجاز مهام الوردية"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercent}
          >
            <span style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </Card>

      <div className="shift-handover__overview">
        <Card className="shift-handover__panel shift-handover__pending">
          <div className="shift-handover__panel-heading">
            <div><h2>عناصر معلقة</h2><p>تحتاج متابعة من الوردية التالية</p></div>
            <span className="shift-handover__count">{pendingTotal} عناصر</span>
          </div>
          <div className="shift-handover__pending-list">
            {pendingTiles.map((row) => (
              <div className="shift-handover__pending-item" key={row.label}>
                <SummaryIcon name={row.icon} />
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </div>
            ))}
            {pendingRows.every((row) => row.count === 0) && <p className="shift-handover__all-clear">لا توجد عناصر معلقة</p>}
          </div>
        </Card>

        <Card className="shift-handover__panel shift-handover__completed">
          <div className="shift-handover__panel-heading">
            <div><h2>الأنشطة المكتملة</h2><p>ملخص ما تم إنجازه خلال الوردية</p></div>
            <span className="shift-handover__count">ملخص الأداء</span>
          </div>
          <div className="shift-handover__completed-grid">
            {completedRows.map((row) => (
              <div className="shift-handover__completed-item" key={row.label}>
                <div className="shift-handover__completed-label">
                  <SummaryIcon name={row.icon} />
                  <span>{row.label}</span>
                </div>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="shift-handover__details">
        <Card className="shift-handover__finance">
          <div className="shift-handover__finance-heading"><span>إجمالي تحصيل الوردية</span><span aria-hidden="true">EGP</span></div>
          <strong className="shift-handover__finance-total">{currencyFormatter.format(summary.payments.total)}</strong>
          <div className="shift-handover__payment-breakdown">
            <div><span>نقدًا</span><strong>{currencyFormatter.format(summary.payments.cash)}</strong></div>
            <div><span>إنستا باي</span><strong>{currencyFormatter.format(summary.payments.instapay)}</strong></div>
            <div><span>محفظة إلكترونية</span><strong>{currencyFormatter.format(summary.payments.vodafone_cash)}</strong></div>
          </div>
        </Card>

        <Card className="shift-handover__timeline">
          <div className="shift-handover__panel-heading">
            <div><h2>الخط الزمني للوردية</h2><p>آخر الأنشطة المسجلة تلقائيًا</p></div>
          </div>
          {timelineItems.length > 0
            ? (
              <Timeline
                items={timelineItems}
                renderItem={(item) => (
                  <div className="shift-handover__timeline-row">
                    <div className="shift-handover__timeline-copy">
                      <strong>{item.title}</strong>
                      {item.description && <p>{item.description}</p>}
                    </div>
                    <div className="shift-handover__timeline-meta">
                      {item.time && <time>{item.time}</time>}
                      <span className="shift-handover__timeline-icon">
                        <SummaryIcon name={item.id.startsWith('cleaning-') ? 'cleaning' : 'maintenance'} />
                      </span>
                    </div>
                  </div>
                )}
              />
            )
            : <EmptyState title="لا توجد أنشطة مسجلة" description="ستظهر مهام التشغيل هنا عند تسجيلها." />}
        </Card>
      </div>

          <form id="shift-handover-form" className="shift-handover__form" onSubmit={submitHandover}>
        <Card className="shift-handover__notes">
          <div className="shift-handover__panel-heading">
            <div><h2>ملاحظات الوردية التالية</h2><p>أضف أي تفاصيل مهمة لفريق الاستقبال التالي</p></div>
            <span className="shift-handover__optional">اختياري</span>
          </div>
          <textarea
            aria-label="ملاحظات الوردية التالية"
            placeholder="اكتب ملاحظاتك هنا..."
            value={shiftNotes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isHandedOver}
            rows={4}
          />
        </Card>

        {(reportError || handover.error) && (
          <ErrorState
            title="تعذر إكمال الإجراء"
            message={getErrorMessage(reportError ?? handover.error)}
          />
        )}

        <div className="shift-handover__footer">
          <div className="shift-handover__footer-copy">
            <span>ملخص الأداء</span>
            <strong>{isHandedOver ? 'تم تسليم الوردية بنجاح' : `${completionPercent}% من مهام الوردية مكتملة`}</strong>
          </div>
          <div className="shift-handover__footer-actions">
            <Button variant="secondary" disabled title="حفظ المسودة غير متاح">
              حفظ كمسودة
            </Button>
            <Button variant="secondary" onClick={() => void downloadReport()} disabled={isDownloading}>
              {isDownloading ? 'جارٍ تجهيز التقرير...' : 'إنشاء تقرير'}
            </Button>
            <Button type="submit" disabled={isHandedOver || handover.isPending}>
              {handover.isPending ? 'جارٍ إرسال التسليم...' : isHandedOver ? 'تم إرسال التسليم' : 'إرسال التسليم'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
