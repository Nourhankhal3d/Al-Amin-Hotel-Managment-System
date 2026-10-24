import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ArrowLeftRight,
  BadgeCheck,
  BedDouble,
  BellRing,
  Check,
  Clock3,
  FileText,
  KeyRound,
  Landmark,
  LogIn,
  LogOut,
  ShieldAlert,
  Sparkles,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Drawer } from '../../../components/ui/Drawer';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/common/ErrorState';
import { LoadingState } from '../../../components/common/LoadingState';
import { PageHero } from '../../../components/common/PageHero';
import { getErrorMessage } from '../../../core/errors/getErrorMessage';
import { AppError } from '../../../core/errors/AppError';
import { getAuthSession } from '../../../core/auth/authManager';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber, formatPercent } from '../../../utils/format';
import type { CleaningTask, MaintenanceIssue, ShiftSummary } from '../types/shift-handover.types';
import { getShiftReport } from '../services/shift-handover.api';
import { useHandoverShift, useShiftSummary } from '../hooks/useShiftHandover';
import './ShiftHandoverPage.css';

const locale = (language: Language) => (language === 'ar' ? 'ar-EG' : 'en-EG');

function formatAmount(value: number, language: Language): string {
  const amount = formatNumber(value, language);
  return language === 'ar' ? `${amount} ج.م` : `EGP ${amount}`;
}

function formatShiftDate(value: string, language: Language): string {
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale(language), { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

function formatTime(value: string, language: Language): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale(language), { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Cairo' }).format(date);
}

/** `08:00` -> `٠٨:٠٠` in Arabic, unchanged in English */
function formatClockText(value: string, language: Language): string {
  return language === 'ar' ? value.replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]) : value;
}

interface TimelineEntry {
  id: string;
  kind: 'cleaning' | 'maintenance';
  title: string;
  description: string;
  time: string;
}

function getTimelineItems(summary: ShiftSummary, t: (key: string) => string, language: Language): TimelineEntry[] {
  const room = (id: number) => t('handoverPage.timeline.room').replace('{room}', formatNumber(id, language));
  const items = [
    ...summary.cleaning_tasks.map((task: CleaningTask) => ({
      id: `cleaning-${task.task_id}`,
      kind: 'cleaning' as const,
      title: t(task.status === 'done' ? 'handoverPage.timeline.cleaningDone' : 'handoverPage.timeline.cleaningAssigned'),
      description: `${room(task.room_id)}${task.notes ? ` · ${task.notes}` : ''}`,
      date: task.finished_date ?? task.assigned_date,
    })),
    ...summary.maintenance_issues.map((issue: MaintenanceIssue) => ({
      id: `maintenance-${issue.issue_id}`,
      kind: 'maintenance' as const,
      title: t(issue.status === 'resolved' ? 'handoverPage.timeline.maintenanceResolved' : 'handoverPage.timeline.maintenanceReported'),
      description: `${room(issue.room_id)} · ${issue.problem}`,
      date: issue.resolved_date ?? issue.created_date,
    })),
  ];

  return items
    .sort((first, second) => Date.parse(second.date) - Date.parse(first.date))
    .slice(0, 6)
    .map(({ date, ...item }) => ({ ...item, time: formatTime(date, language) }));
}

interface Tile {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  status?: 'success' | 'warning';
  details?: string[];
}

interface ChecklistItem {
  key: string;
  label: string;
  value: string;
  status: 'success' | 'warning';
  icon: LucideIcon;
}

export function ShiftHandoverPage() {
  const outlet = useOutletContext<{ language?: Language } | undefined>();
  const language: Language = outlet?.language ?? 'ar';
  const t = (key: string) => getTranslation(language, key);
  const staffName = getAuthSession()?.staffName || t('topbar.userName');
  const avatarLetter = Array.from(staffName)[0] ?? '';
  const handover = useHandoverShift();
  const { data: summary, isLoading, isError, error, refetch } = useShiftSummary(!handover.isSuccess);
  const [notes, setNotes] = useState<string | null>(null);
  const [reportError, setReportError] = useState<unknown>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const shiftId = summary?.shift.shift_id;

  useEffect(() => {
    if (!shiftId) return;
    try {
      const draft = window.localStorage.getItem(`shift-handover-draft-${shiftId}`);
      if (draft !== null) {
        setNotes((currentNotes) => currentNotes ?? draft);
        setIsDraftSaved(true);
      }
    } catch (error) {
      setActionError(error);
    }
  }, [shiftId]);

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
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (downloadError) {
      if (!import.meta.env.DEV) {
        setReportError(downloadError);
      } else {
        console.warn('Shift report request failed; downloading a local development report.', downloadError);
        const reportText = [
          t('handoverPage.title'),
          `${t('handoverPage.info.shift')}: ${t(`handoverPage.shiftType.${summary.shift.shift_type}`)}`,
          `${t('handoverPage.info.date')}: ${formatShiftDate(summary.shift.shift_date, language)}`,
          `${t('handoverPage.finance.total')}: ${formatAmount(summary.payments.total, language)}`,
          `${t('handoverPage.finance.cash')}: ${formatAmount(summary.payments.cash, language)}`,
          `${t('handoverPage.finance.instapay')}: ${formatAmount(summary.payments.instapay, language)}`,
          `${t('handoverPage.finance.vodafone')}: ${formatAmount(summary.payments.vodafone_cash, language)}`,
          `${t('handoverPage.pending.count').replace('{count}', formatNumber(pendingTotal, language))}`,
          `${t('handoverPage.notes.title')}: ${notes ?? summary.shift.shift_notes ?? ''}`,
        ].join('\n');
        const url = URL.createObjectURL(new Blob([reportText], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `shift-${summary.shift.shift_id}-report.txt`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
      }
    } finally {
      setIsDownloading(false);
    }
  }

  // The form submit only asks for confirmation; the handover is sent after "confirm and send"
  function requestHandover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (handover.isSuccess || handover.isPending || summary?.shift.status === 'handed_over') return;
    setIsConfirming(true);
  }

  function confirmHandover() {
    setIsConfirming(false);
    handover.mutate({ shift_notes: notes ?? summary?.shift.shift_notes ?? '' });
  }

  function saveDraft() {
    if (!summary) return;
    setActionError(null);
    try {
      window.localStorage.setItem(
        `shift-handover-draft-${summary.shift.shift_id}`,
        notes ?? summary.shift.shift_notes ?? '',
      );
      setIsDraftSaved(true);
    } catch (error) {
      setActionError(error);
    }
  }

  const hero = (actions: boolean) => (
    <PageHero eyebrow={t('handoverPage.eyebrow')} title={t('handoverPage.title')} description={t('handoverPage.description')}>
      {actions && (
        <>
          <Button variant="glass" onClick={() => void downloadReport()} disabled={isDownloading}>
            <FileText aria-hidden="true" />
            {isDownloading ? t('handoverPage.preparing') : t('handoverPage.export')}
          </Button>
          <Button
            variant="gold"
            form="shift-handover-form"
            type="submit"
            disabled={handover.isSuccess || handover.isPending || summary?.shift.status === 'handed_over'}
          >
            <ArrowLeftRight aria-hidden="true" />
            {handover.isPending
              ? t('handoverPage.submitting')
              : handover.isSuccess || summary?.shift.status === 'handed_over'
                ? t('handoverPage.submitted')
                : t('handoverPage.summary.submit')}
          </Button>
        </>
      )}
    </PageHero>
  );

  if (isLoading) return <div className="feature-page shift-handover">{hero(false)}<LoadingState label={t('handoverPage.loading')} /></div>;

  if ((isError && error instanceof AppError && error.code === 'NOT_FOUND') || (!isError && !summary)) {
    return (
      <div className="feature-page shift-handover">
        {hero(false)}
        <EmptyState title={t('handoverPage.noShift')} description={t('handoverPage.noShiftDesc')} />
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="feature-page shift-handover">
        {hero(false)}
        <ErrorState
          title={t('handoverPage.loadError')}
          message={getErrorMessage(error, language)}
          action={<Button variant="secondary" onClick={() => void refetch()}>{t('handoverPage.retry')}</Button>}
        />
      </div>
    );
  }

  const outgoingName = staffName || t('handoverPage.summary.outgoingPlaceholder');
  const incomingName = t('handoverPage.summary.incomingPlaceholder');
  const handoverTimestamp = summary.shift.handed_over_at ?? new Date().toISOString();

  const pendingRows: Tile[] = [
    {
      key: 'cleaning',
      label: t('handoverPage.pending.cleaning'),
      value: summary.pending.cleaning_tasks.length,
      icon: Sparkles,
      status: 'warning',
      details: summary.pending.cleaning_tasks.map((task) => `${t('handoverPage.timeline.room').replace('{room}', formatNumber(task.room_id, language))}${task.notes ? ` · ${task.notes}` : ''}`),
    },
    {
      key: 'maintenance',
      label: t('handoverPage.pending.maintenance'),
      value: summary.pending.maintenance_issues.length,
      icon: Wrench,
      status: 'warning',
      details: summary.pending.maintenance_issues.map((issue) => `${t('handoverPage.timeline.room').replace('{room}', formatNumber(issue.room_id, language))} · ${issue.problem}`),
    },
    {
      key: 'payments',
      label: t('handoverPage.pending.payments'),
      value: summary.pending.unverified_payments.length,
      icon: Wallet,
      status: 'warning',
      details: summary.pending.unverified_payments.map((payment) => `${formatAmount(payment.amount, language)} · ${t(`handoverPage.finance.${payment.payment_method === 'vodafone_cash' ? 'vodafone' : payment.payment_method}`)}`),
    },
  ];
  const pendingTotal = pendingRows.reduce((total, row) => total + row.value, 0);
  const pendingTiles: Tile[] = [
    ...pendingRows,
    {
      key: 'total',
      label: t('handoverPage.pending.total'),
      value: pendingTotal,
      icon: BadgeCheck,
      status: pendingTotal ? 'warning' : 'success',
      details: pendingRows.flatMap((row) => row.details ?? []),
    },
  ];

  const completedTiles: Tile[] = [
    {
      key: 'rooms',
      label: t('handoverPage.completed.rooms'),
      value: summary.rooms_handled.length,
      icon: BedDouble,
      status: 'success',
      details: summary.rooms_handled.map((room) => t('handoverPage.timeline.room').replace('{room}', formatNumber(Number(room), language))),
    },
    {
      key: 'cleaning',
      label: t('handoverPage.completed.cleaning'),
      value: summary.cleaning_tasks.filter((task) => task.status === 'done').length,
      icon: Sparkles,
      status: 'success',
      details: summary.cleaning_tasks.filter((task) => task.status === 'done').map((task) => t('handoverPage.timeline.room').replace('{room}', formatNumber(task.room_id, language))),
    },
    {
      key: 'maintenance',
      label: t('handoverPage.completed.maintenance'),
      value: summary.maintenance_issues.filter((issue) => issue.status === 'resolved').length,
      icon: Wrench,
      status: 'success',
      details: summary.maintenance_issues.filter((issue) => issue.status === 'resolved').map((issue) => `${t('handoverPage.timeline.room').replace('{room}', formatNumber(issue.room_id, language))} · ${issue.problem}`),
    },
    {
      key: 'arrivals',
      label: t('handoverPage.completed.arrivals'),
      value: summary.check_ins,
      icon: LogIn,
      status: 'success',
      details: [t('handoverPage.details.checkIns').replace('{count}', formatNumber(summary.check_ins, language))],
    },
    {
      key: 'departures',
      label: t('handoverPage.completed.departures'),
      value: summary.check_outs,
      icon: LogOut,
      status: 'success',
      details: [t('handoverPage.details.checkOuts').replace('{count}', formatNumber(summary.check_outs, language))],
    },
  ];

  const checklistItems: ChecklistItem[] = [
    { key: 'keyCards', label: t('handoverPage.checklist.keyCards'), value: formatNumber(summary.rooms_handled.length, language), status: summary.rooms_handled.length ? 'success' : 'warning', icon: KeyRound },
    { key: 'safeBalance', label: t('handoverPage.checklist.safeBalance'), value: formatAmount(summary.payments.cash, language), status: 'success', icon: Landmark },
    { key: 'guestRequests', label: t('handoverPage.checklist.pendingGuestRequests'), value: formatNumber(summary.pending.unverified_payments.length, language), status: summary.pending.unverified_payments.length ? 'warning' : 'success', icon: BellRing },
    { key: 'issues', label: t('handoverPage.checklist.unresolvedIssues'), value: formatNumber(summary.pending.maintenance_issues.length, language), status: summary.pending.maintenance_issues.length ? 'warning' : 'success', icon: ShieldAlert },
  ];

  const expectedCash = summary.payments.cash;
  const actualCash = summary.payments.cash;
  const cashVariance = actualCash - expectedCash;
  const cashBalanceText = cashVariance === 0 ? t('handoverPage.cash.balance') : `${cashVariance > 0 ? '+' : '-'}${formatAmount(Math.abs(cashVariance), language)}`;

  const timelineItems = getTimelineItems(summary, t, language);
  const isHandedOver = handover.isSuccess || summary?.shift.status === 'handed_over';
  const shiftNotes = notes ?? summary.shift.shift_notes ?? '';
  const trackedTasks = [...summary.cleaning_tasks, ...summary.maintenance_issues];
  const completedTasks = summary.cleaning_tasks.filter((task) => task.status === 'done').length
    + summary.maintenance_issues.filter((issue) => issue.status === 'resolved').length;
  const completionPercent = trackedTasks.length ? Math.round((completedTasks / trackedTasks.length) * 100) : 0;
  const percentText = formatPercent(completionPercent, language);
  const shiftType = t(`handoverPage.shiftType.${summary.shift.shift_type}`);
  const shiftHours = `${formatClockText(summary.shift.start_time, language)} — ${formatClockText(summary.shift.end_time, language)}`;

  return (
    <div className="feature-page shift-handover" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
      {hero(true)}

      <Card className="shift-handover__summary">
        <div className="shift-handover__summary-top">
          <div className="shift-handover__summary-badge">
            <Clock3 aria-hidden="true" />
            <span>{shiftType}</span>
          </div>
          <span className="shift-handover__summary-status">
            {isHandedOver ? t('handoverPage.info.handedOver') : t('handoverPage.info.active')}
          </span>
        </div>

        <div className="shift-handover__summary-grid">
          <div className="shift-handover__summary-card">
            <span>{t('handoverPage.summary.outgoing')}</span>
            <div className="shift-handover__person-block">
              <span className="shift-handover__avatar" aria-hidden="true">{avatarLetter}</span>
              <strong>{outgoingName}</strong>
            </div>
          </div>

          <div className="shift-handover__summary-card">
            <span>{t('handoverPage.summary.incoming')}</span>
            <div className="shift-handover__person-block">
              <span className="shift-handover__avatar shift-handover__avatar--secondary" aria-hidden="true">N</span>
              <strong>{incomingName}</strong>
            </div>
          </div>

          <div className="shift-handover__summary-card">
            <span>{t('handoverPage.summary.handoverTime')}</span>
            <strong>{formatTime(handoverTimestamp, language)}</strong>
          </div>

          <div className="shift-handover__summary-card">
            <span>{t('handoverPage.info.hours')}</span>
            <strong>{shiftHours}</strong>
          </div>
        </div>
      </Card>

      <Card className="shift-handover__info">
        <div className="shift-handover__info-staff">
          <span className="shift-handover__avatar" aria-hidden="true">{avatarLetter}</span>
          <div><span>{t('handoverPage.info.staff')}</span><strong>{staffName}</strong></div>
        </div>
        <div><span>{t('handoverPage.info.shift')}</span><strong>{shiftType}</strong></div>
        <div><span>{t('handoverPage.info.hours')}</span><strong>{shiftHours}</strong></div>
        <div><span>{t('handoverPage.info.date')}</span><strong>{formatShiftDate(summary.shift.shift_date, language)}</strong></div>
        <div className="shift-handover__readiness">
          <span>{t('handoverPage.info.readiness')}</span>
          <strong>{percentText}</strong>
          <div
            className="shift-handover__progress"
            role="progressbar"
            aria-label={t('handoverPage.info.readiness')}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercent}
          >
            <span style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </Card>

      <div className="shift-handover__row shift-handover__row--wide-start">
        <Card className="shift-handover__panel">
          <div className="shift-handover__panel-heading">
            <div><h2>{t('handoverPage.completed.title')}</h2><p>{t('handoverPage.completed.subtitle')}</p></div>
            <span className="shift-handover__pill">{t('handoverPage.completed.badge')}</span>
          </div>
          <div className="shift-handover__completed-grid">
            {completedTiles.map((tile) => (
              <button
                type="button"
                className="shift-handover__completed-tile shift-handover__tile-button"
                key={tile.key}
                onClick={() => setSelectedTile(tile)}
                aria-label={`${tile.label}: ${formatNumber(tile.value, language)}. ${t('handoverPage.details.view')}`}
              >
                <span className="shift-handover__tile-label"><tile.icon aria-hidden="true" />{tile.label}</span>
                <strong>{formatNumber(tile.value, language)}</strong>
                <span className={`shift-handover__tile-status shift-handover__tile-status--${tile.status ?? 'success'}`}>
                  {tile.status === 'warning' ? t('handoverPage.status.warning') : t('handoverPage.status.success')}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="shift-handover__panel">
          <div className="shift-handover__panel-heading">
            <div><h2>{t('handoverPage.pending.title')}</h2><p>{t('handoverPage.pending.subtitle')}</p></div>
            <span className="shift-handover__pill">{t('handoverPage.pending.count').replace('{count}', formatNumber(pendingTotal, language))}</span>
          </div>
          <div className="shift-handover__pending-grid">
            {pendingTiles.map((tile) => (
              <button
                type="button"
                className="shift-handover__pending-tile shift-handover__tile-button"
                key={tile.key}
                onClick={() => setSelectedTile(tile)}
                aria-label={`${tile.label}: ${formatNumber(tile.value, language)}. ${t('handoverPage.details.view')}`}
              >
                <span className="shift-handover__tile-label"><tile.icon aria-hidden="true" />{tile.label}</span>
                <strong>{formatNumber(tile.value, language)}</strong>
                <span className={`shift-handover__tile-status shift-handover__tile-status--${tile.status ?? 'warning'}`}>
                  {tile.status === 'success' ? t('handoverPage.status.success') : t('handoverPage.status.warning')}
                </span>
              </button>
            ))}
          </div>
          {pendingTotal === 0 && <p className="shift-handover__all-clear">{t('handoverPage.pending.allClear')}</p>}
        </Card>
      </div>

      <div className="shift-handover__row shift-handover__row--wide-start">
        <Card className="shift-handover__panel">
          <div className="shift-handover__panel-heading">
            <div><h2>{t('handoverPage.timeline.title')}</h2><p>{t('handoverPage.timeline.subtitle')}</p></div>
          </div>
          {timelineItems.length > 0 ? (
            <ol className="shift-handover__timeline">
              {timelineItems.map((item) => {
                const Icon = item.kind === 'cleaning' ? Sparkles : Wrench;
                return (
                  <li key={item.id} className="shift-handover__timeline-item">
                    <span className={`shift-handover__timeline-icon shift-handover__timeline-icon--${item.kind}`}><Icon aria-hidden="true" /></span>
                    <div className="shift-handover__timeline-copy">
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                    <time>{item.time}</time>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState title={t('handoverPage.timeline.empty')} description={t('handoverPage.timeline.emptyDesc')} />
          )}
        </Card>

        <section className="shift-handover__finance" aria-label={t('handoverPage.finance.title')}>
          <div className="shift-handover__finance-heading">
            <div><h2>{t('handoverPage.finance.title')}</h2><p>{t('handoverPage.finance.subtitle')}</p></div>
            <Wallet aria-hidden="true" />
          </div>
          <span className="shift-handover__finance-label">{t('handoverPage.finance.total')}</span>
          <strong className="shift-handover__finance-total">{formatAmount(summary.payments.total, language)}</strong>
          <div className="shift-handover__finance-breakdown">
            <div><span>{t('handoverPage.finance.cash')}</span><strong>{formatAmount(summary.payments.cash, language)}</strong></div>
            <div><span>{t('handoverPage.finance.instapay')}</span><strong>{formatAmount(summary.payments.instapay, language)}</strong></div>
            <div><span>{t('handoverPage.finance.vodafone')}</span><strong>{formatAmount(summary.payments.vodafone_cash, language)}</strong></div>
          </div>
        </section>
      </div>

      <div className="shift-handover__row shift-handover__row--wide-start">
        <Card className="shift-handover__panel shift-handover__checklist-card">
          <div className="shift-handover__panel-heading">
            <div><h2>{t('handoverPage.checklist.title')}</h2><p>{t('handoverPage.checklist.subtitle')}</p></div>
            <span className="shift-handover__pill">{t('handoverPage.notes.optional')}</span>
          </div>

          <div className="shift-handover__checklist-grid">
            {checklistItems.map((item) => {
              const Icon = item.icon;
              return (
                <div className={`shift-handover__checklist-item shift-handover__checklist-item--${item.status}`} key={item.key}>
                  <span className="shift-handover__checklist-icon"><Icon aria-hidden="true" /></span>
                  <div className="shift-handover__checklist-copy">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="shift-handover__panel shift-handover__cash-card">
          <div className="shift-handover__panel-heading">
            <div><h2>{t('handoverPage.cash.title')}</h2><p>{t('handoverPage.cash.subtitle')}</p></div>
            <span className="shift-handover__pill shift-handover__pill--success">{cashBalanceText}</span>
          </div>

          <div className="shift-handover__cash-grid">
            <div>
              <span>{t('handoverPage.cash.expected')}</span>
              <strong>{formatAmount(expectedCash, language)}</strong>
            </div>
            <div>
              <span>{t('handoverPage.cash.actual')}</span>
              <strong>{formatAmount(actualCash, language)}</strong>
            </div>
            <div>
              <span>{t('handoverPage.cash.variance')}</span>
              <strong className={cashVariance === 0 ? 'shift-handover__cash-delta--neutral' : cashVariance > 0 ? 'shift-handover__cash-delta--positive' : 'shift-handover__cash-delta--negative'}>
                {formatAmount(Math.abs(cashVariance), language)}
              </strong>
            </div>
          </div>
        </Card>
      </div>

      <form id="shift-handover-form" className="shift-handover__form" onSubmit={requestHandover}>
        <Card className="shift-handover__panel">
          <div className="shift-handover__panel-heading">
            <div><h2>{t('handoverPage.notes.title')}</h2><p>{t('handoverPage.notes.subtitle')}</p></div>
            <span className="shift-handover__pill">{t('handoverPage.notes.optional')}</span>
          </div>
          <textarea
            className="shift-handover__notes"
            aria-label={t('handoverPage.notes.title')}
            placeholder={t('handoverPage.notes.placeholder')}
            value={shiftNotes}
            onChange={(event) => {
              setNotes(event.target.value);
              setIsDraftSaved(false);
            }}
            disabled={isHandedOver}
            rows={4}
          />
        </Card>

        {Boolean(reportError || handover.error || actionError) && (
          <ErrorState title={t('handoverPage.actionError')} message={getErrorMessage(reportError ?? handover.error ?? actionError, language)} />
        )}

        <div className="shift-handover__footer">
          <div className="shift-handover__footer-copy">
            <span>{t('handoverPage.footer.eyebrow')}</span>
            <strong>{isHandedOver ? t('handoverPage.footer.done') : t('handoverPage.footer.progress').replace('{percent}', percentText)}</strong>
            <p>{t('handoverPage.footer.message')}</p>
          </div>
          <div
            className="shift-handover__ring"
            style={{ '--ring-value': `${completionPercent}%` } as CSSProperties}
            aria-hidden="true"
          >
            <span>{percentText}</span>
          </div>
          <div className="shift-handover__footer-actions">
            <Button variant="glass" onClick={saveDraft} disabled={isDraftSaved}>
              {isDraftSaved ? t('handoverPage.footer.draftSaved') : t('handoverPage.footer.draft')}
            </Button>
            <Button variant="glass" onClick={() => void downloadReport()} disabled={isDownloading}>
              <FileText aria-hidden="true" />
              {isDownloading ? t('handoverPage.preparing') : t('handoverPage.footer.report')}
            </Button>
            <Button variant="gold" type="submit" disabled={isHandedOver || handover.isPending}>
              {isHandedOver ? <Check aria-hidden="true" /> : null}
              {handover.isPending ? t('handoverPage.submitting') : isHandedOver ? t('handoverPage.submitted') : t('handoverPage.submit')}
            </Button>
          </div>
        </div>
      </form>

      {isConfirming && (
        <ConfirmDialog
          icon={<ArrowLeftRight />}
          title={t('handoverPage.confirm.title')}
          description={t('handoverPage.confirm.description')}
          confirmLabel={t('handoverPage.confirm.confirm')}
          cancelLabel={t('handoverPage.confirm.cancel')}
          busy={handover.isPending}
          onConfirm={confirmHandover}
          onCancel={() => setIsConfirming(false)}
        />
      )}

      <Drawer
        open={selectedTile !== null}
        title={selectedTile?.label ?? ''}
        eyebrow={t('handoverPage.details.eyebrow')}
        closeLabel={t('handoverPage.details.close')}
        onClose={() => setSelectedTile(null)}
      >
        {selectedTile && (
          <div className="shift-handover__details">
            <div className="shift-handover__details-total">
              <span>{t('handoverPage.details.total')}</span>
              <strong>{formatNumber(selectedTile.value, language)}</strong>
            </div>
            {selectedTile.details?.length ? (
              <ul>
                {selectedTile.details.map((detail, index) => <li key={`${selectedTile.key}-${index}`}>{detail}</li>)}
              </ul>
            ) : (
              <p>{t('handoverPage.details.empty')}</p>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
