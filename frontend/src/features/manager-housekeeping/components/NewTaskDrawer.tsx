import { useCallback, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Combobox } from '../../../components/ui/Combobox';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import {
  CLEANER_MAX_LENGTH,
  HOUSEKEEPING_I18N,
  NOTES_MAX_LENGTH,
  PRIORITY_OPTIONS,
} from '../constants/housekeeping.constants';
import {
  EMPTY_NEW_TASK,
  NEW_TASK_FIELD_ORDER,
  validateNewTask,
  type NewTaskErrors,
  type NewTaskField,
  type NewTaskValues,
} from '../schemas/newTask.schema';
import type { CleanerOption, RoomOption } from '../types/manager-housekeeping.types';
import { formatRoom } from '../utils/housekeepingDisplay';
import './NewTaskDrawer.css';

const FORM_ID = 'manager-housekeeping-task-form';

interface NewTaskDrawerProps {
  open: boolean;
  rooms: RoomOption[];
  cleaners: CleanerOption[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: NewTaskValues) => void;
}

// Same layout, fields and rules as the receptionist's "Add cleaning task" drawer.
// Room and cleaner can be typed or picked from the list.
export function NewTaskDrawer({ open, ...props }: NewTaskDrawerProps) {
  if (!open) return null;
  // Mounted only while open, so the form always starts empty
  return <NewTaskForm {...props} />;
}

function NewTaskForm({ rooms, cleaners, isSaving, onClose, onSubmit }: Omit<NewTaskDrawerProps, 'open'>) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${HOUSEKEEPING_I18N}.${key}`), [translate]);
  const baseId = useId();
  const fieldId = (field: NewTaskField) => `${baseId}-${field}`;
  const [values, setValues] = useState<NewTaskValues>(EMPTY_NEW_TASK);
  const [errors, setErrors] = useState<NewTaskErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Errors appear after the first submit, then update live while the user fixes them
  function setField<F extends NewTaskField>(field: F, value: NewTaskValues[F]) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted) setErrors(validateNewTask(next, rooms, cleaners));
  }

  const errorText = (field: NewTaskField) => {
    const key = errors[field];
    if (!key) return undefined;
    const max = field === 'cleaner' ? CLEANER_MAX_LENGTH : NOTES_MAX_LENGTH;
    return t(`errors.${key}`).replace('{max}', formatNumber(max, language));
  };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setSubmitted(true);
    const found = validateNewTask(values, rooms, cleaners);
    setErrors(found);
    const firstInvalid = NEW_TASK_FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      // Take the user to the first field that needs fixing
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    onSubmit(values);
  }

  const notesError = errorText('notes');

  return (
    <Drawer
      open
      title={t('newTask.title')}
      eyebrow={t('newTask.eyebrow')}
      closeLabel={t('close')}
      onClose={onClose}
      className="hk-task-form-drawer"
      footer={(
        <div className="hk-task-form__footer">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>{t('cancel')}</Button>
          <Button type="submit" form={FORM_ID} disabled={isSaving}>{isSaving ? t('saving') : t('newTask.submit')}</Button>
        </div>
      )}
    >
      <form id={FORM_ID} className="hk-task-form" onSubmit={handleSubmit} noValidate>
        <div className="hk-task-form__row">
          <Combobox
            id={fieldId('roomNumber')}
            label={t('fields.room')}
            value={values.roomNumber}
            options={rooms.map((room) => ({ value: room.roomNumber, label: formatRoom(room.roomNumber, language) }))}
            inputMode="numeric"
            placeholder={t('newTask.roomPlaceholder')}
            noResultsLabel={t('newTask.roomNoResults')}
            onChange={(next) => setField('roomNumber', next)}
            error={errorText('roomNumber')}
            disabled={isSaving}
          />
          <Combobox
            id={fieldId('cleaner')}
            label={t('newTask.cleaner')}
            value={values.cleaner}
            options={cleaners.map((cleaner) => ({ value: cleaner.id, label: cleaner.name }))}
            placeholder={t('newTask.cleanerPlaceholder')}
            noResultsLabel={t('newTask.cleanerNoResults')}
            onChange={(next) => setField('cleaner', next)}
            error={errorText('cleaner')}
            disabled={isSaving}
          />
        </div>

        <div className="hk-task-form__row">
          <Select
            id={fieldId('priority')}
            label={t('fields.priority')}
            value={values.priority}
            placeholder={t('newTask.priorityPlaceholder')}
            options={PRIORITY_OPTIONS.map((priority) => ({ value: priority, label: t(`priorities.${priority}`) }))}
            onChange={(next) => setField('priority', next as NewTaskValues['priority'])}
            error={errorText('priority')}
            disabled={isSaving}
          />
        </div>

        <label className="hk-task-form__field">
          <span>{t('fields.notes')}</span>
          <textarea
            id={fieldId('notes')}
            rows={4}
            placeholder={t('newTask.notesPlaceholder')}
            value={values.notes}
            maxLength={NOTES_MAX_LENGTH}
            disabled={isSaving}
            aria-invalid={notesError ? true : undefined}
            aria-describedby={notesError ? `${fieldId('notes')}-error` : undefined}
            className={notesError ? 'hk-task-form__control--error' : undefined}
            onChange={(event) => setField('notes', event.target.value)}
          />
          {notesError && <span id={`${fieldId('notes')}-error`} className="hk-task-form__error">{notesError}</span>}
        </label>

        <p className="hk-task-form__hint">
          <Sparkles aria-hidden="true" />
          {t('newTask.hint')}
        </p>
      </form>
    </Drawer>
  );
}
