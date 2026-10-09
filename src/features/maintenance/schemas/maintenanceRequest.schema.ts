import { normalizeDigits } from '../../../utils/digits';
import {
  ISSUE_TYPE_OPTIONS,
  MT_NOTES_MAX_LENGTH,
  MT_TITLE_MAX_LENGTH,
  MT_TITLE_MIN_LENGTH,
  PRIORITY_OPTIONS,
  ROOM_OPTIONS,
  STATUS_OPTIONS,
} from '../constants/maintenance.constants';
import type { CreateMaintenanceRequestInput, IssueType, RequestPriority, RequestStatus } from '../types/maintenance.types';

export interface NewRequestFormValues {
  /** What the user typed or picked, digits normalized to 0-9 */
  roomNumber: string;
  priority: RequestPriority | '';
  issueType: IssueType | '';
  title: string;
  status: RequestStatus | '';
  notes: string;
}

/** Values are i18n keys, the component translates them */
export type NewRequestFormErrors = Partial<Record<keyof NewRequestFormValues, string>>;

// A new report starts as "pending"; the receptionist can change it before sending
export const EMPTY_NEW_REQUEST: NewRequestFormValues = {
  roomNumber: '',
  priority: '',
  issueType: '',
  title: '',
  status: 'pending',
  notes: '',
};

export function validateNewRequest(values: NewRequestFormValues): NewRequestFormErrors {
  const errors: NewRequestFormErrors = {};
  const room = normalizeDigits(values.roomNumber.trim());
  const title = values.title.trim();
  if (!room) errors.roomNumber = 'mtErrRoomRequired';
  else if (!ROOM_OPTIONS.includes(room)) errors.roomNumber = 'mtErrRoomNotFound';
  if (!values.priority || !PRIORITY_OPTIONS.includes(values.priority)) errors.priority = 'mtErrPriorityRequired';
  if (!values.issueType || !ISSUE_TYPE_OPTIONS.includes(values.issueType)) errors.issueType = 'mtErrTypeRequired';
  if (!title) errors.title = 'mtErrDescriptionRequired';
  else if (title.length < MT_TITLE_MIN_LENGTH) errors.title = 'mtErrDescriptionTooShort';
  else if (title.length > MT_TITLE_MAX_LENGTH) errors.title = 'mtErrDescriptionTooLong';
  if (!values.status || !STATUS_OPTIONS.includes(values.status)) errors.status = 'mtErrStatusRequired';
  if (values.notes.trim().length > MT_NOTES_MAX_LENGTH) errors.notes = 'mtErrNotesTooLong';
  return errors;
}

export function hasErrors(errors: NewRequestFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Status update in the details drawer: a valid status that differs from the current one. Returns an i18n key or undefined. */
export function validateStatusChange(current: RequestStatus, next: RequestStatus | ''): string | undefined {
  if (!next || !STATUS_OPTIONS.includes(next) || next === current) return 'mtChooseStatus';
  return undefined;
}

/** Call only after validateNewRequest returned no errors */
export function toCreateRequestInput(values: NewRequestFormValues): CreateMaintenanceRequestInput {
  const notes = values.notes.trim();
  return {
    roomNumber: normalizeDigits(values.roomNumber.trim()),
    priority: values.priority as RequestPriority,
    issueType: values.issueType as IssueType,
    title: values.title.trim(),
    status: values.status as RequestStatus,
    ...(notes ? { notes } : {}),
  };
}