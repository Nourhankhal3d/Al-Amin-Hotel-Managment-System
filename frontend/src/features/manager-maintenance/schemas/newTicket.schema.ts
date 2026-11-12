import { normalizeDigits } from '../../../utils/digits';
import {
  NOTES_MAX_LENGTH,
  PRIORITY_OPTIONS,
  PROBLEM_MAX_LENGTH,
  PROBLEM_MIN_LENGTH,
} from '../constants/maintenance.constants';
import type { MaintenancePriority, MaintenanceRoomOption, MaintenanceTicketCreate } from '../types/manager-maintenance.types';

// Same fields and rules as the receptionist's "Report maintenance issue" form (features/maintenance),
// plus an optional technician: the manager can assign the ticket right away.
export interface NewTicketValues {
  /** What the user typed or picked, digits normalized to 0-9 */
  roomNumber: string;
  priority: MaintenancePriority | '';
  /** Optional: a ticket can be logged before a technician is chosen */
  technicianId: string;
  problem: string;
  notes: string;
}

export type NewTicketField = keyof NewTicketValues;

/** Values are i18n keys under manager.maintenance.errors */
export type NewTicketErrors = Partial<Record<NewTicketField, string>>;

export const EMPTY_NEW_TICKET: NewTicketValues = { roomNumber: '', priority: '', technicianId: '', problem: '', notes: '' };

export const NEW_TICKET_FIELD_ORDER: NewTicketField[] = ['roomNumber', 'priority', 'technicianId', 'problem', 'notes'];

export function findRoom(roomNumber: string, rooms: MaintenanceRoomOption[]): MaintenanceRoomOption | undefined {
  const wanted = normalizeDigits(roomNumber.trim());
  return rooms.find((room) => room.roomNumber === wanted);
}

export function validateNewTicket(values: NewTicketValues, rooms: MaintenanceRoomOption[]): NewTicketErrors {
  const errors: NewTicketErrors = {};
  const problem = values.problem.trim();
  if (!values.roomNumber.trim()) errors.roomNumber = 'roomRequired';
  else if (!findRoom(values.roomNumber, rooms)) errors.roomNumber = 'roomNotFound';
  if (!values.priority || !PRIORITY_OPTIONS.includes(values.priority)) errors.priority = 'priorityRequired';
  if (!problem) errors.problem = 'problemRequired';
  else if (problem.length < PROBLEM_MIN_LENGTH) errors.problem = 'problemTooShort';
  else if (problem.length > PROBLEM_MAX_LENGTH) errors.problem = 'problemTooLong';
  if (values.notes.trim().length > NOTES_MAX_LENGTH) errors.notes = 'notesTooLong';
  return errors;
}

/** Request body for POST /manager/maintenance-issues. Call only after validateNewTicket returned no errors. */
export function toCreateBody(values: NewTicketValues, rooms: MaintenanceRoomOption[]): MaintenanceTicketCreate {
  const notes = values.notes.trim();
  return {
    room_id: findRoom(values.roomNumber, rooms)?.roomId ?? '',
    problem: values.problem.trim(),
    priority: values.priority as MaintenancePriority,
    ...(values.technicianId ? { assigned_to_staff_id: values.technicianId } : {}),
    ...(notes ? { notes } : {}),
  };
}
