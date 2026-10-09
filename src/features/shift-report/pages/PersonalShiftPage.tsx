import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { LoadingState } from '../../../components/common/LoadingState';
import { useToast } from '../../../components/common/toast.context';
import { Badge } from '../../../components/ui/Badge';
import {
  AlAminLogo,
  CalendarIcon,
  CardIcon,
  ChartIcon,
  ClockIcon,
  DownloadIcon,
  HashIcon,
  NoteIcon,
  PdfIcon,
  PrintIcon,
  ShareIcon,
  SignatureIcon,
  UserIcon,
  WalletIcon,
} from '../../../components/ui/Icons';
import { ROUTES } from '../../../core/constants/routes';
import { formatDateTime, formatDate, formatTime } from '../../../core/utils/date';
import { formatCompact, formatMoney, formatPercent, toArabicDigits } from '../../../core/utils/numerals';
import { ShiftTimeline } from '../components/ShiftTimeline';
import { endShift, getPersonalShift, startShift } from '../services/shift-report.api';
import type { PersonalShift, ShiftEvent } from '../types/shift-report.types';

const QUERY_KEY = ['shift-report', 'personal'] as const;
const SHIFT_LENGTH_MS = 8 * 60 * 60 * 1000;

const seedStartedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const seedShift: PersonalShift = {
  shiftId: 'shift-2026-10-09',
  staffName: 'موظف الاستقبال',
  staffRole: 'Receptionist',
  status: 'Active',
  startedAt: seedStartedAt,
  tasksCompleted: 4,
  paymentsHandled: 6,
  totalCollected: 1450,
  events: [
    { id: 'e-1', title: 'بدء المناوبة', description: 'تسجيل الحضور', time: formatTime(seedStartedAt) },
    { id: 'e-2', title: 'مهمة تنظيف مكتملة', description: 'الغرفة 204', time: formatTime(Date.now() - 60 * 60 * 1000) },
    { id: 'e-3', title: 'تسجيل دفعة', description: 'فاتورة INV-1006', time: formatTime(Date.now() - 30 * 60 * 1000) },
  ],
};

function nextEventId(): string {
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function applyStart(shift: PersonalShift): PersonalShift {
  const startedAt = new Date().toISOString();
  return {
    ...shift,
    status: 'Active',
    startedAt,
    endedAt: undefined,
    events: [
      ...shift.events,
      { id: nextEventId(), title: 'بدء المناوبة', description: 'تسجيل الحضور', time: formatTime(startedAt) },
    ],
  };
}

function applyEnd(shift: PersonalShift): PersonalShift {
  const endedAt = new Date().toISOString();
  return {
    ...shift,
    status: 'Ended',
    endedAt,
    events: [
      ...shift.events,
      { id: nextEventId(), title: 'إنهاء المناوبة', description: 'تسجيل الانصراف', time: formatTime(endedAt) },
    ],
  };
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function computeElapsed(shift: PersonalShift): { ms: number; label: string } {
  const start = parseDate(shift.startedAt);
  if (!start) return { ms: 0, label: '—' };

  const end = (shift.status === 'Ended' && parseDate(shift.endedAt)) || new Date();
  const ms = Math.max(0, end.getTime() - start.getTime());
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return { ms, label: `${toArabicDigits(hours)}س ${toArabicDigits(minutes)}د` };
}

interface EventSlice {
  key: 'finance' | 'service' | 'admin';
  label: string;
  value: number;
  color: string;
}

function categorizeEvents(events: ShiftEvent[]): EventSlice[] {
  let finance = 0;
  let service = 0;
  let admin = 0;

  events.forEach((event) => {
    if (event.title.includes('دفعة') || event.title.includes('دفع')) finance += 1;
    else if (event.title.includes('تنظيف') || event.title.includes('مهمة') || event.title.includes('صيانة')) service += 1;
    else admin += 1;
  });

  return [
    { key: 'finance', label: 'عمليات مالية', value: finance, color: '#2fa84f' },
    { key: 'service', label: 'مهام وخدمات', value: service, color: '#c6a15b' },
    { key: 'admin', label: 'إجراءات إدارية', value: admin, color: '#c0455a' },
  ];
}

export function PersonalShiftPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localShift, setLocalShift] = useState<PersonalShift | undefined>(undefined);

  const { data, isPending, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getPersonalShift,
  });

  const shift = localShift ?? data ?? seedShift;
  const elapsed = computeElapsed(shift);
  const eventSlices = categorizeEvents(shift.events);
  const progressPercent = Math.min(100, (elapsed.ms / SHIFT_LENGTH_MS) * 100);
  const donutStyle = {
    background: `conic-gradient(#2fa84f 0 ${progressPercent}%, #e5eaee ${progressPercent}% 100%)`,
  };

  const startMutation = useMutation({
    mutationFn: startShift,
    onSuccess: (next) => {
      setLocalShift(undefined);
      queryClient.setQueryData(QUERY_KEY, next);
      toast.showToast('تم بدء المناوبة بنجاح', 'success');
    },
    onError: () => {
      setLocalShift(applyStart(shift));
      toast.showToast('تعذر الاتصال بالخازن — تم التحديث محلياً', 'info');
    },
  });

  const endMutation = useMutation({
    mutationFn: endShift,
    onSuccess: (next) => {
      setLocalShift(undefined);
      queryClient.setQueryData(QUERY_KEY, next);
      setConfirmOpen(false);
      toast.showToast('تم إنهاء المناوبة بنجاح', 'success');
    },
    onError: () => {
      setLocalShift(applyEnd(shift));
      setConfirmOpen(false);
      toast.showToast('تعذر الاتصال بالخازن — تم التحديث محلياً', 'info');
    },
  });

  const statusTone = shift.status === 'Ended' ? 'neutral' : 'success';
  const shiftDate = formatDate(shift.startedAt ?? Date.now());

  if (!import.meta.env.DEV && isPending && !data) {
    return <LoadingState label="جارٍ تحميل تقرير المناوبة..." />;
  }

  if (!import.meta.env.DEV && isError && !data) {
    return <LoadingState label="تعذّر تحميل تقرير المناوبة" />;
  }

  return (
    <div className="al-page-shell" dir="rtl">
      <header className="al-page-header">
        <div className="al-page-header__brand">
          <AlAminLogo className="al-brand-mark" />
          <div>
            <p className="al-eyebrow">تقرير المناوبة</p>
            <h1>المناوبة الشخصية</h1>
          </div>
        </div>

        <div className="al-page-header__actions">
          <Link to={ROUTES.shiftReport} className="ui-button ui-button--secondary">
            التقرير اليومي
          </Link>
          <button
            type="button"
            className="ui-button ui-button--primary"
            onClick={() => (shift.status === 'Active' ? setConfirmOpen(true) : startMutation.mutate())}
          >
            {shift.status === 'Active' ? 'إنهاء المناوبة' : 'بدء المناوبة'}
          </button>
        </div>
      </header>

      <main className="al-page-body">
        <section className="al-card al-shift-overview">
          <div className="al-shift-overview__header">
            <div>
              <p className="al-kicker">موظف الاستقبال</p>
              <h2>{shift.staffName}</h2>
            </div>
            <Badge tone={statusTone}>{shift.status === 'Active' ? 'نشطة' : 'منتهية'}</Badge>
          </div>

          <div className="al-shift-overview__content">
            <div className="al-shift-ring" style={donutStyle}>
              <div className="al-shift-ring__inner">
                <strong>{Math.round(progressPercent)}%</strong>
                <span>{elapsed.label}</span>
              </div>
            </div>

            <div className="al-stat-grid">
              <article className="al-stat-card">
                <span className="al-stat-card__label">الوقت المنقضي</span>
                <strong>{elapsed.label}</strong>
                <small>{formatDateTime(shift.startedAt ?? new Date())}</small>
              </article>
              <article className="al-stat-card">
                <span className="al-stat-card__label">المجموع المحصل</span>
                <strong>{formatMoney(shift.totalCollected)}</strong>
                <small>{toArabicDigits(shift.paymentsHandled)} دفعة</small>
              </article>
              <article className="al-stat-card">
                <span className="al-stat-card__label">المهام المكتملة</span>
                <strong>{toArabicDigits(shift.tasksCompleted)}</strong>
                <small>{toArabicDigits(shift.events.length)} أحداث</small>
              </article>
            </div>
          </div>
        </section>

        <section className="al-card al-shift-charts">
          <div className="al-section-heading">
            <div>
              <p className="al-kicker">النشاط خلال المناوبة</p>
              <h3>توزيع الأنشطة</h3>
            </div>
            <span className="al-section-badge">{formatDate(shift.startedAt ?? new Date())}</span>
          </div>

          <div className="al-donut-layout">
            <div className="al-donut-report">
              {eventSlices.map((slice) => (
                <div key={slice.key} className="al-donut-report__row">
                  <span className="al-donut-report__swatch" style={{ background: slice.color }} />
                  <span>{slice.label}</span>
                  <strong>{toArabicDigits(slice.value)}</strong>
                </div>
              ))}
            </div>

            <div className="al-metrics-panel">
              <div className="al-metric">
                <WalletIcon />
                <div>
                  <span>إجمالي التحصيل</span>
                  <strong>{formatMoney(shift.totalCollected)}</strong>
                </div>
              </div>
              <div className="al-metric">
                <CardIcon />
                <div>
                  <span>نسبة الدفع</span>
                  <strong>{formatPercent(shift.paymentsHandled ? shift.paymentsHandled / Math.max(1, shift.paymentsHandled + 2) : 0)}</strong>
                </div>
              </div>
              <div className="al-metric">
                <ChartIcon />
                <div>
                  <span>الكفاءة</span>
                  <strong>{formatCompact(shift.tasksCompleted * 12)}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="al-card al-shift-activity">
          <div className="al-section-heading">
            <div>
              <p className="al-kicker">سجل المناوبة</p>
              <h3>ملاحظات التشغيل</h3>
            </div>
            <span className="al-section-badge">{toArabicDigits(shift.events.length)} نقطة</span>
          </div>

          <div className="al-utility-row">
            <div className="al-utility-item"><CalendarIcon /><span>{shiftDate}</span></div>
            <div className="al-utility-item"><ClockIcon /><span>{elapsed.label}</span></div>
            <div className="al-utility-item"><HashIcon /><span>{toArabicDigits(shift.shiftId)}</span></div>
          </div>

          <div className="al-activity-grid">
            <div className="al-activity-card">
              <div className="al-activity-card__title">
                <UserIcon />
                <span>تفاصيل الموظف</span>
              </div>
              <dl>
                <div>
                  <dt>الاسم</dt>
                  <dd>{shift.staffName}</dd>
                </div>
                <div>
                  <dt>الدور</dt>
                  <dd>{shift.staffRole}</dd>
                </div>
                <div>
                  <dt>تاريخ البداية</dt>
                  <dd>{formatDateTime(shift.startedAt ?? new Date())}</dd>
                </div>
              </dl>
            </div>

            <div className="al-activity-card">
              <div className="al-activity-card__title">
                <SignatureIcon />
                <span>ملاحظات</span>
              </div>
              <p>{shift.notes ?? 'لا توجد ملاحظات إضافية خلال هذه المناوبة.'}</p>
            </div>
          </div>

          <div className="al-timeline-wrap">
            <ShiftTimeline events={shift.events} />
          </div>
        </section>
      </main>

      <div className="al-page-actions">
        <button type="button" className="ui-button ui-button--secondary"><PrintIcon /> طباعة</button>
        <button type="button" className="ui-button ui-button--secondary"><DownloadIcon /> تنزيل</button>
        <button type="button" className="ui-button ui-button--secondary"><ShareIcon /> مشاركة</button>
        <button type="button" className="ui-button ui-button--secondary"><PdfIcon /> PDF</button>
        <button type="button" className="ui-button ui-button--secondary"><NoteIcon /> ملاحظة</button>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="إنهاء المناوبة؟"
          description="سيتم تسجيل الخروج من الدوام الحالي وتحديث السجل لرسوم اليوم."
          confirmLabel="تأكيد الإنهاء"
          cancelLabel="إلغاء"
          variant="danger"
          onConfirm={() => endMutation.mutate()}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
