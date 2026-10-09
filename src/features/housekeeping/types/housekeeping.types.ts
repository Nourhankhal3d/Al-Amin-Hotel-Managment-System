// Codes are what the app stores. Texts come from i18n via the *_LABEL_KEY maps in constants.
// TODO: confirm all fields with backend
export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type TaskPriority = 'normal' | 'high' | 'critical';
export type TaskType = 'checkout' | 'precheckin' | 'daily' | 'guest';

// Log entries are stored as events, not as text, so they can be shown in any language.
export type TaskLogEvent = 'created' | 'assigned' | 'started' | 'done' | 'status_changed';

export interface TaskLogEntry {
  id: string;
  event: TaskLogEvent;
  /** ISO date-time */
  at: string;
  /** Only for `status_changed`: the new status */
  status?: TaskStatus;
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO date-time */
  createdAt: string;
  /** ISO date-time. TODO: confirm with backend */
  assignedAt?: string;
  /** ISO date-time. TODO: confirm with backend */
  followUpAt?: string;
  /** TODO: confirm with backend */
  assignee?: string;
  /** Free text written by the receptionist, shown as is (not translated) */
  notes?: string;
  log: TaskLogEntry[];
}

export interface CreateHousekeepingTaskInput {
  roomNumber: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
}

export interface UpdateHousekeepingTaskStatusInput {
  id: string;
  status: TaskStatus;
}

export type HousekeepingFilterName = 'status' | 'priority' | 'floor';

export interface HousekeepingFilters {
  q: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  floor: string;
  page: number;
}
