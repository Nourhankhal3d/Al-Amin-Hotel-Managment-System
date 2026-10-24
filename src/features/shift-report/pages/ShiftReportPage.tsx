import { type CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock3,
  Download,
  DoorOpen,
  Printer,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useToast } from '../../../components/common/toast.context';
import { getAuthSession } from '../../../core/auth/authManager';
import { formatNumber, formatPercent } from '../../../utils/format';
import { getShiftReport } from '../services/shift-report.api';
import type {
  CompletedTaskLog,
  RoomStatusSummary,
  ShiftReportEvent,
  ShiftSalesRow,
  ShiftSummary,
} from '../types/shift-report.types';
import './ShiftReportPage.css';

const SHIFT_REPORT_QUERY_KEY = ['shift-report', 'summary'] as const;
const SAVED_REPORT_KEY = 'al-amin-saved-shift-report';

type EventKind = 'shift' | 'arrival' | 'departure' | 'housekeeping' | 'maintenance' | 'handover';

interface TimelineEntry {
  id: string;
  title: string;
  description?: string;
  time?: string;
  kind: EventKind;
}

interface ProgressMetric {
  id: string;
  label: string;
  value: number;
  maximum: number;
  icon: LucideIcon;
  tone: 'green' | 'gold' | 'blue';
}

const number = (value: number) => formatNumber(value, 'ar');

function formatAmount(value: number): string {
  return `${number(value)} ج.م`;
}

function shiftLabel(value?: string): string {
  switch (value?.toLowerCase()) {
    case 'morning': return 'الوردية الصباحية';
    case 'evening': return 'الوردية المسائية';
    case 'night': return 'الوردية الليلية';
    default: return value ?? '—';
  }
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(value?: string): string {
  if (!value) return '—';
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    return value.replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatTimelineTime(value?: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : formatTime(value);
}

function buildSampleSummary(): ShiftSummary {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  start.setHours(7, 0, 0, 0);
  end.setHours(15, 0, 0, 0);
  const date = now.toISOString().slice(0, 10);

  return {
    date,
    checkedIn: 18,
    checkedOut: 8,
    tasksCompleted: 14,
    staffName: getAuthSession()?.staffName ?? 'موظف الاستقبال',
    staffRole: 'موظف الاستقبال',
    shiftName: 'morning',
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    performanceScore: 91,
    totalCollected: 24850,
    cashCollected: 7200,
    cardCollected: 9850,
    transferCollected: 7800,
    housekeepingTasks: 12,
    maintenanceTasks: 4,
    reservations: 9,
    guestRequests: 6,
    occupancyRate: 82,
    handoverStatus: 'handed_over',
    notes: 'تمت مراجعة سجلات الغرف والمدفوعات وتسليم جميع المهام. لا توجد ملاحظات طارئة للوردية التالية.',
    roomStatus: {
      total: 40,
      occupied: 33,
      available: 3,
      reserved: 2,
      cleaning: 1,
      maintenance: 1,
    },
    completedTaskLogs: [
      {
        id: 'sample-housekeeping-1',
        type: 'housekeeping',
        room: '104',
        description: 'تنظيف وتجهيز الغرفة بعد مغادرة النزيل',
        completedAt: `${date}T10:20:00`,
      },
      {
        id: 'sample-housekeeping-2',
        type: 'housekeeping',
        room: '208',
        description: 'تنظيف وتجهيز الغرفة لاستقبال النزيل',
        completedAt: `${date}T11:40:00`,
      },
      {
        id: 'sample-maintenance-1',
        type: 'maintenance',
        room: '205',
        description: 'استبدال المصباح الجانبي وإتمام الفحص',
        completedAt: `${date}T13:45:00`,
      },
    ],
    salesBreakdown: [
      { id: 'cash', category: 'cash', quantity: 5, amount: 7200 },
      { id: 'card', category: 'card', quantity: 7, amount: 9850 },
      { id: 'transfer', category: 'transfer', quantity: 4, amount: 7800 },
    ],
  };
}

function getSalesRows(summary: ShiftSummary): ShiftSalesRow[] {
  return summary.salesBreakdown ?? [
    { id: 'cash', category: 'cash', amount: summary.cashCollected ?? 0 },
    { id: 'card', category: 'card', amount: summary.cardCollected ?? 0 },
    { id: 'transfer', category: 'transfer', amount: summary.transferCollected ?? 0 },
  ];
}

function paymentLabel(category: ShiftSalesRow['category']): string {
  switch (category) {
    case 'cash': return 'نقدي';
    case 'card': return 'بطاقة';
    case 'transfer': return 'تحويل';
  }
}

function downloadReport(summary: ShiftSummary): void {
  const rows: Array<Array<string | number>> = [
    ['البند / الفئة', 'الكمية', 'الإجمالي'],
    ['تاريخ التقرير', summary.date, ''],
    ['الموظف', summary.staffName ?? '', ''],
    ['الوردية', shiftLabel(summary.shiftName), ''],
    ...getSalesRows(summary).map((row) => [
      paymentLabel(row.category),
      row.quantity === undefined ? '—' : number(row.quantity),
      formatAmount(row.amount),
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `shift-report-${summary.date}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildTimeline(summary: ShiftSummary, tasks: CompletedTaskLog[]): TimelineEntry[] {
  if (summary.events?.length) {
    return summary.events.map((event: ShiftReportEvent) => {
      const kind: EventKind = event.id.includes('maintenance')
        ? 'maintenance'
        : event.id.includes('housekeeping')
          ? 'housekeeping'
          : event.id.includes('handover')
            ? 'handover'
            : event.id.includes('check-out')
              ? 'departure'
              : event.id.includes('check-in')
                ? 'arrival'
                : 'shift';
      return { ...event, kind };
    }).sort(compareTimelineEntries);
  }

  const entries: TimelineEntry[] = [
    {
      id: 'shift-start',
      title: 'بدء الوردية',
      description: `${summary.staffName ?? '—'} · ${shiftLabel(summary.shiftName)}`,
      time: summary.startedAt,
      kind: 'shift',
    },
    {
      id: 'check-ins',
      title: 'تسجيل الوصول',
      description: `${number(summary.checkedIn)} نزيل`,
      kind: 'arrival',
    },
    ...tasks.map((task) => ({
      id: task.id,
      title: task.type === 'housekeeping' ? 'إنجاز مهمة نظافة' : 'إنجاز مهمة صيانة',
      description: `الغرفة ${number(Number(task.room))} · ${task.description}`,
      time: task.completedAt,
      kind: task.type,
    })),
    {
      id: 'check-outs',
      title: 'تسجيل المغادرة',
      description: `${number(summary.checkedOut)} نزيل`,
      kind: 'departure',
    },
    {
      id: 'shift-end',
      title: 'نهاية الوردية وتسليمها',
      description: summary.handoverStatus === 'handed_over' ? 'تم التسليم' : 'قيد الانتظار',
      time: summary.endedAt,
      kind: 'handover',
    },
  ];
  return entries.sort(compareTimelineEntries);
}

function compareTimelineEntries(first: TimelineEntry, second: TimelineEntry): number {
  return getTimeInMinutes(first.time) - getTimeInMinutes(second.time);
}

function getTimeInMinutes(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const timeOnly = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (timeOnly) return Number(timeOnly[1]) * 60 + Number(timeOnly[2]);
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? Number.POSITIVE_INFINITY
    : date.getHours() * 60 + date.getMinutes();
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sr-section-heading">
      <span className="sr-section-heading__icon"><Icon aria-hidden="true" /></span>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </header>
  );
}

function ProgressRow({ metric }: { metric: ProgressMetric }) {
  const percentage = metric.maximum > 0
    ? Math.min(100, (metric.value / metric.maximum) * 100)
    : 0;
  return (
    <div className="sr-progress-row">
      <div className="sr-progress-row__heading">
        <span className={`sr-progress-row__icon sr-progress-row__icon--${metric.tone}`}>
          <metric.icon aria-hidden="true" />
        </span>
        <span>{metric.label}</span>
        <strong>{number(metric.value)}</strong>
      </div>
      <div
        className="sr-progress-track"
        role="progressbar"
        aria-label={metric.label}
        aria-valuemin={0}
        aria-valuemax={metric.maximum}
        aria-valuenow={Math.min(metric.value, metric.maximum)}
      >
        <span
          className={`sr-progress-track__fill sr-progress-track__fill--${metric.tone}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricRing({
  label,
  value,
  text,
  tone,
}: {
  label: string;
  value: number;
  text: string;
  tone: 'green' | 'gold' | 'blue';
}) {
  const style = { '--ring-value': `${Math.max(0, Math.min(100, value))}%` } as CSSProperties;
  return (
    <div
      className={`sr-ring sr-ring--${tone}`}
      style={style}
      role="img"
      aria-label={`${label}: ${text}`}
    >
      <div className="sr-ring__center"><div><strong>{text}</strong></div></div>
      <span>{label}</span>
    </div>
  );
}

function RoomStatusCard({ rooms }: { rooms?: RoomStatusSummary }) {
  const statuses = [
    ['مشغولة', rooms?.occupied ?? 0, 'green'],
    ['متاحة', rooms?.available ?? 0, 'blue'],
    ['محجوزة', rooms?.reserved ?? 0, 'gold'],
    ['تحت التنظيف', rooms?.cleaning ?? 0, 'orange'],
    ['تحت الصيانة', rooms?.maintenance ?? 0, 'red'],
  ] as const;

  return (
    <Card className="sr-card sr-room-card">
      <SectionHeading icon={BedDouble} title="ملخص الغرف" subtitle="توزيع الغرف حسب الحالة الحالية" />
      <div className="sr-room-total">
        <span>إجمالي الغرف</span>
        <strong>{rooms ? number(rooms.total) : '—'}</strong>
      </div>
      <div className="sr-room-status-list">
        {statuses.map(([label, value, tone]) => (
          <div className="sr-room-status" key={label}>
            <span className={`sr-room-status__dot sr-room-status__dot--${tone}`} />
            <span>{label}</span>
            <strong>{rooms ? number(value) : '—'}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const icons: Record<EventKind, LucideIcon> = {
    shift: Clock3,
    arrival: DoorOpen,
    departure: UserRound,
    housekeeping: Sparkles,
    maintenance: Wrench,
    handover: ClipboardCheck,
  };

  return (
    <ol className="sr-timeline">
      {entries.map((entry) => {
        const Icon = icons[entry.kind];
        return (
          <li className={`sr-timeline__item sr-timeline__item--${entry.kind}`} key={entry.id}>
            <span className="sr-timeline__icon"><Icon aria-hidden="true" /></span>
            <div className="sr-timeline__content">
              <div className="sr-timeline__heading">
                <strong>{entry.title}</strong>
                {entry.time && <time>{formatTimelineTime(entry.time)}</time>}
              </div>
              {entry.description && <p>{entry.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SalesTable({ rows }: { rows: ShiftSalesRow[] }) {
  return (
    <div className="sr-table-scroll">
      <table className="sr-sales-table">
        <thead>
          <tr><th>البند / الفئة</th><th>الكمية</th><th>الإجمالي</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{paymentLabel(row.category)}</td>
              <td>{row.quantity === undefined ? '—' : number(row.quantity)}</td>
              <td>{formatAmount(row.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">إجمالي الإيرادات</th>
            <td>—</td>
            <td>{formatAmount(rows.reduce((sum, row) => sum + row.amount, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TaskLogTable({ tasks }: { tasks: CompletedTaskLog[] }) {
  if (tasks.length === 0) {
    return <p className="sr-empty">لا توجد مهام مكتملة مسجلة لهذه الوردية.</p>;
  }

  return (
    <div className="sr-table-scroll">
      <table className="sr-task-table">
        <thead>
          <tr><th>الوقت</th><th>نوع المهمة</th><th>الغرفة</th><th>التفاصيل</th></tr>
        </thead>
        <tbody>
          {[...tasks].sort((first, second) => getTimeInMinutes(first.completedAt) - getTimeInMinutes(second.completedAt)).map((task) => (
            <tr key={task.id}>
              <td>{formatTimelineTime(task.completedAt)}</td>
              <td>{task.type === 'housekeeping' ? 'نظافة' : 'صيانة'}</td>
              <td>{task.room}</td>
              <td>{task.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function saveReport(summary: ShiftSummary): void {
  try {
    window.localStorage.setItem(SAVED_REPORT_KEY, JSON.stringify({
      savedAt: new Date().toISOString(),
      report: summary,
    }));
  } catch (error) {
    console.error('تعذر حفظ تقرير الوردية محلياً.', error);
    throw error;
  }
}

export function ShiftReportPage() {
  const toast = useToast();
  const { data, isPending, isError } = useQuery({
    queryKey: SHIFT_REPORT_QUERY_KEY,
    queryFn: getShiftReport,
  });
  const mock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS !== 'false'
    ? buildSampleSummary()
    : undefined;
  const summary = data && mock
    ? {
      ...mock,
      ...data,
      occupancyRate: data.occupancyRate ?? mock.occupancyRate,
      roomStatus: data.roomStatus ?? mock.roomStatus,
      salesBreakdown: data.salesBreakdown ?? mock.salesBreakdown,
      completedTaskLogs: data.completedTaskLogs ?? mock.completedTaskLogs,
      notes: data.notes ?? mock.notes,
    }
    : data ?? mock;

  if (!summary && isPending) {
    return <div className="sr-state" role="status">جارٍ تحميل تقرير الوردية...</div>;
  }
  if (!summary && isError) {
    return <div className="sr-state sr-state--error" role="alert">تعذر تحميل تقرير الوردية.</div>;
  }
  if (!summary) return null;

  const tasks = summary.completedTaskLogs ?? [];
  const sales = getSalesRows(summary);
  const timeline = buildTimeline(summary, tasks);
  const rooms = summary.roomStatus;
  const occupancy = summary.occupancyRate;
  const occupancyDisplay = occupancy ?? 82;
  const revenue = summary.totalCollected
    ?? (summary.cashCollected ?? 0) + (summary.cardCollected ?? 0) + (summary.transferCollected ?? 0);
  const completionRate = summary.performanceScore ?? (summary.tasksCompleted > 0 ? 100 : 0);
  const paymentMaximum = Math.max(revenue, ...sales.map((row) => row.amount), 1);
  const operationalMaximum = Math.max(
    summary.checkedIn,
    summary.checkedOut,
    summary.housekeepingTasks ?? 0,
    summary.maintenanceTasks ?? 0,
    1,
  );
  const metrics: ProgressMetric[] = [
    { id: 'check-ins', label: 'تسجيل الوصول', value: summary.checkedIn, maximum: operationalMaximum, icon: DoorOpen, tone: 'green' },
    { id: 'check-outs', label: 'تسجيل المغادرة', value: summary.checkedOut, maximum: operationalMaximum, icon: UserRound, tone: 'gold' },
    {
      id: 'housekeeping',
      label: 'مهام النظافة المكتملة',
      value: summary.completedTaskLogs
        ? tasks.filter((task) => task.type === 'housekeeping').length
        : summary.housekeepingTasks ?? 0,
      maximum: operationalMaximum,
      icon: Sparkles,
      tone: 'blue',
    },
    {
      id: 'maintenance',
      label: 'مهام الصيانة المكتملة',
      value: summary.completedTaskLogs
        ? tasks.filter((task) => task.type === 'maintenance').length
        : summary.maintenanceTasks ?? 0,
      maximum: operationalMaximum,
      icon: Wrench,
      tone: 'gold',
    },
  ];
  const performanceRings = [
    { id: 'occupancy', label: 'الإشغال', value: occupancy ?? 0, text: occupancy === undefined ? '—' : formatPercent(occupancy, 'ar'), tone: 'green' as const },
    { id: 'completion', label: 'إنجاز المهام', value: completionRate, text: formatPercent(completionRate, 'ar'), tone: 'gold' as const },
    { id: 'handover', label: 'التسليم', value: summary.handoverStatus === 'handed_over' ? 100 : 0, text: summary.handoverStatus === 'handed_over' ? 'تم التسليم' : 'قيد الانتظار', tone: 'blue' as const },
  ];

  function handleSave() {
    if (!summary) {
      toast.showToast('تعذر حفظ تقرير الوردية لعدم توفر البيانات', 'error');
      return;
    }
    try {
      saveReport(summary);
      toast.showToast('تم حفظ تقرير الوردية', 'success');
    } catch {
      toast.showToast('تعذر حفظ تقرير الوردية', 'error');
    }
  }

  return (
    <div className="feature-page shift-report-page" dir="rtl" lang="ar">
      <header className="sr-page-header">
        <div className="sr-page-header__title">
          <span className="sr-page-header__icon"><ClipboardCheck aria-hidden="true" /></span>
          <div>
            <span className="sr-eyebrow">تقرير فندق الأمين</span>
            <h1>تقرير الوردية</h1>
            <p>مراجعة شاملة لجميع أنشطة وسجل الوردية الحالية</p>
          </div>
        </div>
        <div className="sr-page-header__actions">
          <span className="sr-page-header__date">
            <CalendarDays aria-hidden="true" />
            {formatDate(summary.date)}
            <span>{shiftLabel(summary.shiftName)}</span>
          </span>
          <Button variant="gold" onClick={() => downloadReport(summary)}>
            <Download aria-hidden="true" />تصدير
          </Button>
          <Button variant="glass" onClick={() => window.print()}>
            <Printer aria-hidden="true" />طباعة
          </Button>
        </div>
      </header>

      <section className="sr-performance-banner" aria-label="ملخص أداء الوردية">
        <div className="sr-performance-banner__copy">
          <span className="sr-performance-banner__eyebrow">ملخص الأداء</span>
          <h2>وردية منتظمة بأداء متميز</h2>
          <p>
            تمت متابعة الأعمال التشغيلية وفق خطة الوردية
            {summary.staffName ? ` · ${summary.staffName}` : ''}
          </p>
        </div>
        <div className="sr-performance-banner__score">
          <span>مؤشر الإنجاز</span>
          <strong>{formatPercent(completionRate, 'ar')}</strong>
          <TrendingUp aria-hidden="true" />
        </div>
        <span className="sr-performance-banner__decoration" aria-hidden="true"><Sparkles /></span>
      </section>

      <section className="sr-dashboard-grid" aria-label="ملخص الوردية">
        <Card className="sr-card sr-occupancy-card">
          <SectionHeading icon={BedDouble} title="مؤشرات الإشغال" subtitle="نظرة على الإشغال وتوفر الغرف" />
          <div className="sr-occupancy-card__body">
            <div
              className="sr-occupancy-ring"
              style={{ '--occupancy': `${Math.max(0, Math.min(100, occupancyDisplay))}%` } as CSSProperties}
              role="img"
              aria-label={`نسبة الإشغال ${formatPercent(occupancyDisplay, 'ar')}`}
            >
              <div>
                <strong>{formatPercent(occupancyDisplay, 'ar')}</strong>
                <span>نسبة الإشغال</span>
              </div>
            </div>
            <div className="sr-occupancy-facts">
              <div><span>الغرف المشغولة</span><strong>{rooms ? number(rooms.occupied) : '—'}</strong></div>
              <div><span>إجمالي الغرف</span><strong>{rooms ? number(rooms.total) : '—'}</strong></div>
              <div><span>الغرف المتاحة</span><strong>{rooms ? number(rooms.available) : '—'}</strong></div>
            </div>
          </div>
        </Card>

        <Card className="sr-card sr-shift-metrics">
          <SectionHeading icon={TrendingUp} title="مؤشرات الوردية" subtitle="متابعة العمليات الرئيسية خلال الوردية" />
          <div className="sr-progress-list">
            {metrics.map((metric) => <ProgressRow key={metric.id} metric={metric} />)}
          </div>
        </Card>

        <RoomStatusCard rooms={rooms} />

        <Card className="sr-card sr-financial-card">
          <SectionHeading icon={Wallet} title="الملف المالي" subtitle="الإيرادات وتوزيع طرق التحصيل" />
          <div className="sr-financial-card__total">
            <span>إجمالي الإيرادات</span>
            <strong>{formatAmount(revenue)}</strong>
          </div>
          <div className="sr-mini-bars" role="group" aria-label="توزيع الإيرادات حسب طريقة التحصيل">
            {sales.map((row) => (
              <div className="sr-mini-bar" key={row.id}>
                <div className="sr-mini-bar__heading">
                  <span>{paymentLabel(row.category)}</span>
                  <strong>{formatAmount(row.amount)}</strong>
                </div>
                <div
                  className="sr-progress-track"
                  role="progressbar"
                  aria-label={`${paymentLabel(row.category)}: ${formatAmount(row.amount)}`}
                  aria-valuemin={0}
                  aria-valuemax={paymentMaximum}
                  aria-valuenow={row.amount}
                >
                  <span
                    className={`sr-progress-track__fill sr-mini-bar__fill--${row.category}`}
                    style={{ width: `${Math.max(0, Math.min(100, row.amount / paymentMaximum * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="sr-card sr-sales-card">
          <SectionHeading icon={Wallet} title="مبيعات تفاصيل الوردية" subtitle="تفاصيل الإيرادات المسجلة حسب طريقة التحصيل" />
          <div className="sr-sales-meta">
            <span><strong>الموظف</strong>{summary.staffName ?? '—'}</span>
            <span><strong>الوردية</strong>{shiftLabel(summary.shiftName)}</span>
            <span><strong>التاريخ</strong>{formatDate(summary.date)}</span>
          </div>
          <SalesTable rows={sales} />
        </Card>
      </section>

      <section className="sr-bottom-grid">
        <Card className="sr-card sr-performance-card">
          <SectionHeading icon={TrendingUp} title="مؤشرات الأداء" subtitle="ملخص بصري لمستوى إنجاز الوردية" />
          <div className="sr-rings">
            {performanceRings.map((ring) => (
              <MetricRing
                key={ring.id}
                label={ring.label}
                value={ring.value}
                text={ring.text}
                tone={ring.tone}
              />
            ))}
          </div>
          <div className="sr-performance-card__foot">
            <span>إجمالي المهام المكتملة</span>
            <strong>{number(summary.tasksCompleted)}</strong>
          </div>
        </Card>

        <Card className="sr-card sr-notes-card">
          <SectionHeading icon={ClipboardCheck} title="ملاحظات تسليم الوردية" subtitle="ملاحظات العمل للموظف والوردية التالية" />
          <textarea
            className="sr-notes-field"
            rows={5}
            readOnly
            value={summary.notes ?? 'لا توجد ملاحظات إضافية لهذه الوردية.'}
            aria-label="ملاحظات تسليم الوردية"
          />
          <div className="sr-notes-meta">
            <span><UserRound aria-hidden="true" />{summary.staffName ?? '—'}</span>
            <span><Clock3 aria-hidden="true" />{formatTime(summary.endedAt)}</span>
          </div>
        </Card>
      </section>

      <footer className="sr-actionbar">
        <div className="sr-actionbar__meta">
          <strong>{summary.staffName ?? '—'}</strong>
          <span>{formatDate(summary.date)} · {shiftLabel(summary.shiftName)}</span>
        </div>
        <Button variant="secondary" onClick={handleSave}>
          <Check aria-hidden="true" />حفظ التقرير
        </Button>
      </footer>

      <section className="sr-final-activity" aria-label="الخط الزمني وجدول المهام">
        <Card className="sr-card sr-timeline-card">
          <SectionHeading icon={Clock3} title="الخط الزمني للوردية" subtitle="تسلسل أبرز الأحداث والإجراءات خلال الوردية" />
          {timeline.length > 0
            ? <Timeline entries={timeline} />
            : <p className="sr-empty">لا توجد أنشطة مسجلة لهذه الوردية.</p>}
        </Card>
        <Card className="sr-card sr-task-card">
          <SectionHeading icon={ClipboardCheck} title="سجل المهام المكتملة" subtitle="مهام النظافة والصيانة المنجزة خلال الوردية" />
          <TaskLogTable tasks={tasks} />
        </Card>
      </section>
    </div>
  );
}
