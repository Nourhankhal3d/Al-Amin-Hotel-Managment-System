// Codes are what the app stores. Texts come from i18n via the *_LABEL_KEY maps in constants.
// TODO: confirm all fields with backend
export type RequestStatus = 'pending' | 'in_progress' | 'resolved';
export type RequestPriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueType = 'plumbing' | 'electrical' | 'ac' | 'furniture' | 'other';

// Log entries are stored as events, not as text, so they can be shown in any language.
export type RequestLogEvent = 'reported' | 'assigned' | 'started' | 'resolved' | 'status_changed';

export interface RequestLogEntry {
  id: string;
  event: RequestLogEvent;
  /** ISO date-time */
  at: string;
  /** Only for `status_changed`: the new status */
  status?: RequestStatus;
}

export interface MaintenanceRequest {
  id: string;
  /** Shown as MT-128 */
  referenceNumber: number;
  roomNumber: string;
  issueType: IssueType;
  /** Short description written by the receptionist, shown as the issue title */
  title: string;
  status: RequestStatus;
  priority: RequestPriority;
  /** ISO date-time */
  reportedAt: string;
  /** ISO date-time */
  updatedAt: string;
  /** ISO date-time. TODO: confirm with backend */
  expectedFixAt?: string;
  /** ISO date-time, set when the request is resolved. TODO: confirm with backend */
  resolvedAt?: string;
  /** TODO: confirm with backend */
  assignee?: string;
  /** Free text, shown as is (not translated) */
  notes?: string;
  log: RequestLogEntry[];
}

export interface CreateMaintenanceRequestInput {
  roomNumber: string;
  issueType: IssueType;
  title: string;
  priority: RequestPriority;
  status: RequestStatus;
  notes?: string;
}

export interface UpdateMaintenanceStatusInput {
  id: string;
  status: RequestStatus;
}

export type MaintenanceFilterName = 'room' | 'priority' | 'status';

export interface MaintenanceFilters {
  q: string;
  room: string;
  priority: RequestPriority | '';
  status: RequestStatus | '';
  page: number;
}
