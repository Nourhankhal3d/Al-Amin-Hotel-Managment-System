import { normalizeDigits } from '../../../utils/digits';
import {
  HK_CLEANER_MAX_LENGTH,
  HK_NOTES_MAX_LENGTH,
  PRIORITY_OPTIONS,
  ROOM_OPTIONS,
} from '../constants/housekeeping.constants';
import type { CleaningTaskCreate, Priority } from '../types/housekeeping.types';

export interface NewTaskFormValues {
  /** What the user typed or picked, digits normalized to 0-9 */
  roomNumber: string;
  priority: Priority | '';
  cleanerName: string;
  notes: string;
}

/** Values are i18n keys, the component translates them */
export type NewTaskFormErrors = Partial<Record<keyof NewTaskFormValues, string>>;

// A new task always starts as "pending" on the server, so the form has no status field
export const EMPTY_NEW_TASK: NewTaskFormValues = { roomNumber: '', priority: '', cleanerName: '', notes: '' };

export function validateNewTask(values: NewTaskFormValues): NewTaskFormErrors {
  const errors: NewTaskFormErrors = {};
  const room = normalizeDigits(values.roomNumber.trim());
  if (!room) errors.roomNumber = 'hkErrRoomRequired';
  else if (!ROOM_OPTIONS.includes(room)) errors.roomNumber = 'hkErrRoomNotFound';
  if (!values.priority || !PRIORITY_OPTIONS.includes(values.priority)) errors.priority = 'hkErrPriorityRequired';
  if (values.cleanerName.trim().length > HK_CLEANER_MAX_LENGTH) errors.cleanerName = 'hkErrCleanerTooLong';
  if (values.notes.trim().length > HK_NOTES_MAX_LENGTH) errors.notes = 'hkErrNotesTooLong';
  return errors;
}

export function hasErrors(errors: NewTaskFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Request body for POST /cleaning-tasks. Call only after validateNewTask returned no errors. */
export function toCreateTaskBody(values: NewTaskFormValues): CleaningTaskCreate {
  const cleanerName = values.cleanerName.trim();
  const notes = values.notes.trim();
  return {
    room_id: Number(normalizeDigits(values.roomNumber.trim())),
    priority: values.priority as Priority,
    ...(cleanerName ? { cleaner_name: cleanerName } : {}),
    ...(notes ? { notes } : {}),
  };
}
