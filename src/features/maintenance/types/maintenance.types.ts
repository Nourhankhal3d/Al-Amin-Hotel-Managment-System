import type {
  MaintenanceIssueStatus,
  Priority,
} from '../../../types/common.types';

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