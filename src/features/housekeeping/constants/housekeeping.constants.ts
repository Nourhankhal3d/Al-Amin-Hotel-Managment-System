import type { BadgeTone } from '../../../components/ui/Badge';
import type { TaskLogEvent, TaskPriority, TaskStatus, TaskType } from '../types/housekeeping.types';

export const HK_PAGE_SIZE = 5;
export const HK_NOTES_MAX_LENGTH = 500;

export const STATUS_OPTIONS: TaskStatus[] = ['pending', 'in_progress', 'done'];
export const PRIORITY_OPTIONS: TaskPriority[] = ['normal', 'high', 'critical'];
export const TASK_TYPE_OPTIONS: TaskType[] = ['checkout', 'precheckin', 'daily', 'guest'];

// TEMP: until real rooms are connected. TODO: confirm with backend
export const ROOM_OPTIONS = ['101', '102', '112', '207', '210', '214', '305', '308', '312'];

export const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  pending: 'warning',
  in_progress: 'info',
  done: 'success',
};

export const PRIORITY_TONE: Record<TaskPriority, BadgeTone> = {
  normal: 'neutral',
  high: 'warning',
  critical: 'danger',
};

export const STATUS_LABEL_KEY: Record<TaskStatus, string> = {
  pending: 'hkStatus_pending',
  in_progress: 'hkStatus_in_progress',
  done: 'hkStatus_done',
};

export const PRIORITY_LABEL_KEY: Record<TaskPriority, string> = {
  normal: 'priorityNormal',
  high: 'priorityHigh',
  critical: 'priorityCritical',
};

export const TASK_TYPE_LABEL_KEY: Record<TaskType, string> = {
  checkout: 'hkType_checkout',
  precheckin: 'hkType_precheckin',
  daily: 'hkType_daily',
  guest: 'hkType_guest',
};

export const LOG_TITLE_KEY: Record<TaskLogEvent, string> = {
  created: 'hkLog_created',
  assigned: 'hkLog_assigned',
  started: 'hkLog_started',
  done: 'hkLog_done',
  status_changed: 'hkLog_statusChanged',
};

export const LOG_DESCRIPTION_KEY: Record<TaskLogEvent, string> = {
  created: 'hkLog_createdDesc',
  assigned: 'hkLog_assignedDesc',
  started: 'hkLog_startedDesc',
  done: 'hkLog_doneDesc',
  status_changed: 'hkLog_statusChangedDesc',
};
