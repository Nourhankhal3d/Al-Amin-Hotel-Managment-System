import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Wrench } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Combobox } from '../../../components/ui/Combobox';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { getTranslation, type Language } from '../../../core/i18n';
import { formatNumber } from '../../../utils/format';
import {
  ISSUE_TYPE_LABEL_KEY,
  ISSUE_TYPE_OPTIONS,
  MT_NOTES_MAX_LENGTH,
  MT_TITLE_MAX_LENGTH,
  MT_TITLE_MIN_LENGTH,
  PRIORITY_LABEL_KEY,
  PRIORITY_OPTIONS,
  ROOM_OPTIONS,
  STATUS_LABEL_KEY,
  STATUS_OPTIONS,
} from '../constants/maintenance.constants';
import {
  EMPTY_NEW_REQUEST,
  hasErrors,
  toCreateRequestInput,
  validateNewRequest,
} from '../schemas/maintenanceRequest.schema';
import type { NewRequestFormErrors, NewRequestFormValues } from '../schemas/maintenanceRequest.schema';
import type { CreateMaintenanceRequestInput } from '../types/maintenance.types';
import './MaintenanceFormDrawer.css';

const FORM_ID = 'maintenance-request-form';
const FIELD_ORDER: Array<keyof NewRequestFormValues> = ['roomNumber', 'priority', 'issueType', 'title', 'status', 'notes'];

interface MaintenanceFormDrawerProps {
  open: boolean;
  language: Language;
  onClose: () => void;
  onSubmit: (input: CreateMaintenanceRequestInput) => void;
  isSaving: boolean;
}

// The parent remounts this component (via `key`) every time it opens, so the form always starts empty.
export function MaintenanceFormDrawer({ open, language, onClose, onSubmit, isSaving }: MaintenanceFormDrawerProps) {
  const t = (key: string) => getTranslation(language, key);
  const baseId = useId();
  const fieldId = (field: keyof NewRequestFormValues) => `${baseId}-${field}`;
  const [values, setValues] = useState<NewRequestFormValues>(EMPTY_NEW_REQUEST);
  const [errors, setErrors] = useState<NewRequestFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Errors appear after the first submit, then update live while the user fixes them
  const setField = <K extends keyof NewRequestFormValues>(field: K, value: NewRequestFormValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted) setErrors(validateNewRequest(next));
  };

  const errorText = (field: keyof NewRequestFormValues) => {
    const key = errors[field];
    if (!key) return undefined;
    const max = field === 'notes' ? MT_NOTES_MAX_LENGTH : MT_TITLE_MAX_LENGTH;
    return t(key)
      .replace('{min}', formatNumber(MT_TITLE_MIN_LENGTH, language))
      .replace('{max}', formatNumber(max, language));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setSubmitted(true);
    const nextErrors = validateNewRequest(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      // Take the user to the first field that needs fixing
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    onSubmit(toCreateRequestInput(values));
  };

  const titleError = errorText('title');
  const notesError = errorText('notes');

  return (
    <Drawer
      open={open}
      title={t('mtFormTitle')}
      eyebrow={t('mtFormEyebrow')}
      closeLabel={t('drawerClose')}
      onClose={onClose}
      className="maintenance-form-drawer"
      footer={
        <div className="maintenance-form__footer">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>{t('cancel')}</Button>
          <Button type="submit" form={FORM_ID} disabled={isSaving}>{t('mtFormSubmit')}</Button>
        </div>
      }
    >
      <form id={FORM_ID} className="maintenance-form" onSubmit={handleSubmit} noValidate>
        <div className="maintenance-form__row">
          <Combobox
            id={fieldId('roomNumber')}
            label={t('roomNumberLabel')}
            value={values.roomNumber}
            options={ROOM_OPTIONS.map((room) => ({ value: room, label: formatNumber(Number(room), language) }))}
            inputMode="numeric"
            placeholder={t('selectRoom')}
            noResultsLabel={t('mtRoomNoResults')}
            onChange={(next) => setField('roomNumber', next)}
            error={errorText('roomNumber')}
            disabled={isSaving}
          />
          <Select
            id={fieldId('priority')}
            label={t('priorityLabel')}
            value={values.priority}
            placeholder={t('selectPriority')}
            options={PRIORITY_OPTIONS.map((priority) => ({ value: priority, label: t(PRIORITY_LABEL_KEY[priority]) }))}
            onChange={(next) => setField('priority', next as NewRequestFormValues['priority'])}
            error={errorText('priority')}
            disabled={isSaving}
          />
        </div>

        <div className="maintenance-form__row">
          <Select
            id={fieldId('issueType')}
            label={t('mtFormIssueType')}
            value={values.issueType}
            placeholder={t('mtFormIssueTypePh')}
            options={ISSUE_TYPE_OPTIONS.map((type) => ({ value: type, label: t(ISSUE_TYPE_LABEL_KEY[type]) }))}
            onChange={(next) => setField('issueType', next as NewRequestFormValues['issueType'])}
            error={errorText('issueType')}
            disabled={isSaving}
          />
          <label className="maintenance-form__field">
            <span>{t('mtFormDescription')}</span>
            <input
              id={fieldId('title')}
              type="text"
              placeholder={t('mtFormDescriptionPh')}
              value={values.title}
              maxLength={MT_TITLE_MAX_LENGTH}
              disabled={isSaving}
              aria-invalid={titleError ? true : undefined}
              aria-describedby={titleError ? `${fieldId('title')}-error` : undefined}
              className={titleError ? 'maintenance-form__control--error' : undefined}
              onChange={(event) => setField('title', event.target.value)}
            />
            {titleError && <span id={`${fieldId('title')}-error`} className="maintenance-form__error">{titleError}</span>}
          </label>
        </div>

        <div className="maintenance-form__row">
          <Select
            id={fieldId('status')}
            label={t('statusLabel')}
            value={values.status}
            placeholder={t('mtChooseStatus')}
            options={STATUS_OPTIONS.map((status) => ({ value: status, label: t(STATUS_LABEL_KEY[status]) }))}
            onChange={(next) => setField('status', next as NewRequestFormValues['status'])}
            error={errorText('status')}
            disabled={isSaving}
          />
        </div>

        <label className="maintenance-form__field">
          <span>{t('notesLabel')}</span>
          <textarea
            id={fieldId('notes')}
            rows={4}
            placeholder={t('mtFormNotesPh')}
            value={values.notes}
            maxLength={MT_NOTES_MAX_LENGTH}
            disabled={isSaving}
            aria-invalid={notesError ? true : undefined}
            aria-describedby={notesError ? `${fieldId('notes')}-error` : undefined}
            className={notesError ? 'maintenance-form__control--error' : undefined}
            onChange={(event) => setField('notes', event.target.value)}
          />
          {notesError && <span id={`${fieldId('notes')}-error`} className="maintenance-form__error">{notesError}</span>}
        </label>

        <p className="maintenance-form__hint">
          <Wrench aria-hidden="true" />
          {t('mtFormHint')}
        </p>
      </form>
    </Drawer>
  );
}
