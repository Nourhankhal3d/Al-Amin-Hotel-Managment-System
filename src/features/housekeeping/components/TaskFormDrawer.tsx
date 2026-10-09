import './TaskFormDrawer.css';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';

// TEMP: texts live here until i18n is wired
const LABELS = {
  eyebrow: 'مهمة جديدة',
  title: 'إضافة مهمة نظافة',
  room: 'الغرفة',
  roomPlaceholder: 'اختر الغرفة',
  taskType: 'نوع المهمة',
  taskTypePlaceholder: 'اختر نوع المهمة',
  priority: 'الأولوية',
  priorityPlaceholder: 'حدد الأولوية',
  status: 'الحالة',
  statusValue: 'معلّقة',
  notes: 'ملاحظات',
  notesPlaceholder: 'أضف تعليمات أو ملاحظات',
  hint: 'سيتم إرسال البلاغ إلى إدارة التنظيف للتعيين والمتابعة.',
  cancel: 'إلغاء',
  submit: 'إرسال البلاغ',
};

// TEMP: options until the real data is connected. TODO: confirm with backend
const ROOM_OPTIONS = ['101', '102', '207', '305'];
const TASK_TYPE_OPTIONS = ['تنظيف بعد المغادرة', 'تجهيز قبل الوصول', 'تنظيف يومي', 'طلب من الضيف'];
const PRIORITY_OPTIONS = ['عادي', 'مرتفع', 'حرج'];

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
      title={LABELS.title}
      eyebrow={LABELS.eyebrow}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>{LABELS.cancel}</Button>
          <Button type="submit" form="housekeeping-task-form">{LABELS.submit}</Button>
        </>
      }
    >
      <form id="housekeeping-task-form" className="task-form" onSubmit={handleSubmit}>
        <div className="task-form__row">
          <label className="task-form__field">
            <span>{LABELS.room}</span>
            <select required value={values.roomNumber} onChange={handleChange('roomNumber')}>
              <option value="" disabled>{LABELS.roomPlaceholder}</option>
              {ROOM_OPTIONS.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
          </label>
          <label className="task-form__field">
            <span>{LABELS.taskType}</span>
            <select required value={values.taskType} onChange={handleChange('taskType')}>
              <option value="" disabled>{LABELS.taskTypePlaceholder}</option>
              {TASK_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
        </div>

        <label className="task-form__field">
          <span>{LABELS.priority}</span>
          <select required value={values.priority} onChange={handleChange('priority')}>
            <option value="" disabled>{LABELS.priorityPlaceholder}</option>
            {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>

        <label className="task-form__field">
          <span>{LABELS.status}</span>
          <input readOnly value={LABELS.statusValue} />
        </label>

        <label className="task-form__field">
          <span>{LABELS.notes}</span>
          <textarea
            rows={4}
            placeholder={LABELS.notesPlaceholder}
            value={values.notes}
            onChange={handleChange('notes')}
          />
        </label>

        <p className="task-form__hint">
          <span>✦</span>
          {LABELS.hint}
        </p>
      </form>
    </Drawer>
  );
}