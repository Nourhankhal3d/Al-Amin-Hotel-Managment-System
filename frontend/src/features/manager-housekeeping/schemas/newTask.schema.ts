import { normalizeDigits } from '../../../utils/digits';
import { CLEANER_MAX_LENGTH, NOTES_MAX_LENGTH, PRIORITY_OPTIONS } from '../constants/housekeeping.constants';
import type { CleanerOption, HousekeepingPriority, HousekeepingTaskCreate, RoomOption } from '../types/manager-housekeeping.types';
import { normalizeSearch } from '../utils/housekeepingDisplay';

// Same fields and rules as the receptionist's "Add cleaning task" form (features/housekeeping),
// except that the cleaner can be picked from the housekeepers list as well as typed.
export interface NewTaskValues {
  /** What the user typed or picked, digits normalized to 0-9 */
  roomNumber: string;
  /** A housekeeper's staff id once picked from the list, otherwise the typed name */
  cleaner: string;
  priority: HousekeepingPriority | '';
  notes: string;
}

export type NewTaskField = keyof NewTaskValues;

/** Values are i18n keys under manager.housekeeping.errors */
export type NewTaskErrors = Partial<Record<NewTaskField, string>>;

export const EMPTY_NEW_TASK: NewTaskValues = { roomNumber: '', cleaner: '', priority: '', notes: '' };

export const NEW_TASK_FIELD_ORDER: NewTaskField[] = ['roomNumber', 'cleaner', 'priority', 'notes'];

export function findRoom(roomNumber: string, rooms: RoomOption[]): RoomOption | undefined {
  const wanted = normalizeDigits(roomNumber.trim());
  return rooms.find((room) => room.roomNumber === wanted);
}

/** The picked housekeeper, or the one whose name was typed in full */
export function findCleaner(value: string, cleaners: CleanerOption[]): CleanerOption | undefined {
  const typed = normalizeSearch(value);
  return cleaners.find((cleaner) => cleaner.id === value || normalizeSearch(cleaner.name) === typed);
}

export function validateNewTask(values: NewTaskValues, rooms: RoomOption[], cleaners: CleanerOption[]): NewTaskErrors {
  const errors: NewTaskErrors = {};
  if (!values.roomNumber.trim()) errors.roomNumber = 'roomRequired';
  else if (!findRoom(values.roomNumber, rooms)) errors.roomNumber = 'roomNotFound';
  if (!values.priority || !PRIORITY_OPTIONS.includes(values.priority)) errors.priority = 'priorityRequired';
  if (!findCleaner(values.cleaner, cleaners) && values.cleaner.trim().length > CLEANER_MAX_LENGTH) errors.cleaner = 'cleanerTooLong';
  if (values.notes.trim().length > NOTES_MAX_LENGTH) errors.notes = 'notesTooLong';
  return errors;
}

/** Request body for POST /manager/housekeeping-tasks. Call only after validateNewTask returned no errors. */
export function toCreateBody(values: NewTaskValues, rooms: RoomOption[], cleaners: CleanerOption[]): HousekeepingTaskCreate {
  const room = findRoom(values.roomNumber, rooms);
  const cleaner = findCleaner(values.cleaner, cleaners);
  const typedName = values.cleaner.trim();
  const notes = values.notes.trim();
  return {
    room_id: room?.roomId ?? '',
    priority: values.priority as HousekeepingPriority,
    ...(cleaner ? { assigned_to_staff_id: cleaner.id, cleaner_name: cleaner.name } : {}),
    ...(!cleaner && typedName ? { cleaner_name: typedName } : {}),
    ...(notes ? { notes } : {}),
  };
}
