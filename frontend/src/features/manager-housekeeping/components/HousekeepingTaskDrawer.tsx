import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import {
  HOUSEKEEPING_I18N,
  PRIORITY_OPTIONS,
  PRIORITY_RANK,
  PRIORITY_TONE,
  STATUS_TONE,
} from '../constants/housekeeping.constants';
import type {
  CleanerOption,
  HousekeepingPriority,
  HousekeepingTask,
  HousekeepingTaskAssign,
} from '../types/manager-housekeeping.types';
import { formatRoom, formatTime } from '../utils/housekeepingDisplay';
import './HousekeepingDrawers.css';

interface HousekeepingTaskDrawerProps {
  task: HousekeepingTask | null;
  /** Current guest of the task's room, from the rooms list */
  guestName: string | null;
  cleaners: CleanerOption[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (changes: HousekeepingTaskAssign) => void;
}

export function HousekeepingTaskDrawer({ task, ...props }: HousekeepingTaskDrawerProps) {
  if (!task) return null;
  // key: a fresh form for every task that is opened
  return <TaskDetails key={task.id} task={task} {...props} />;
}

// What the manager can change is what the API accepts (PATCH .../assign): the cleaner and the priority.
// Status and notes are shown as they are.
function TaskDetails({ task, guestName, cleaners, isSaving, onClose, onSave }: HousekeepingTaskDrawerProps & { task: HousekeepingTask }) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${HOUSEKEEPING_I18N}.${key}`), [translate]);
  const [cleanerId, setCleanerId] = useState(task.cleanerId ?? '');
  const [priority, setPriority] = useState<HousekeepingPriority>(task.priority);

  const room = formatRoom(task.roomNumber, language);
  // Contract rules: a completed task cannot be edited, and the priority can only go up
  const isCompleted = task.status === 'COMPLETED';
  const priorityOptions = PRIORITY_OPTIONS.filter((value) => PRIORITY_RANK[value] >= PRIORITY_RANK[task.priority]);
  // A cleaner typed by the receptionist has a name but no staff id: keep it as the first choice
  const cleanerOptions = [
    ...(task.cleanerName && !task.cleanerId ? [{ value: '', label: task.cleanerName }] : []),
    ...cleaners.map((cleaner) => ({ value: cleaner.id, label: cleaner.name })),
  ];

  function save() {
    const changes: HousekeepingTaskAssign = {};
    if (cleanerId && cleanerId !== (task.cleanerId ?? '')) {
      changes.assigned_to_staff_id = cleanerId;
      changes.cleaner_name = cleaners.find((cleaner) => cleaner.id === cleanerId)?.name ?? null;
    }
    if (priority !== task.priority) changes.priority = priority;
    onSave(changes);
  }

  const footer = isCompleted ? (
    <div className="drawer-details__footer hk-drawer__footer--single">
      <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
    </div>
  ) : (
    <div className="drawer-details__footer">
      <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
      <Button onClick={save} disabled={isSaving}>{isSaving ? t('saving') : t('saveTask')}</Button>
    </div>
  );

  const infoTile = (label: string, value: ReactNode) => (
    <div className="drawer-details__info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  return (
    <Drawer
      open
      eyebrow={t('drawerEyebrow')}
      title={t('drawerTitle').replace('{room}', room)}
      closeLabel={t('close')}
      onClose={onClose}
      footer={footer}
    >
      <div className="drawer-details">
        <section className="drawer-details__summary">
          <span className="drawer-details__icon drawer-details__icon--green"><Sparkles aria-hidden="true" /></span>
          <div className="drawer-details__summary-text">
            <strong>{t('summaryTitle')}</strong>
            <span>{t('loggedLine').replace('{time}', formatTime(task.createdAt, language))}</span>
          </div>
          <Badge tone={STATUS_TONE[task.status]}>{t(`statuses.${task.status}`)}</Badge>
        </section>

        {isCompleted && <p className="hk-drawer__note">{t('completedNote')}</p>}

        <div className="drawer-details__grid">
          {isCompleted ? infoTile(t('fields.cleaner'), task.cleanerName ?? t('unassigned')) : (
            <div className="hk-drawer__tile">
              <span>{t('fields.cleaner')}</span>
              <Select
                className="hk-drawer__tile-select"
                value={cleanerId}
                placeholder={t('unassigned')}
                options={cleanerOptions}
                onChange={setCleanerId}
              />
            </div>
          )}
          {isCompleted ? infoTile(t('fields.priority'), <Badge tone={PRIORITY_TONE[task.priority]}>{t(`priorities.${task.priority}`)}</Badge>) : (
            <div className="hk-drawer__tile">
              <span>{t('fields.priority')}</span>
              <Select
                className="hk-drawer__tile-select"
                value={priority}
                options={priorityOptions.map((value) => ({ value, label: t(`priorities.${value}`) }))}
                onChange={(value) => setPriority(value as HousekeepingPriority)}
              />
            </div>
          )}
          {infoTile(t('fields.status'), t(`statuses.${task.status}`))}
          {infoTile(t('fields.logged'), formatTime(task.createdAt, language))}
        </div>

        {!isCompleted && <p className="hk-drawer__hint">{t('priorityHint')}</p>}

        <section>
          <h3 className="drawer-details__heading">{t('fields.notes')}</h3>
          <p className="drawer-details__box">{task.notes || t('noNotes')}</p>
        </section>

        <section>
          <h3 className="drawer-details__heading">{t('roomInfo')}</h3>
          <div className="drawer-details__grid">
            {infoTile(t('fields.room'), room)}
            {infoTile(t('fields.guest'), guestName || t('noGuest'))}
          </div>
        </section>
      </div>
    </Drawer>
  );
}
