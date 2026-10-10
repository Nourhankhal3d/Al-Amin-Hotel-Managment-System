import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useToast } from '../../../components/common/toast.context';
import {
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  DownloadIcon,
  NoteIcon,
  PdfIcon,
  PrintIcon,
  ShareIcon,
  UserIcon,
  WalletIcon,
} from '../../../components/ui/Icons';
import { ROUTES } from '../../../core/constants/routes';
import { formatDate, formatDateTime, formatTime } from '../../../core/utils/date';
import { formatMoney, toArabicDigits } from '../../../core/utils/numerals';
import { getShiftReport } from '../services/shift-report.api';
import type { ShiftReportEvent, ShiftSummary } from '../types/shift-report.types';

const SHIFT_REPORT_QUERY_KEY = ['shift-report', 'summary'] as const;
const mockShiftDate = new Date();
const mockShiftStartedAt = new Date(mockShiftDate);
const mockShiftEndedAt = new Date(mockShiftDate);
mockShiftStartedAt.setHours(7, 0, 0, 0);
mockShiftEndedAt.setHours(15, 0, 0, 0);

const MOCK_SHIFT_SUMMARY: ShiftSummary = {
  date: mockShiftDate.toISOString().slice(0, 10),
  checkedIn: 18,
  checkedOut: 8,
  tasksCompleted: 14,
  staffName: 'محمد أحمد',
  staffRole: 'موظف الاستقبال',
  shiftName: 'الوردية الصباحية',
  startedAt: mockShiftStartedAt.toISOString(),
  endedAt: mockShiftEndedAt.toISOString(),
  performanceScore: 96,
  totalCollected: 24850,
  cashCollected: 7200,
  cardCollected: 9850,
  transferCollected: 7800,
  housekeepingTasks: 12,
  maintenanceTasks: 4,
  reservations: 9,
  guestRequests: 6,
  notes: 'تم تسليم جميع المهام ومراجعة سجلات الغرف والمدفوعات. لا توجد ملاحظات طارئة للوردية التالية.',
  events: [
    { id: 'event-1', title: 'بدء الوردية', description: 'استلام مكتب الاستقبال ومراجعة الحجوزات', time: '07:00' },
    { id: 'event-2', title: 'تسجيل الوصول', description: 'تسكين الضيوف في الغرف ١٠٢ و٢٠٤', time: '08:25' },
    { id: 'event-3', title: 'تسجيل دفعة', description: 'تحصيل ٣٬٢٠٠ ج.م — الغرفة ٣٠٤', time: '10:10' },
    { id: 'event-4', title: 'اكتمال مهام النظافة', description: 'تجهيز ١٢ غرفة للضيوف', time: '12:40' },
    { id: 'event-5', title: 'تسليم الوردية', description: 'مراجعة الصندوق والملاحظات التشغيلية', time: '15:00' },
  ],
};

interface ActivityMetric {
  label: string;
  value: number;
  maximum: number;
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadShiftReport(summary: ShiftSummary): void {
  const rows = [
    ['البند', 'القيمة'],
    ['تاريخ التقرير', summary.date],
    ['الموظف', summary.staffName ?? ''],
    ['الوردية', summary.shiftName ?? ''],
    ['الوصول', summary.checkedIn],
    ['المغادرة', summary.checkedOut],
    ['المهام المكتملة', summary.tasksCompleted],
    ['إجمالي التحصيل (ج.م)', summary.totalCollected ?? 0],
    ['نقداً (ج.م)', summary.cashCollected ?? 0],
    ['بطاقات (ج.م)', summary.cardCollected ?? 0],
    ['تحويلات (ج.م)', summary.transferCollected ?? 0],
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `shift-report-${summary.date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function ActivityBar({ label, value, maximum }: ActivityMetric) {
  const percent = maximum > 0 ? Math.min(100, (value / maximum) * 100) : 0;

  return (
    <div className="sr-activity-bar">
      <div className="sr-activity-bar__label">
        <span>{label}</span>
        <strong>{toArabicDigits(value)}</strong>
      </div>
      <div className="sr-activity-bar__track">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function ActivityTimeline({ events }: { events: ShiftReportEvent[] }) {
  return (
    <ol className="sr-timeline">
      {events.map((event) => (
        <li key={event.id}>
          <span className="sr-timeline__dot" />
          <div className="sr-timeline__body">
            <div className="sr-timeline__heading">
              <strong>{event.title}</strong>
              {event.time && <time>{formatEventTime(event.time)}</time>}
            </div>
            {event.description && <p>{event.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatEventTime(value: string): string {
  return /^\d{1,2}:\d{2}$/.test(value) ? toArabicDigits(value) : formatTime(value, 'ar-EG');
}

export function ShiftReportPage() {
  const toast = useToast();
  const { data, isPending, isError } = useQuery({
    queryKey: SHIFT_REPORT_QUERY_KEY,
    queryFn: getShiftReport,
  });
  const summary = data
    ? import.meta.env.DEV
      ? { ...MOCK_SHIFT_SUMMARY, ...data }
      : data
    : import.meta.env.DEV
      ? MOCK_SHIFT_SUMMARY
      : undefined;

  if (!summary && isPending) {
    return <div className="sr-state" role="status">جارٍ تحميل تقرير الوردية...</div>;
  }

  if (!summary && isError) {
    return <div className="sr-state sr-state--error" role="alert">تعذّر تحميل تقرير الوردية.</div>;
  }

  if (!summary) return null;

  const checkedIn = summary.checkedIn;
  const checkedOut = summary.checkedOut;
  const tasksCompleted = summary.tasksCompleted;
  const totalCollected = summary.totalCollected ?? 0;
  const cashCollected = summary.cashCollected ?? 0;
  const cardCollected = summary.cardCollected ?? 0;
  const transferCollected = summary.transferCollected ?? 0;
  const events = summary.events ?? [];
  const activityMetrics: ActivityMetric[] = [
    { label: 'تسجيل الوصول', value: checkedIn, maximum: Math.max(checkedIn, checkedOut, 1) },
    { label: 'تسجيل المغادرة', value: checkedOut, maximum: Math.max(checkedIn, checkedOut, 1) },
    { label: 'مهام النظافة', value: summary.housekeepingTasks ?? tasksCompleted, maximum: Math.max(tasksCompleted, 1) },
    { label: 'طلبات الصيانة', value: summary.maintenanceTasks ?? 0, maximum: Math.max(tasksCompleted, 1) },
    { label: 'الحجوزات الجديدة', value: summary.reservations ?? 0, maximum: Math.max(checkedIn, 1) },
  ];
  const paymentTotal = cashCollected + cardCollected + transferCollected;
  const paymentShare = (amount: number) => paymentTotal > 0 ? (amount / paymentTotal) * 100 : 0;
  const performanceScore = Math.max(0, Math.min(100, summary.performanceScore ?? 0));
  const formattedDate = formatDate(summary.date, 'ar-EG');
  const startTime = summary.startedAt ? formatTime(summary.startedAt, 'ar-EG') : '—';
  const endTime = summary.endedAt ? formatTime(summary.endedAt, 'ar-EG') : '—';

  const handleShare = async () => {
    const shareText = `تقرير الوردية - ${formattedDate} - إجمالي التحصيل: ${formatMoney(totalCollected)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'تقرير الوردية', text: shareText, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} — ${window.location.href}`);
        toast.showToast('تم نسخ رابط التقرير', 'success');
      } else {
        toast.showToast('المشاركة غير متاحة في هذا المتصفح', 'error');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      toast.showToast('تعذرت مشاركة التقرير', 'error');
    }
  };

  return (
    <div className="shift-report-page" dir="rtl">
      <header className="sr-header">
        <div className="sr-header__title">
          <img src="/al-amin-hotel-logo.png" alt="شعار فندق الأمين" />
          <div>
            <span className="sr-eyebrow">تقرير رسمي · AL AMIN HOTEL</span>
            <h1>تقرير الوردية</h1>
            <p>مراجعة ملخص الوردية وإنشاء تقرير احترافي قابل للحفظ والمشاركة.</p>
          </div>
        </div>
        <div className="sr-header__actions">
          <button type="button" className="sr-button sr-button--primary" onClick={() => window.print()}>
            <PdfIcon /> إنشاء PDF
          </button>
          <button type="button" className="sr-button" onClick={() => window.print()}>
            <PrintIcon /> طباعة
          </button>
          <button type="button" className="sr-button" onClick={() => downloadShiftReport(summary)}>
            <DownloadIcon /> تصدير
          </button>
          <button type="button" className="sr-button" onClick={handleShare}>
            <ShareIcon /> مشاركة
          </button>
        </div>
      </header>

      <section className="sr-meta" aria-label="بيانات الوردية">
        <div><span>الموظف</span><strong>{summary.staffName ?? '—'}</strong></div>
        <div><span>المسمى الوظيفي</span><strong>{summary.staffRole ?? '—'}</strong></div>
        <div><span>الوردية</span><strong>{summary.shiftName ?? '—'}</strong></div>
        <div><span>التاريخ</span><strong>{formattedDate}</strong></div>
        <div><span>بداية الوردية</span><strong>{startTime}</strong></div>
        <div><span>نهاية الوردية</span><strong>{endTime}</strong></div>
      </section>

      <section className="sr-highlight" aria-label="ملخص أداء الوردية">
        <div className="sr-highlight__message">
          <span>ملخص الأداء</span>
          <h2>وردية منتظمة بأداء متميز</h2>
          <p>تم تنفيذ المهام التشغيلية ومتابعة طلبات الضيوف خلال الوردية.</p>
          <div className="sr-highlight__score">
            <span>مؤشر الأداء</span>
            <strong>{toArabicDigits(performanceScore)}٪</strong>
          </div>
        </div>
        <div className="sr-highlight__stats">
          <div><span>تسجيل الوصول</span><strong>{toArabicDigits(checkedIn)}</strong></div>
          <div><span>تسجيل المغادرة</span><strong>{toArabicDigits(checkedOut)}</strong></div>
          <div><span>المهام المكتملة</span><strong>{toArabicDigits(tasksCompleted)}</strong></div>
          <div><span>طلبات الضيوف</span><strong>{toArabicDigits(summary.guestRequests ?? 0)}</strong></div>
        </div>
      </section>

      <div className="sr-grid sr-grid--two">
        <section className="sr-card">
          <div className="sr-card__heading">
            <span className="sr-card__icon"><ChartIcon /></span>
            <div><h2>مؤشرات الوردية</h2><p>ملخص الأنشطة والخدمات المنفذة</p></div>
          </div>
          <div className="sr-activity-list">
            {activityMetrics.map((metric) => <ActivityBar key={metric.label} {...metric} />)}
          </div>
        </section>

        <section className="sr-card sr-performance">
          <div className="sr-card__heading">
            <span className="sr-card__icon"><ClockIcon /></span>
            <div><h2>ملخص الإنجاز</h2><p>نسبة إتمام الأعمال خلال الوردية</p></div>
          </div>
          <div className="sr-performance__ring" style={{ '--sr-score': `${performanceScore}%` } as CSSProperties}>
            <div><strong>{toArabicDigits(performanceScore)}٪</strong><span>مؤشر الأداء</span></div>
          </div>
          <div className="sr-performance__legend">
            <span><i className="sr-dot sr-dot--green" />مهام مكتملة <b>{toArabicDigits(tasksCompleted)}</b></span>
            <span><i className="sr-dot sr-dot--gold" />طلبات تمت متابعتها <b>{toArabicDigits(summary.guestRequests ?? 0)}</b></span>
          </div>
        </section>
      </div>

      <div className="sr-grid sr-grid--two">
        <section className="sr-card">
          <div className="sr-card__heading">
            <span className="sr-card__icon sr-card__icon--gold"><WalletIcon /></span>
            <div><h2>الملخص المالي</h2><p>إجمالي المدفوعات المستلمة خلال الوردية</p></div>
          </div>
          <div className="sr-finance-total">
            <span>إجمالي التحصيل</span>
            <strong>{formatMoney(totalCollected)}</strong>
          </div>
          <div className="sr-finance-breakdown">
            <div><span>نقداً</span><strong>{formatMoney(cashCollected)}</strong></div>
            <div><span>بطاقات</span><strong>{formatMoney(cardCollected)}</strong></div>
            <div><span>تحويلات</span><strong>{formatMoney(transferCollected)}</strong></div>
          </div>
          <div className="sr-payment-bar" aria-label="توزيع طرق الدفع">
            <span className="sr-payment-bar__cash" style={{ width: `${paymentShare(cashCollected)}%` }} />
            <span className="sr-payment-bar__card" style={{ width: `${paymentShare(cardCollected)}%` }} />
            <span className="sr-payment-bar__transfer" style={{ width: `${paymentShare(transferCollected)}%` }} />
          </div>
          <div className="sr-payment-legend">
            <span><i className="sr-dot sr-dot--green" />نقداً</span>
            <span><i className="sr-dot sr-dot--gold" />بطاقات</span>
            <span><i className="sr-dot sr-dot--sage" />تحويلات</span>
          </div>
        </section>

        <section className="sr-card">
          <div className="sr-card__heading">
            <span className="sr-card__icon sr-card__icon--gold"><CalendarIcon /></span>
            <div><h2>ملخص العمليات</h2><p>أهم الأرقام المسجلة في الوردية</p></div>
          </div>
          <div className="sr-operation-grid">
            <div><span className="sr-operation-tag sr-operation-tag--green">مكتمل</span><strong>{toArabicDigits(tasksCompleted)}</strong><span>المهام</span></div>
            <div><span className="sr-operation-tag sr-operation-tag--gold">مسجل</span><strong>{toArabicDigits(summary.reservations ?? 0)}</strong><span>الحجوزات</span></div>
            <div><span className="sr-operation-tag sr-operation-tag--rose">متابعة</span><strong>{toArabicDigits(summary.guestRequests ?? 0)}</strong><span>طلبات الضيوف</span></div>
            <div><span className="sr-operation-tag sr-operation-tag--blue">منجز</span><strong>{toArabicDigits(checkedOut)}</strong><span>تسجيل المغادرة</span></div>
          </div>
        </section>
      </div>

      <section className="sr-card">
        <div className="sr-card__heading">
          <span className="sr-card__icon"><NoteIcon /></span>
          <div><h2>الخط الزمني لأنشطة الوردية</h2><p>تسلسل أبرز الأحداث والإجراءات خلال اليوم</p></div>
        </div>
        {events.length > 0 ? (
          <ActivityTimeline events={events} />
        ) : (
          <p className="sr-empty">لا توجد أحداث مسجلة لهذه الوردية.</p>
        )}
      </section>

      <div className="sr-grid sr-grid--two">
        <section className="sr-card">
          <div className="sr-card__heading">
            <span className="sr-card__icon sr-card__icon--gold"><UserIcon /></span>
            <div><h2>نظرة على الأداء</h2><p>مؤشرات الإنجاز التشغيلي</p></div>
          </div>
          <div className="sr-performance-facts">
            <div><strong>{toArabicDigits(checkedIn + checkedOut)}</strong><span>حركة الضيوف</span></div>
            <div><strong>{toArabicDigits(summary.housekeepingTasks ?? tasksCompleted)}</strong><span>مهام النظافة</span></div>
            <div><strong>{toArabicDigits(summary.maintenanceTasks ?? 0)}</strong><span>طلبات الصيانة</span></div>
            <div><strong>{toArabicDigits(summary.reservations ?? 0)}</strong><span>حجوزات جديدة</span></div>
          </div>
        </section>
        <section className="sr-card">
          <div className="sr-card__heading">
            <span className="sr-card__icon sr-card__icon--gold"><NoteIcon /></span>
            <div><h2>ملاحظات وتسليم الوردية</h2><p>ملاحظات العمل للموظف والوردية القادمة</p></div>
          </div>
          <p className="sr-notes">{summary.notes ?? 'لا توجد ملاحظات إضافية لهذه الوردية.'}</p>
        </section>
      </div>

      <footer className="sr-footer">
        <Link className="sr-button" to={ROUTES.dashboard}>العودة إلى لوحة التحكم</Link>
        <div>
          <span className="sr-footer__date">{formatDateTime(summary.endedAt ?? summary.date, 'ar-EG')}</span>
          <button type="button" className="sr-button" onClick={() => window.print()}><PrintIcon /> طباعة</button>
          <button type="button" className="sr-button" onClick={handleShare}><ShareIcon /> مشاركة</button>
          <button type="button" className="sr-button sr-button--primary" onClick={() => window.print()}><PdfIcon /> حفظ PDF</button>
        </div>
      </footer>
    </div>
  );
}
