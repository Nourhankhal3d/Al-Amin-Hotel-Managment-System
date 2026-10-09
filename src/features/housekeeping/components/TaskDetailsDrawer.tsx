import { useId, useRef, useState } from 'react';
import { Check, Receipt, Sparkles } from 'lucide-react';
import { Timeline } from '../../../components/common/Timeline';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import {
  LOG_DESCRIPTION_KEY,
  LOG_TITLE_KEY,
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
  STATUS_OPTIONS,
  TASK_TYPE_LABEL_KEY,
} from '../constants/housekeeping.constants';
import { validateStatusChange } from '../schemas/housekeepingTask.schema';
import type { HousekeepingTask, TaskStatus } from '../types/housekeeping.types';
import { formatTaskTime } from '../utils/housekeepingDisplay';
import './TaskDetailsDrawer.css';

const EMPTY_VALUE = '—';

interface TaskDetailsDrawerProps {
  task: HousekeepingTask | null;
  language: Language;
  onClose: () => void;
  onSave: (status: TaskStatus) => void;
  isSaving: boolean;
}

// The parent gives this component a `key` per task, so the editor resets when another task opens.
export function TaskDetailsDrawer({ task, language, onClose, onSave, isSaving }: TaskDetailsDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  const statusSelectId = useId();
  const statusRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLElement>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [draftStatus, setDraftStatus] = useState<TaskStatus | ''>('');
  const [statusError, setStatusError] = useState<string>();

  const scrollTo = (element: HTMLElement | null) => element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const focusStatusSelect = () => {
    // The select appears on the next render, so wait one frame before focusing it
    requestAnimationFrame(() => document.getElementById(statusSelectId)?.focus({ preventScroll: true }));
    scrollTo(statusRef.current);
  };

  const startEditingStatus = () => {
    setIsEditingStatus(true);
    focusStatusSelect();
  };

  const changeDraftStatus = (next: string) => {
    const status = next as TaskStatus;
    setDraftStatus(status);
    if (statusError && task) setStatusError(validateStatusChange(task.status, status));
  };

  const save = () => {
    if (!task || isSaving) return;
    const error = validateStatusChange(task.status, draftStatus);
    if (error) {
      setStatusError(error);
      setIsEditingStatus(true);
      focusStatusSelect();
      return;
    }
    onSave(draftStatus as TaskStatus);
  };

  const logItems = task
    ? [...task.log].reverse().map((entry) => ({
        id: entry.id,
        title: t(LOG_TITLE_KEY[entry.event]),
        description: entry.event === 'status_changed' && entry.status
          ? t(LOG_DESCRIPTION_KEY.status_changed).replace('{status}', t(STATUS_LABEL_KEY[entry.status]))
          : t(LOG_DESCRIPTION_KEY[entry.event]),
        time: formatTaskTime(entry.at, language),
      }))
    : [];

  // Every status except the current one, so "save" always means a real change
  const statusOptions = task
    ? STATUS_OPTIONS.filter((option) => option !== task.status).map((option) => ({ value: option, label: t(STATUS_LABEL_KEY[option]) }))
    : [];

  return (
    <Drawer
      open={task !== null}
      title={task ? `${t('roomLabel')} ${formatNumber(Number(task.roomNumber), language)}` : ''}
      eyebrow={t('hkDetailsEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      className="task-details-drawer"
      footer={
        <div className="task-details__footer">
          <Button variant="secondary" onClick={startEditingStatus} disabled={isSaving}>{t('updateStatus')}</Button>
          <Button onClick={save} disabled={isSaving}>{t('hkSave')}</Button>
        </div>
      }
    >
      {task && (
        <div className="task-details">
          <section className="task-details__summary">
            <span className="task-details__icon"><Sparkles aria-hidden="true" /></span>
            <div className="task-details__summary-text">
              <strong>{t(TASK_TYPE_LABEL_KEY[task.taskType])}</strong>
              <span>
                {task.assignedAt
                  ? t('hkAssignedAt').replace('{time}', formatTaskTime(task.assignedAt, language))
                  : `${t('hkColCreatedAt')}: ${formatTaskTime(task.createdAt, language)}`}
              </span>
            </div>
            <Badge tone={PRIORITY_TONE[task.priority]}>{t(PRIORITY_LABEL_KEY[task.priority])}</Badge>
          </section>

          <div className="task-details__grid">
            <div ref={statusRef} className={`task-details__info${isEditingStatus ? ' task-details__info--editing' : ''}`}>
              <span>{t('statusLabel')}</span>
              {isEditingStatus ? (
                <Select
                  id={statusSelectId}
                  value={draftStatus}
                  placeholder={t('hkChooseStatus')}
                  options={statusOptions}
                  onChange={changeDraftStatus}
                  error={statusError ? t(statusError) : undefined}
                  disabled={isSaving}
                />
              ) : (
                <strong>{t(STATUS_LABEL_KEY[task.status])}</strong>
              )}
            </div>
            {/* Always shown so priority stays on its own row under the status, as in the prototype */}
            <div className="task-details__info">
              <span>{t('hkFollowUp')}</span>
              <strong>{task.followUpAt ? formatTaskTime(task.followUpAt, language) : EMPTY_VALUE}</strong>
            </div>
            <div className="task-details__info">
              <span>{t('priorityLabel')}</span>
              <strong>{t(PRIORITY_LABEL_KEY[task.priority])}</strong>
            </div>
          </div>

          <section>
            <h3 className="task-details__heading">{t('hkNotes')}</h3>
            <p className="task-details__box">{task.notes || EMPTY_VALUE}</p>
          </section>

          <section ref={logRef}>
            <h3 className="task-details__heading">{t('hkLog')}</h3>
            {logItems.length > 0
              ? <Timeline items={logItems} />
              : <p className="task-details__box">{t('hkLogEmpty')}</p>}
          </section>

          <div className="task-details__actions">
            <button type="button" className="task-details__action" onClick={() => scrollTo(statusRef.current)}>
              <Check aria-hidden="true" />
              {t('followStatus')}
            </button>
            <button type="button" className="task-details__action" onClick={() => scrollTo(logRef.current)}>
              <Receipt aria-hidden="true" />
              {t('viewLog')}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
