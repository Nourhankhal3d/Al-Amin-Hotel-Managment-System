// Codes are what the app stores. Texts come from i18n via the *_LABEL_KEY maps.
export type RequestStatus = 'pending' | 'in_progress' | 'resolved';
export type RequestPriority = 'normal' | 'high' | 'critical';
export type IssueType = 'plumbing' | 'electrical' | 'ac' | 'furniture' | 'other';
export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export const STATUS_OPTIONS: RequestStatus[] = ['pending', 'in_progress', 'resolved'];
export const PRIORITY_OPTIONS: RequestPriority[] = ['normal', 'high', 'critical'];
export const ISSUE_TYPE_OPTIONS: IssueType[] = ['plumbing', 'electrical', 'ac', 'furniture', 'other'];

// TEMP: until real rooms are connected. TODO: confirm with backend
export const ROOM_OPTIONS = ['101', '112', '207', '305'];

export const STATUS_TONE: Record<RequestStatus, Tone> = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
};

export const PRIORITY_TONE: Record<RequestPriority, Tone> = {
  normal: 'neutral',
  high: 'warning',
  critical: 'danger',
};

export const STATUS_LABEL_KEY: Record<RequestStatus, string> = {
  pending: 'mtStatus_pending',
  in_progress: 'mtStatus_in_progress',
  resolved: 'mtStatus_resolved',
};

export const PRIORITY_LABEL_KEY: Record<RequestPriority, string> = {
  normal: 'priorityNormal',
  high: 'priorityHigh',
  critical: 'priorityCritical',
};

export const ISSUE_TYPE_LABEL_KEY: Record<IssueType, string> = {
  plumbing: 'mtType_plumbing',
  electrical: 'mtType_electrical',
  ac: 'mtType_ac',
  furniture: 'mtType_furniture',
  other: 'mtType_other',
};