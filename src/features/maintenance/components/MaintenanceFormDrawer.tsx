import './MaintenanceFormDrawer.css';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { useLanguage } from '../../../core/i18n/useLanguage';
import {
  ISSUE_TYPE_LABEL_KEY,
  ISSUE_TYPE_OPTIONS,
  PRIORITY_LABEL_KEY,
  PRIORITY_OPTIONS,
  ROOM_OPTIONS,
} from '../constants/maintenance.constants';

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
  const { t } = useLanguage();
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
      title={t('mtFormTitle')}
      eyebrow={t('mtFormEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>{t('cancel')}</Button>
          <Button type="submit" form="maintenance-request-form">{t('mtFormSubmit')}</Button>
        </>
      }
    >
      <form id="maintenance-request-form" className="maintenance-form" onSubmit={handleSubmit}>
        <div className="maintenance-form__row">
          <label className="maintenance-form__field">
            <span>{t('roomNumberLabel')}</span>
            <select required value={values.roomNumber} onChange={handleChange('roomNumber')}>
              <option value="" disabled>{t('selectRoom')}</option>
              {ROOM_OPTIONS.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
          </label>
          <label className="maintenance-form__field">
            <span>{t('priorityLabel')}</span>
            <select required value={values.priority} onChange={handleChange('priority')}>
              <option value="" disabled>{t('selectPriority')}</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>{t(PRIORITY_LABEL_KEY[priority])}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="maintenance-form__row">
          <label className="maintenance-form__field">
            <span>{t('mtFormIssueType')}</span>
            <select required value={values.issueType} onChange={handleChange('issueType')}>
              <option value="" disabled>{t('mtFormIssueTypePh')}</option>
              {ISSUE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{t(ISSUE_TYPE_LABEL_KEY[type])}</option>
              ))}
            </select>
          </label>
          <label className="maintenance-form__field">
            <span>{t('mtFormDescription')}</span>
            <input
              required
              placeholder={t('mtFormDescriptionPh')}
              value={values.description}
              onChange={handleChange('description')}
            />
          </label>
        </div>

        <label className="maintenance-form__field">
          <span>{t('statusLabel')}</span>
          <input readOnly value={t('mtStatus_pending')} />
        </label>

        <label className="maintenance-form__field">
          <span>{t('notesLabel')}</span>
          <textarea
            rows={4}
            placeholder={t('mtFormNotesPh')}
            value={values.notes}
            onChange={handleChange('notes')}
          />
        </label>

        <p className="maintenance-form__hint">
          <span>🔧</span>
          {t('mtFormHint')}
        </p>
      </form>
    </Drawer>
  );
}