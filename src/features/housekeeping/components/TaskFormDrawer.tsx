import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Combobox } from '../../../components/ui/Combobox';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import {
  HK_NOTES_MAX_LENGTH,
  PRIORITY_LABEL_KEY,
  PRIORITY_OPTIONS,
  ROOM_OPTIONS,
  STATUS_LABEL_KEY,
  STATUS_OPTIONS,
  TASK_TYPE_LABEL_KEY,
  TASK_TYPE_OPTIONS,
} from '../constants/housekeeping.constants';
import {
  EMPTY_NEW_TASK,
  hasErrors,
  toCreateTaskInput,
  validateNewTask,
} from '../schemas/housekeepingTask.schema';
import type { NewTaskFormErrors, NewTaskFormValues } from '../schemas/housekeepingTask.schema';
import type { CreateHousekeepingTaskInput } from '../types/housekeeping.types';
import './TaskFormDrawer.css';

const FORM_ID = 'housekeeping-task-form';
const FIELD_ORDER: Array<keyof NewTaskFormValues> = ['roomNumber', 'taskType', 'priority', 'status', 'notes'];

interface TaskFormDrawerProps {
  open: boolean;
  language: Language;
  onClose: () => void;
  onSubmit: (input: CreateHousekeepingTaskInput) => void;
  isSaving: boolean;
}

// The parent remounts this component (via `key`) every time it opens, so the form always starts empty.
export function TaskFormDrawer({ open, language, onClose, onSubmit, isSaving }: TaskFormDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  const baseId = useId();
  const fieldId = (field: keyof NewTaskFormValues) => `${baseId}-${field}`;
  const [values, setValues] = useState<NewTaskFormValues>(EMPTY_NEW_TASK);
  const [errors, setErrors] = useState<NewTaskFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Errors appear after the first submit, then update live while the user fixes them
  const setField = <K extends keyof NewTaskFormValues>(field: K, value: NewTaskFormValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted) setErrors(validateNewTask(next));
  };

  const errorText = (field: keyof NewTaskFormValues) => {
    const key = errors[field];
    if (!key) return undefined;
    return t(key).replace('{max}', formatNumber(HK_NOTES_MAX_LENGTH, language));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setSubmitted(true);
    const nextErrors = validateNewTask(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      // Take the user to the first field that needs fixing
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    onSubmit(toCreateTaskInput(values));
  };

  const notesError = errorText('notes');

  return (
    <Drawer
      open={open}
      title={t('hkFormTitle')}
      eyebrow={t('hkFormEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      className="task-form-drawer"
      footer={
        <div className="task-form__footer">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>{t('cancel')}</Button>
          <Button type="submit" form={FORM_ID} disabled={isSaving}>{t('hkFormSubmit')}</Button>
        </div>
      }
    >
      <form id={FORM_ID} className="task-form" onSubmit={handleSubmit} noValidate>
        <div className="task-form__row">
          <Combobox
            id={fieldId('roomNumber')}
            label={t('colRoom')}
            value={values.roomNumber}
            options={ROOM_OPTIONS.map((room) => ({ value: room, label: formatNumber(Number(room), language) }))}
            inputMode="numeric"
            placeholder={t('selectRoom')}
            noResultsLabel={t('hkRoomNoResults')}
            onChange={(next) => setField('roomNumber', next)}
            error={errorText('roomNumber')}
            disabled={isSaving}
          />
          <Select
            id={fieldId('taskType')}
            label={t('hkColTaskType')}
            value={values.taskType}
            placeholder={t('hkFormTaskTypePh')}
            options={TASK_TYPE_OPTIONS.map((type) => ({ value: type, label: t(TASK_TYPE_LABEL_KEY[type]) }))}
            onChange={(next) => setField('taskType', next as NewTaskFormValues['taskType'])}
            error={errorText('taskType')}
            disabled={isSaving}
          />
        </div>

        <div className="task-form__row">
          <Select
            id={fieldId('priority')}
            label={t('priorityLabel')}
            value={values.priority}
            placeholder={t('selectPriority')}
            options={PRIORITY_OPTIONS.map((priority) => ({ value: priority, label: t(PRIORITY_LABEL_KEY[priority]) }))}
            onChange={(next) => setField('priority', next as NewTaskFormValues['priority'])}
            error={errorText('priority')}
            disabled={isSaving}
          />
        </div>

        <Select
          id={fieldId('status')}
          label={t('statusLabel')}
          value={values.status}
          placeholder={t('hkChooseStatus')}
          options={STATUS_OPTIONS.map((status) => ({ value: status, label: t(STATUS_LABEL_KEY[status]) }))}
          onChange={(next) => setField('status', next as NewTaskFormValues['status'])}
          error={errorText('status')}
          disabled={isSaving}
        />

        <label className="task-form__field">
          <span>{t('notesLabel')}</span>
          <textarea
            id={fieldId('notes')}
            rows={4}
            placeholder={t('hkFormNotesPh')}
            value={values.notes}
            maxLength={HK_NOTES_MAX_LENGTH}
            disabled={isSaving}
            aria-invalid={notesError ? true : undefined}
            aria-describedby={notesError ? `${fieldId('notes')}-error` : undefined}
            className={notesError ? 'task-form__control--error' : undefined}
            onChange={(event) => setField('notes', event.target.value)}
          />
          {notesError && <span id={`${fieldId('notes')}-error`} className="task-form__error">{notesError}</span>}
        </label>

        <p className="task-form__hint">
          <Sparkles aria-hidden="true" />
          {t('hkFormHint')}
        </p>
      </form>
    </Drawer>
  );
}
