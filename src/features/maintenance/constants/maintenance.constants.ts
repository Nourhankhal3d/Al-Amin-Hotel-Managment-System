import type { BadgeTone } from '../../../components/ui/Badge';
import type { IssueType, RequestLogEvent, RequestPriority, RequestStatus } from '../types/maintenance.types';

export const MT_PAGE_SIZE = 4;
export const MT_TITLE_MIN_LENGTH = 3;
export const MT_TITLE_MAX_LENGTH = 80;
export const MT_NOTES_MAX_LENGTH = 500;

export const STATUS_OPTIONS: RequestStatus[] = ['pending', 'in_progress', 'resolved'];
// Four levels, as in the approved prototype
export const PRIORITY_OPTIONS: RequestPriority[] = ['low', 'medium', 'high', 'critical'];
export const ISSUE_TYPE_OPTIONS: IssueType[] = ['plumbing', 'electrical', 'ac', 'furniture', 'other'];

// TEMP: until real rooms are connected. TODO: confirm with backend
export const ROOM_OPTIONS = ['101', '102', '112', '202', '206', '207', '210', '305', '308', '312'];

export const STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
};

export const PRIORITY_TONE: Record<RequestPriority, BadgeTone> = {
  low: 'success',
  medium: 'neutral',
  high: 'warning',
  critical: 'danger',
};

export const STATUS_LABEL_KEY: Record<RequestStatus, string> = {
  pending: 'mtStatus_pending',
  in_progress: 'mtStatus_in_progress',
  resolved: 'mtStatus_resolved',
};

export const PRIORITY_LABEL_KEY: Record<RequestPriority, string> = {
  low: 'mtPriority_low',
  medium: 'mtPriority_medium',
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

export const LOG_TITLE_KEY: Record<RequestLogEvent, string> = {
  reported: 'mtLog_reported',
  assigned: 'mtLog_assigned',
  started: 'mtLog_started',
  resolved: 'mtLog_resolved',
  status_changed: 'mtLog_statusChanged',
};

export const LOG_DESCRIPTION_KEY: Record<RequestLogEvent, string> = {
  reported: 'mtLog_reportedDesc',
  assigned: 'mtLog_assignedDesc',
  started: 'mtLog_startedDesc',
  resolved: 'mtLog_resolvedDesc',
  status_changed: 'mtLog_statusChangedDesc',
};
