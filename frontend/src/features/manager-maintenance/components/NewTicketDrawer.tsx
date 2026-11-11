import { useCallback, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Wrench } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Combobox } from '../../../components/ui/Combobox';
import { Drawer } from '../../../components/ui/Drawer';
import { Select } from '../../../components/ui/Select';
import { useLanguage } from '../../../core/i18n/useLanguage';
import { formatNumber } from '../../../utils/format';
import {
  MAINTENANCE_I18N,
  NOTES_MAX_LENGTH,
  PRIORITY_OPTIONS,
  PROBLEM_MAX_LENGTH,
  PROBLEM_MIN_LENGTH,
} from '../constants/maintenance.constants';
import {
  EMPTY_NEW_TICKET,
  NEW_TICKET_FIELD_ORDER,
  validateNewTicket,
  type NewTicketErrors,
  type NewTicketField,
  type NewTicketValues,
} from '../schemas/newTicket.schema';
import type { MaintenanceRoomOption, TechnicianOption } from '../types/manager-maintenance.types';
import { formatRoom } from '../utils/maintenanceDisplay';
import './NewTicketDrawer.css';

const FORM_ID = 'manager-maintenance-ticket-form';

interface NewTicketDrawerProps {
  open: boolean;
  rooms: MaintenanceRoomOption[];
  technicians: TechnicianOption[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: NewTicketValues) => void;
}

// Same layout, fields and rules as the receptionist's "Report maintenance issue" drawer,
// plus an optional technician. The room can be typed or picked from the list.
export function NewTicketDrawer({ open, ...props }: NewTicketDrawerProps) {
  if (!open) return null;
  // Mounted only while open, so the form always starts empty
  return <NewTicketForm {...props} />;
}

function NewTicketForm({ rooms, technicians, isSaving, onClose, onSubmit }: Omit<NewTicketDrawerProps, 'open'>) {
  const { language, t: translate } = useLanguage();
  const t = useCallback((key: string) => translate(`${MAINTENANCE_I18N}.${key}`), [translate]);
  const baseId = useId();
  const fieldId = (field: NewTicketField) => `${baseId}-${field}`;
  const [values, setValues] = useState<NewTicketValues>(EMPTY_NEW_TICKET);
  const [errors, setErrors] = useState<NewTicketErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Errors appear after the first submit, then update live while the user fixes them
  function setField<F extends NewTicketField>(field: F, value: NewTicketValues[F]) {
    const next = { ...values, [field]: value };
    setValues(next);
    if (submitted) setErrors(validateNewTicket(next, rooms));
  }

  const errorText = (field: NewTicketField) => {
    const key = errors[field];
    if (!key) return undefined;
    const max = field === 'notes' ? NOTES_MAX_LENGTH : PROBLEM_MAX_LENGTH;
    return t(`errors.${key}`)
      .replace('{min}', formatNumber(PROBLEM_MIN_LENGTH, language))
      .replace('{max}', formatNumber(max, language));
  };

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSaving) return;
    setSubmitted(true);
    const found = validateNewTicket(values, rooms);
    setErrors(found);
    const firstInvalid = NEW_TICKET_FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      // Take the user to the first field that needs fixing
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    onSubmit(values);
  }

  const problemError = errorText('problem');
  const notesError = errorText('notes');

  return (
    <Drawer
      open
      title={t('ticketForm.title')}
      eyebrow={t('ticketForm.eyebrow')}
      closeLabel={t('close')}
      onClose={onClose}
      className="mt-ticket-form-drawer"
      footer={(
        <div className="mt-ticket-form__footer">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>{t('cancel')}</Button>
          <Button type="submit" form={FORM_ID} disabled={isSaving}>{isSaving ? t('saving') : t('ticketForm.submit')}</Button>
        </div>
      )}
    >
      <form id={FORM_ID} className="mt-ticket-form" onSubmit={handleSubmit} noValidate>
        <div className="mt-ticket-form__row">
          <Combobox
            id={fieldId('roomNumber')}
            label={t('ticketForm.room')}
            value={values.roomNumber}
            options={rooms.map((room) => ({ value: room.roomNumber, label: formatRoom(room.roomNumber, language) }))}
            inputMode="numeric"
            placeholder={t('ticketForm.roomPlaceholder')}
            noResultsLabel={t('ticketForm.roomNoResults')}
            onChange={(next) => setField('roomNumber', next)}
            error={errorText('roomNumber')}
            disabled={isSaving}
          />
          <Select
            id={fieldId('priority')}
            label={t('fields.priority')}
            value={values.priority}
            placeholder={t('ticketForm.priorityPlaceholder')}
            options={PRIORITY_OPTIONS.map((priority) => ({ value: priority, label: t(`priorities.${priority}`) }))}
            onChange={(next) => setField('priority', next as NewTicketValues['priority'])}
            error={errorText('priority')}
            disabled={isSaving}
          />
        </div>

        <div className="mt-ticket-form__row">
          <Select
            id={fieldId('technicianId')}
            label={t('fields.technician')}
            value={values.technicianId}
            placeholder={t('ticketForm.technicianPlaceholder')}
            options={[
              { value: '', label: t('ticketForm.assignLater') },
              ...technicians.map((technician) => ({ value: technician.id, label: technician.name })),
            ]}
            onChange={(next) => setField('technicianId', next)}
            disabled={isSaving}
          />
        </div>

        <label className="mt-ticket-form__field">
          <span>{t('ticketForm.problem')}</span>
          <input
            id={fieldId('problem')}
            type="text"
            placeholder={t('ticketForm.problemPlaceholder')}
            value={values.problem}
            maxLength={PROBLEM_MAX_LENGTH}
            disabled={isSaving}
            aria-invalid={problemError ? true : undefined}
            aria-describedby={problemError ? `${fieldId('problem')}-error` : undefined}
            className={problemError ? 'mt-ticket-form__control--error' : undefined}
            onChange={(event) => setField('problem', event.target.value)}
          />
          {problemError && <span id={`${fieldId('problem')}-error`} className="mt-ticket-form__error">{problemError}</span>}
        </label>

        <label className="mt-ticket-form__field">
          <span>{t('ticketForm.notes')}</span>
          <textarea
            id={fieldId('notes')}
            rows={4}
            placeholder={t('ticketForm.notesPlaceholder')}
            value={values.notes}
            maxLength={NOTES_MAX_LENGTH}
            disabled={isSaving}
            aria-invalid={notesError ? true : undefined}
            aria-describedby={notesError ? `${fieldId('notes')}-error` : undefined}
            className={notesError ? 'mt-ticket-form__control--error' : undefined}
            onChange={(event) => setField('notes', event.target.value)}
          />
          {notesError && <span id={`${fieldId('notes')}-error`} className="mt-ticket-form__error">{notesError}</span>}
        </label>

        <p className="mt-ticket-form__hint">
          <Wrench aria-hidden="true" />
          {t('ticketForm.hint')}
        </p>
      </form>
    </Drawer>
  );
}
