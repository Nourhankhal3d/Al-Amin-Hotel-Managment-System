// Same shape as the backend API (snake_case), as agreed with the data layer (Member 5).
// TODO(merge): Priority and CleaningTaskStatus live in src/types/common.types.ts on the
// data-layer branch; after the merge, import them from there and delete the two lines below.
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type CleaningTaskStatus = 'pending' | 'done';

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
