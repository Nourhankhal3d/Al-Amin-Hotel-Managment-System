// Same shape as the backend API (snake_case), as agreed with the data layer (Member 5).
// TODO(merge): Priority and MaintenanceIssueStatus live in src/types/common.types.ts on the
// data-layer branch; after the merge, import them from there and delete the two lines below.
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceIssueStatus = 'open' | 'in_progress' | 'resolved';

export interface MaintenanceRequest {
  issue_id: number;
  room_id: number;
  problem: string;
  priority: Priority;
  status: MaintenanceIssueStatus;
  created_date: string;
  shift_id: number;
  staff_id: number;
  notes?: string | null;
  resolved_date?: string | null;
}

export interface MaintenanceIssueCreate {
  room_id: number;
  problem: string;
  priority: Priority;
  notes?: string;
}

export interface MaintenanceIssueUpdate {
  priority?: Priority;
  notes?: string;
  status?: 'in_progress' | 'resolved';
}

// Page-only types (not sent to the backend)
export type MaintenanceFilterName = 'room' | 'priority' | 'status';

export interface MaintenanceFilters {
  q: string;
  room: string;
  priority: Priority | '';
  status: MaintenanceIssueStatus | '';
  page: number;
}
