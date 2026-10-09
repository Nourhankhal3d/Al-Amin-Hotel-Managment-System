import './TaskDetailsDrawer.css';
import { Timeline } from '../../../components/common/Timeline';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';

// TEMP: texts live here until i18n is ready
const LABELS = {
  eyebrow: 'تفاصيل المهمة',
  status: 'الحالة',
  followUp: 'وقت المتابعة',
  priority: 'الأولوية',
  notes: 'ملاحظات المهمة',
  log: 'سجل المهمة',
  followStatus: 'متابعة الحالة',
  viewLog: 'عرض السجل',
  updateStatus: 'تحديث الحالة',
  save: 'حفظ',
};

// TODO: move to types/housekeeping.types.ts and confirm fields with backend
export interface TaskDetails {
  id: string;
  roomNumber: string;
  taskType: string;
  status: string;
  priority: string;
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
  return (
    <Drawer
      open={task !== null}
      title={task ? `غرفة ${task.roomNumber}` : ''}
      eyebrow={LABELS.eyebrow}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary">{LABELS.updateStatus}</Button>
          <Button>{LABELS.save}</Button>
        </>
      }
    >
      {task && (
        <div className="task-details">
          <section className="task-details__summary">
            <span className="task-details__icon">✦</span>
            <div className="task-details__summary-text">
              <strong>{task.taskType}</strong>
              {task.assignedAt && <span>{task.assignedAt}</span>}
            </div>
            {/* TODO: map priority to tone from housekeeping.constants.ts */}
            <Badge tone="warning">{task.priority}</Badge>
          </section>

          <div className="task-details__grid">
            <div className="task-details__info">
              <span>{LABELS.status}</span>
              <strong>{task.status}</strong>
            </div>
            {task.followUpAt && (
              <div className="task-details__info">
                <span>{LABELS.followUp}</span>
                <strong>{task.followUpAt}</strong>
              </div>
            )}
            <div className="task-details__info">
              <span>{LABELS.priority}</span>
              <strong>{task.priority}</strong>
            </div>
          </div>

          {task.notes && (
            <section>
              <h3 className="task-details__heading">{LABELS.notes}</h3>
              <p className="task-details__box">{task.notes}</p>
            </section>
          )}

          <section>
            <h3 className="task-details__heading">{LABELS.log}</h3>
            <Timeline items={task.log} />
          </section>

          {/* TODO: connect these actions when the service layer is ready */}
          <div className="task-details__actions">
            <button type="button" className="task-details__action">
              <span>✓</span>
              {LABELS.followStatus}
            </button>
            <button type="button" className="task-details__action">
              <span>▤</span>
              {LABELS.viewLog}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}