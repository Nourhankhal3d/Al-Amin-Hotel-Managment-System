import './MaintenanceFormDrawer.css';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';

// TEMP: texts live here until i18n is wired
const LABELS = {
  eyebrow: 'بلاغ جديد',
  title: 'تسجيل مشكلة صيانة',
  room: 'رقم الغرفة',
  roomPlaceholder: 'اختر الغرفة',
  priority: 'الأولوية',
  priorityPlaceholder: 'حدد الأولوية',
  issueType: 'نوع المشكلة',
  issueTypePlaceholder: 'اختر نوع المشكلة',
  description: 'الوصف',
  descriptionPlaceholder: 'صف المشكلة باختصار',
  status: 'الحالة',
  statusValue: 'معلّقة',
  notes: 'ملاحظات',
  notesPlaceholder: 'أضف تفاصيل تساعد فريق الصيانة',
  hint: 'سيتم إرسال البلاغ إلى إدارة الصيانة للتعيين والمتابعة.',
  cancel: 'إلغاء',
  submit: 'تسجيل البلاغ',
};

// TEMP: options until the real data is connected. TODO: confirm with backend
const ROOM_OPTIONS = ['101', '112', '207', '305'];
const PRIORITY_OPTIONS = ['عادي', 'مرتفع', 'حرج'];
const ISSUE_TYPE_OPTIONS = ['سباكة', 'كهرباء', 'تكييف', 'أثاث', 'أخرى'];

export interface NewRequestValues {
  roomNumber: string;
  priority: string;
  issueType: string;
  description: string;
  notes: string;
}

const EMPTY_VALUES: NewRequestValues = {
  roomNumber: '',
  priority: '',
  issueType: '',
  description: '',
  notes: '',
};

interface MaintenanceFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: NewRequestValues) => void;
}

export function MaintenanceFormDrawer({ open, onClose, onSubmit }: MaintenanceFormDrawerProps) {
  const [values, setValues] = useState<NewRequestValues>(EMPTY_VALUES);

  const handleChange =
    (field: keyof NewRequestValues) =>
    (event: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
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
          <Button type="submit" form="maintenance-request-form">{LABELS.submit}</Button>
        </>
      }
    >
      <form id="maintenance-request-form" className="maintenance-form" onSubmit={handleSubmit}>
        <div className="maintenance-form__row">
          <label className="maintenance-form__field">
            <span>{LABELS.room}</span>
            <select required value={values.roomNumber} onChange={handleChange('roomNumber')}>
              <option value="" disabled>{LABELS.roomPlaceholder}</option>
              {ROOM_OPTIONS.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
          </label>
          <label className="maintenance-form__field">
            <span>{LABELS.priority}</span>
            <select required value={values.priority} onChange={handleChange('priority')}>
              <option value="" disabled>{LABELS.priorityPlaceholder}</option>
              {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </label>
        </div>

        <div className="maintenance-form__row">
          <label className="maintenance-form__field">
            <span>{LABELS.issueType}</span>
            <select required value={values.issueType} onChange={handleChange('issueType')}>
              <option value="" disabled>{LABELS.issueTypePlaceholder}</option>
              {ISSUE_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="maintenance-form__field">
            <span>{LABELS.description}</span>
            <input
              required
              placeholder={LABELS.descriptionPlaceholder}
              value={values.description}
              onChange={handleChange('description')}
            />
          </label>
        </div>

        <label className="maintenance-form__field">
          <span>{LABELS.status}</span>
          <input readOnly value={LABELS.statusValue} />
        </label>

        <label className="maintenance-form__field">
          <span>{LABELS.notes}</span>
          <textarea
            rows={4}
            placeholder={LABELS.notesPlaceholder}
            value={values.notes}
            onChange={handleChange('notes')}
          />
        </label>

        <p className="maintenance-form__hint">
          <span>🔧</span>
          {LABELS.hint}
        </p>
      </form>
    </Drawer>
  );
}