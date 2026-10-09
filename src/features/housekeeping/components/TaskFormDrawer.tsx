import './TaskFormDrawer.css';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import {
  PRIORITY_LABEL_KEY,
  PRIORITY_OPTIONS,
  ROOM_OPTIONS,
  TASK_TYPE_LABEL_KEY,
  TASK_TYPE_OPTIONS,
} from '../constants/housekeeping.constants';

export interface NewTaskValues {
  roomNumber: string;
  taskType: string;
  priority: string;
  notes: string;
}

const EMPTY_VALUES: NewTaskValues = { roomNumber: '', taskType: '', priority: '', notes: '' };

interface TaskFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: NewTaskValues) => void;
}

export function TaskFormDrawer({ open, onClose, onSubmit }: TaskFormDrawerProps) {
  const { t } = useLanguage();
  const [values, setValues] = useState<NewTaskValues>(EMPTY_VALUES);

  const handleChange =
    (field: keyof NewTaskValues) =>
    (event: ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((previous) => ({ ...previous, [field]: event.target.value }));
    };

  const handleClose = () => {
    setValues(EMPTY_VALUES);
    onClose();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
    setValues(EMPTY_VALUES);
  };

  return (
    <Drawer
      open={open}
      title={t('hkFormTitle')}
      eyebrow={t('hkFormEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>{t('cancel')}</Button>
          <Button type="submit" form="housekeeping-task-form">{t('hkFormSubmit')}</Button>
        </>
      }
    >
      <form id="housekeeping-task-form" className="task-form" onSubmit={handleSubmit}>
        <div className="task-form__row">
          <label className="task-form__field">
            <span>{t('roomLabel')}</span>
            <select required value={values.roomNumber} onChange={handleChange('roomNumber')}>
              <option value="" disabled>{t('selectRoom')}</option>
              {ROOM_OPTIONS.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
          </label>
          <label className="task-form__field">
            <span>{t('hkColTaskType')}</span>
            <select required value={values.taskType} onChange={handleChange('taskType')}>
              <option value="" disabled>{t('hkFormTaskTypePh')}</option>
              {TASK_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{t(TASK_TYPE_LABEL_KEY[type])}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="task-form__field">
          <span>{t('priorityLabel')}</span>
          <select required value={values.priority} onChange={handleChange('priority')}>
            <option value="" disabled>{t('selectPriority')}</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>{t(PRIORITY_LABEL_KEY[priority])}</option>
            ))}
          </select>
        </label>

        <label className="task-form__field">
          <span>{t('statusLabel')}</span>
          <input readOnly value={t('hkStatus_pending')} />
        </label>

        <label className="task-form__field">
          <span>{t('notesLabel')}</span>
          <textarea
            rows={4}
            placeholder={t('hkFormNotesPh')}
            value={values.notes}
            onChange={handleChange('notes')}
          />
        </label>

        <p className="task-form__hint">
          <span>✦</span>
          {t('hkFormHint')}
        </p>
      </form>
    </Drawer>
  );
}