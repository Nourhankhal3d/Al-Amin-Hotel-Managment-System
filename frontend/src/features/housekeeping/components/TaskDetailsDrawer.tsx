import { useState, type FormEvent } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Timeline } from '../../../components/common/Timeline';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import {
  HK_CLEANER_MAX_LENGTH,
  PRIORITY_LABEL_KEY,
  PRIORITY_OPTIONS,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
} from '../constants/housekeeping.constants';
import type { HousekeepingTask, Priority } from '../types/housekeeping.types';
import { formatTaskTime } from '../utils/housekeepingDisplay';
import './TaskDetailsDrawer.css';

const EMPTY_VALUE = '—';

interface TaskDetailsDrawerProps {
  task: HousekeepingTask | null;
  language: Language;
  onClose: () => void;
  onComplete: () => void;
  isSaving: boolean;
  onSaveCleaner: (cleanerName: string) => void;
  isSavingCleaner: boolean;
  onSavePriority: (priority: Priority) => void;
  isSavingPriority: boolean;
}

// The parent gives this component a `key` per task, so the confirm step and the typed values reset when another task opens.
export function TaskDetailsDrawer({
  task,
  language,
  onClose,
  onComplete,
  isSaving,
  onSaveCleaner,
  isSavingCleaner,
  onSavePriority,
  isSavingPriority,
}: TaskDetailsDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  // Marking a task done cannot be undone, so it takes a second click to confirm
  const [confirming, setConfirming] = useState(false);
  // The name typed in the "assign cleaner" box; it starts from the name already saved on the task
  const [cleanerDraft, setCleanerDraft] = useState(task?.cleaner_name ?? '');
  // The priority picked in the "change priority" box; it starts from the saved priority
  const [priorityDraft, setPriorityDraft] = useState<Priority>(task?.priority ?? 'medium');

  // Saving the name is allowed only for a non-empty name that differs from the saved one
  const cleanerValue = cleanerDraft.trim();
  const canSaveCleaner = cleanerValue.length > 0 && cleanerValue !== (task?.cleaner_name ?? '') && !isSavingCleaner;

  // Saving the priority is allowed only when it differs from the saved one
  const canSavePriority = task !== null && priorityDraft !== task.priority && !isSavingPriority;
  const priorityOptions = PRIORITY_OPTIONS.map((priority) => ({
    value: priority,
    label: t(PRIORITY_LABEL_KEY[priority]),
  }));

  function submitCleaner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSaveCleaner) onSaveCleaner(cleanerValue);
  }

  function submitPriority(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSavePriority) onSavePriority(priorityDraft);
  }

  // Log built from the two dates the API sends: when the task was created and when it was finished
  const logItems = task
    ? [
        ...(task.finished_date
          ? [{ id: 'done', title: t('hkLog_done'), description: t('hkLog_doneDesc'), time: formatTaskTime(task.finished_date, language) }]
          : []),
        { id: 'created', title: t('hkLog_created'), description: t('hkLog_createdDesc'), time: formatTaskTime(task.assigned_date, language) },
      ]
    : [];

  const footer = task && task.status === 'pending' ? (
    confirming ? (
      <div className="task-details__footer">
        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={isSaving}>{t('cancel')}</Button>
        <Button onClick={onComplete} disabled={isSaving}>{t('hkConfirmDone')}</Button>
      </div>
    ) : (
      <div className="task-details__footer task-details__footer--single">
        <Button onClick={() => setConfirming(true)}>
          <Check aria-hidden="true" />
          {t('hkMarkDone')}
        </Button>
      </div>
    )
  ) : undefined;

  return (
    <Drawer
      open={task !== null}
      title={task ? `${t('roomLabel')} ${Number.isFinite(Number(task.room_number || task.room_id)) ? formatNumber(Number(task.room_number || task.room_id), language) : (task.room_number || task.room_id)}` : ''}
      eyebrow={t('hkDetailsEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      className="task-details-drawer"
      footer={footer}
    >
      {task && (
        <div className="task-details">
          <section className="task-details__summary">
            <span className="task-details__icon"><Sparkles aria-hidden="true" /></span>
            <div className="task-details__summary-text">
              <strong>{t('hkTaskTitle')}</strong>
              <span>{`${t('hkColCreatedAt')}: ${formatTaskTime(task.assigned_date, language)}`}</span>
            </div>
            <Badge tone={PRIORITY_TONE[task.priority]}>{t(PRIORITY_LABEL_KEY[task.priority])}</Badge>
          </section>

          <div className="task-details__grid">
            <div className="task-details__info">
              <span>{t('statusLabel')}</span>
              <strong>{t(STATUS_LABEL_KEY[task.status])}</strong>
            </div>
            <div className="task-details__info">
              <span>{t('hkCleaner')}</span>
              <strong>{task.cleaner_name || EMPTY_VALUE}</strong>
            </div>
            <div className="task-details__info">
              <span>{t('priorityLabel')}</span>
              <strong>{t(PRIORITY_LABEL_KEY[task.priority])}</strong>
            </div>
          </div>

          {task.status === 'pending' && (
            <section>
              <h3 className="task-details__heading">{t('hkAssignCleaner')}</h3>
              <form className="task-details__assign" onSubmit={submitCleaner}>
                <Input
                  value={cleanerDraft}
                  maxLength={HK_CLEANER_MAX_LENGTH}
                  placeholder={t('hkCleanerNamePh')}
                  aria-label={t('hkCleaner')}
                  onChange={(event) => setCleanerDraft(event.target.value)}
                />
                <Button type="submit" variant="secondary" disabled={!canSaveCleaner}>
                  {t('hkSaveCleaner')}
                </Button>
              </form>
            </section>
          )}

          {task.status === 'pending' && (
            <section>
              <h3 className="task-details__heading">{t('hkChangePriority')}</h3>
              <form className="task-details__assign" onSubmit={submitPriority}>
                <Select
                  value={priorityDraft}
                  options={priorityOptions}
                  onChange={(value) => setPriorityDraft(value as Priority)}
                />
                <Button type="submit" variant="secondary" disabled={!canSavePriority}>
                  {t('hkSavePriority')}
                </Button>
              </form>
            </section>
          )}

          <section>
            <h3 className="task-details__heading">{t('hkNotes')}</h3>
            <p className="task-details__box">{task.notes || EMPTY_VALUE}</p>
          </section>

          <section>
            <h3 className="task-details__heading">{t('hkLog')}</h3>
            <Timeline items={logItems} />
          </section>
        </div>
      )}
    </Drawer>
  );
}