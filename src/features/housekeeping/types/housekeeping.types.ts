// Same shape as the backend API (snake_case), as agreed with the data layer (Member 5).
import type { CleaningTaskStatus, Priority } from '../../../types/common.types';

export type { CleaningTaskStatus, Priority };

export interface HousekeepingTask {
  task_id: number;
  room_id: number;
  priority: Priority;
  status: CleaningTaskStatus;
  assigned_date: string;
  shift_id: number;
  notes?: string | null;
  cleaner_name?: string | null;
  finished_date?: string | null;
  assigned_by_staff_id?: number | null;
}

export interface CleaningTaskCreate {
  room_id: number;
  priority: Priority;
  cleaner_name?: string;
  notes?: string;
}

export interface CleaningTaskUpdate {
  cleaner_name?: string;
  priority?: Priority;
  notes?: string;
  // The receptionist can only move a task from pending to done
  status?: 'done';
}

// Page-only types (not sent to the backend)
export type HousekeepingFilterName = 'status' | 'priority' | 'floor';

export interface HousekeepingFilters {
  q: string;
  status: CleaningTaskStatus | '';
  priority: Priority | '';
  floor: string;
  page: number;
}

/** The only room field this page needs from GET /rooms */
export interface RoomRef {
  room_id: number;
}
