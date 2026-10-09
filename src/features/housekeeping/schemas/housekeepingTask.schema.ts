import { HK_NOTES_MAX_LENGTH, PRIORITY_OPTIONS, ROOM_OPTIONS, STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '../constants/housekeeping.constants';
import type { CreateHousekeepingTaskInput, TaskPriority, TaskStatus, TaskType } from '../types/housekeeping.types';
import { normalizeDigits } from '../../../utils/digits';

export interface NewTaskFormValues {
  /** What the user typed or picked, digits normalized to 0-9 */
  roomNumber: string;
  taskType: TaskType | '';
  priority: TaskPriority | '';
  status: TaskStatus | '';
  notes: string;
}

/** Values are i18n keys, the component translates them */
export type NewTaskFormErrors = Partial<Record<keyof NewTaskFormValues, string>>;

// A new report starts as "pending"; the receptionist can change it before sending
export const EMPTY_NEW_TASK: NewTaskFormValues = { roomNumber: '', taskType: '', priority: '', status: 'pending', notes: '' };

export function validateNewTask(values: NewTaskFormValues): NewTaskFormErrors {
  const errors: NewTaskFormErrors = {};
  const room = normalizeDigits(values.roomNumber.trim());
  if (!room) errors.roomNumber = 'hkErrRoomRequired';
  else if (!ROOM_OPTIONS.includes(room)) errors.roomNumber = 'hkErrRoomNotFound';
  if (!values.taskType || !TASK_TYPE_OPTIONS.includes(values.taskType)) errors.taskType = 'hkErrTypeRequired';
  if (!values.priority || !PRIORITY_OPTIONS.includes(values.priority)) errors.priority = 'hkErrPriorityRequired';
  if (!values.status || !STATUS_OPTIONS.includes(values.status)) errors.status = 'hkErrStatusRequired';
  if (values.notes.trim().length > HK_NOTES_MAX_LENGTH) errors.notes = 'hkErrNotesTooLong';
  return errors;
}

export function hasErrors(errors: NewTaskFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Status update in the details drawer: a valid status that differs from the current one. Returns an i18n key or undefined. */
export function validateStatusChange(current: TaskStatus, next: TaskStatus | ''): string | undefined {
  if (!next || !STATUS_OPTIONS.includes(next) || next === current) return 'hkChooseStatus';
  return undefined;
}

/** Call only after validateNewTask returned no errors */
export function toCreateTaskInput(values: NewTaskFormValues): CreateHousekeepingTaskInput {
  const notes = values.notes.trim();
  return {
    roomNumber: normalizeDigits(values.roomNumber.trim()),
    taskType: values.taskType as TaskType,
    priority: values.priority as TaskPriority,
    status: values.status as TaskStatus,
    ...(notes ? { notes } : {}),
  };
}
