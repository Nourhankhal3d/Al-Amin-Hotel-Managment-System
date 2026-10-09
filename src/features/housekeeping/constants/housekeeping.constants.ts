// Codes are what the app stores. Texts come from i18n via the *_LABEL_KEY maps.
export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'normal' | 'high' | 'critical';
export type TaskType = 'checkout' | 'precheckin' | 'daily' | 'guest';
export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export const STATUS_OPTIONS: TaskStatus[] = ['pending', 'in_progress', 'done'];
export const PRIORITY_OPTIONS: TaskPriority[] = ['normal', 'high', 'critical'];
export const TASK_TYPE_OPTIONS: TaskType[] = ['checkout', 'precheckin', 'daily', 'guest'];

// TEMP: until real rooms are connected. TODO: confirm with backend
export const ROOM_OPTIONS = ['101', '102', '207', '305'];

export const STATUS_TONE: Record<TaskStatus, Tone> = {
  pending: 'warning',
  in_progress: 'info',
  done: 'success',
};

export const PRIORITY_TONE: Record<TaskPriority, Tone> = {
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