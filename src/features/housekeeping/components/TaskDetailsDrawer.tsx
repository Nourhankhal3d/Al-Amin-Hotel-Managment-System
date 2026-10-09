import './TaskDetailsDrawer.css';
import { Timeline } from '../../../components/common/Timeline';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_TONE,
  STATUS_LABEL_KEY,
  TASK_TYPE_LABEL_KEY,
} from '../constants/housekeeping.constants';
import type { TaskPriority, TaskStatus, TaskType } from '../constants/housekeeping.constants';

// TODO: move to types/housekeeping.types.ts and confirm fields with backend
export interface TaskDetails {
  id: string;
  roomNumber: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAt?: string;
  followUpAt?: string;
  notes?: string;
  log: Array<{ id: string; title: string; description?: string; time?: string }>;
}

interface TaskDetailsDrawerProps {
  task: TaskDetails | null;
  onClose: () => void;
}

export function TaskDetailsDrawer({ task, onClose }: TaskDetailsDrawerProps) {
  const { t } = useLanguage();

  return (
    <Drawer
      open={task !== null}
      title={task ? `${t('roomLabel')} ${task.roomNumber}` : ''}
      eyebrow={t('hkDetailsEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary">{t('updateStatus')}</Button>
          <Button>{t('hkSave')}</Button>
        </>
      }
    >
      {task && (
        <div className="task-details">
          <section className="task-details__summary">
            <span className="task-details__icon">✦</span>
            <div className="task-details__summary-text">
              <strong>{t(TASK_TYPE_LABEL_KEY[task.taskType])}</strong>
              {task.assignedAt && <span>{task.assignedAt}</span>}
            </div>
            <Badge tone={PRIORITY_TONE[task.priority]}>{t(PRIORITY_LABEL_KEY[task.priority])}</Badge>
          </section>

          <div className="task-details__grid">
            <div className="task-details__info">
              <span>{t('statusLabel')}</span>
              <strong>{t(STATUS_LABEL_KEY[task.status])}</strong>
            </div>
            {task.followUpAt && (
              <div className="task-details__info">
                <span>{t('hkFollowUp')}</span>
                <strong>{task.followUpAt}</strong>
              </div>
            )}
            <div className="task-details__info">
              <span>{t('priorityLabel')}</span>
              <strong>{t(PRIORITY_LABEL_KEY[task.priority])}</strong>
            </div>
          </div>

          {task.notes && (
            <section>
              <h3 className="task-details__heading">{t('hkNotes')}</h3>
              <p className="task-details__box">{task.notes}</p>
            </section>
          )}

          <section>
            <h3 className="task-details__heading">{t('hkLog')}</h3>
            <Timeline items={task.log} />
          </section>

          {/* TODO: connect these actions when the service layer is ready */}
          <div className="task-details__actions">
            <button type="button" className="task-details__action">
              <span>✓</span>
              {t('followStatus')}
            </button>
            <button type="button" className="task-details__action">
              <span>▤</span>
              {t('viewLog')}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}